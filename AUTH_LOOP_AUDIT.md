# AUTH_LOOP_AUDIT.md

## Scope / files inspected (mandatory)

- `apps/web/src/lib/api.ts`
- `apps/web/src/app/providers.tsx`
- `apps/web/src/app/(auth)/login/page.tsx`
- `apps/web/src/app/(auth)/register/page.tsx`
- `apps/web/src/app/(admin)/layout.tsx`
- `apps/web/src/middleware.ts`
- `apps/web/src/lib/authApi.ts`

This audit is **read-only**: it explains the *real* redirect loop path based on current code.

---

## 1) Root Cause (clear)

The infinite `/login` loop is caused by **a global auth hydration call** (`GET /api/auth/me` in `providers.tsx`) that returns **401** for unauthenticated users, combined with a **global Axios 401 interceptor** (`apps/web/src/lib/api.ts`) that **forces `window.location.href = "/login"` on *every* 401**, including the 401 produced by `/api/auth/me` itself.

Because `providers.tsx` runs on **every route including `/login`**, the following happens:
- Load `/login`
- Providers calls `/api/auth/me`
- Backend returns `401` (expected when not logged in)
- Axios interceptor runs and reloads `/login`
- Page reload triggers Providers again → repeats forever

This loop does **not** require middleware or admin layout redirects. It happens on `/login` itself.

---

## 2) Loop Flow (step-by-step chain causing infinite requests)

### Loop chain A (most common, unauthenticated user)

**Step 1:** User navigates to `/login`

**Step 2:** Root layout mounts `Providers` (`apps/web/src/app/layout.tsx` wraps `<Providers>`).

**Step 3:** `Providers` runs the mount effect:

```ts
// apps/web/src/app/providers.tsx
useEffect(() => {
  (async () => {
    try {
      const { user } = await getMeApi();  // GET /api/auth/me
      setAuth(user, null);
    } catch {
      clearAuth();
    } finally {
      setAuthChecked(true);
    }
  })();
}, ...)
```

**Step 4:** `getMeApi()` calls `/api/auth/me` using the shared Axios client:

```ts
// apps/web/src/lib/authApi.ts
export async function getMeApi(): Promise<{ user: User }> {
  return api.get("/api/auth/me");
}
```

**Step 5:** User is not logged in → backend responds `401` for `/api/auth/me`.

**Step 6:** Axios response interceptor runs **for any 401** and executes:

```ts
// apps/web/src/lib/api.ts
if (error.response?.status === 401) {
  localStorage.removeItem("ecommerce-auth");
  window.location.href = "/login";
}
```

**Step 7:** Browser reloads `/login` (full page navigation).

**Step 8:** Repeat Step 2 forever.

**Observed symptom:** dev server logs show repeated:
- `GET /login 200` (looping)
- plus repeated failing requests to `/api/auth/me` (often visible in the Network tab)

### Loop chain B (authenticated state becomes invalid)

Even when logged in, if the cookie expires or becomes invalid:

**Step 1:** User is on any page.
**Step 2:** Some request returns 401 (including `/api/auth/me`).
**Step 3:** Axios interceptor forces `/login`.
**Step 4:** `/login` loads → Providers runs `/api/auth/me` again.
**Step 5:** If cookie is invalid, `/api/auth/me` 401 triggers another forced `/login` reload.

This makes the login page unusable while unauthenticated because it self-triggers the redirect.

---

## 3) Problematic code sections (exact snippets responsible)

### 3.1 Global 401 redirect (Axios interceptor)

File: `apps/web/src/lib/api.ts`

```ts
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    // ...
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("ecommerce-auth");
        window.location.href = "/login";
      }
    }
    // ...
  },
);
```

**Issue:** This runs for *every* 401, even:
- The expected unauthenticated `/api/auth/me` call
- Any 401 triggered while you are already on `/login` or `/register`
- Any 401 during initial app boot

It causes a **hard navigation** (`window.location.href`) which restarts the whole app, re-running Providers.

### 3.2 Global auth hydration call on every page

File: `apps/web/src/app/providers.tsx`

```ts
useEffect(() => {
  (async () => {
    try {
      const { user } = await getMeApi();
      setAuth(user, null);
    } catch {
      clearAuth();
    } finally {
      setAuthChecked(true);
    }
  })();
}, [setAuth, clearAuth]);
```

**Issue:** This runs on `/login` too, and it calls an endpoint that reasonably returns 401 when logged out.

---

## 4) Conflicting systems (redirect sources) — what is involved vs not involved

### 4.1 Axios (involved)
- **Yes**. It forces `/login` for every 401, including `/api/auth/me`.
- It does not check current route or whether the request was an auth-check.

### 4.2 Providers hydration (involved)
- **Yes**. It triggers `/api/auth/me` on mount on every route.
- Combined with the Axios interceptor, it creates a self-reinforcing loop.

### 4.3 Middleware (not the loop trigger)
File: `apps/web/src/middleware.ts`
- Only matches: `/admin/:path*`, `/checkout/:path*`, `/orders/:path*`, `/account/:path*`
- `/login` is not matched.
- So middleware is **not** the cause of repeated `GET /login 200`.

### 4.4 Admin layout redirect (not the loop trigger for `/login`)
File: `apps/web/src/app/(admin)/layout.tsx`
- Redirects happen in `useEffect`.
- But the loop is happening on `/login` itself, and this layout doesn’t wrap `/login`.

### 4.5 Login/Register pages (not the loop trigger)
Files:
- `apps/web/src/app/(auth)/login/page.tsx`
- `apps/web/src/app/(auth)/register/page.tsx`

They **do not** call any API on mount. The only automatic call on `/login` is coming from `Providers`.

---

## 5) Hydration issues (how it contributes)

### Does `providers.tsx` call `/api/auth/me` on every page?
Yes. It runs once per mount of the root `Providers`, which occurs on every full navigation / reload.

### What happens when user is NOT logged in?
Backend returns 401 → Axios interceptor forces navigation to `/login`.

### Why is that fatal now?
Because unauthenticated is a normal state on `/login`, and the global interceptor is treating that expected 401 as an exceptional condition that must force navigation to `/login` again.

---

## 6) useEffect redirects audit

### Observed redirects
- `apps/web/src/app/(admin)/layout.tsx`: redirects when `user === null` or role mismatch (admin-only).
- `apps/web/src/lib/api.ts`: redirects on 401 globally.

### Why the loop repeats
The only redirect that can repeatedly trigger on `/login` is the **Axios 401 redirect**.

---

## 7) Severity (why dangerous in production)

- **User cannot reach the login page reliably** when unauthenticated (the app keeps hard-reloading).
- **No graceful unauthenticated state**: expected 401s become hard navigations.
- **Amplified traffic**: repeated `/api/auth/me` calls can spike backend load.
- **Poor UX / instability**: constant reload prevents form input and debugging.
- **Hard to diagnose**: logs show `/login 200` repeatedly; the real trigger is the hidden `/api/auth/me` 401 + interceptor.

---

## 8) Fix Strategy (NO CODE) — conceptual changes to stop the loop

Any of the following strategies would break the loop; you can combine them:

### Strategy A (recommended): Make `/api/auth/me` 401 “non-redirecting”
- Treat 401 from `/api/auth/me` as “not logged in” and **do not navigate**.
- Providers should clear auth state and proceed to render `/login` normally.

### Strategy B: Add route guard in the Axios interceptor
- Before redirecting, check `window.location.pathname`:
  - If already on `/login` or `/register`, **do not redirect**.
- This prevents “redirect to the same page” reload loops.

### Strategy C: Avoid `window.location.href` for auth failures
- Prefer a soft navigation (`router.push`) where appropriate (still must avoid pushing to the current route repeatedly).
- Or centralize auth handling in React state without navigation.

### Strategy D: Use a dedicated Axios client for auth hydration
- Use a separate Axios instance for `/api/auth/me` that does **not** apply global 401 redirect behavior.

### Strategy E: Only call `/api/auth/me` when it makes sense
- For example: only call it when you detect a cookie likely exists, or when visiting protected pages.
- (Caution: cookie is httpOnly; “detecting cookie” is not possible in JS reliably. This is why Strategy A is usually cleaner.)

---

## 9) Expected “clean” behavior after conceptual fix

- Visiting `/login` while logged out:
  - Providers calls `/api/auth/me` → 401 → Providers sets user=null → **renders login page normally** (no redirect).
- Visiting `/admin` while logged out:
  - Middleware sees missing cookie → redirects to `/login?callbackUrl=/admin`.
  - Providers calls `/api/auth/me` → 401 → login page renders normally.
- Visiting `/admin` with valid cookie:
  - Providers calls `/api/auth/me` → 200 → user set → admin layout renders.

