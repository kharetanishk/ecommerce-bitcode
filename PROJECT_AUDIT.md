# PROJECT_AUDIT.md

## 1. Project Overview

**Project name:** `ecommerce-bitcode` (monorepo)

**Purpose:** A full-stack ecommerce application with:
- A **Next.js 15** frontend (`apps/web`) using the App Router and client components for most UI flows.
- An **Express.js** backend (`apps/api`) serving REST endpoints for auth, products, cart, orders, reviews, returns, delivery, inventory, and admin operations.

**Key features implemented (frontend routes/components present):**
- Public storefront:
  - Products listing (`/products`)
  - Product detail (`/products/:slug`)
  - Cart (`/cart`)
  - Checkout (`/checkout`)
  - Orders (`/orders` and `/orders/:id`)
  - Reviews on product pages
  - Pincode/serviceability checking during checkout
  - Return request section
- Auth and user experience:
  - Login and register pages (`/login`, `/register`)
  - Logout flow (via API call + client redirect)
  - Auth UI uses a Zustand store and the `useAuth()` hook
- Admin panel (client-side role gate):
  - Admin dashboard (`/admin`)
  - Admin categories (`/admin/categories`)
  - Admin products (`/admin/products`, `/admin/products/new`, `/admin/products/:id/edit`)
  - Admin inventory (`/admin/inventory`)
  - Admin orders (`/admin/orders`)

**Current development status (observed from filesystem + build artifacts):**
- Core app compiles successfully with `apps/web` (`next build` succeeds).
- The **admin products routing structure is now present** and resolves `/admin/products`, `/admin/products/new`, `/admin/products/:id/edit`.
- Minor build output includes an ESLint warning: `nextVitals is not iterable` (does not fail build).
- Authentication is implemented client-side with Zustand + Axios bearer injection, while server-side protection uses the `token` cookie in Next.js middleware.

## 2. Tech Stack

### Frontend (`apps/web`)
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **UI:** Tailwind CSS (classes throughout)
- **Data fetching:** `@tanstack/react-query`
- **State management:** Zustand
  - `auth.store.ts` (JWT + user persisted)
  - `cart.store.ts` (cart persisted items)
  - `location.store.ts` (persisted delivery location)
  - `toast.store.ts` (in-app toast queue)
- **HTTP client:** Axios wrapper in `apps/web/src/lib/api.ts`
- **Auth integration:** Custom JWT/cookie model (no NextAuth).

### Backend (`apps/api`)
- **Runtime:** Node.js + Express
- **Routing:** Express routers under `/api/*`
- **Persistence:** PostgreSQL + Prisma ORM
- **Auth system:** JWT and an `httpOnly` cookie named `token`
- **Storage:** Cloudflare R2 (presign + direct PUT upload)
- **Shipping integration:** Shiprocket webhook (`/api/orders/webhook/shiprocket`)
- **Payment integration:** Razorpay (orders + payment verification)

### Database (Prisma schema summary)
`apps/api/prisma/schema.prisma` defines:
- Enums:
  - `Role`: `ADMIN`, `CUSTOMER`
  - `AttributeType`: `TEXT`, `NUMBER`, `SELECT`, `MULTI_SELECT`, `BOOLEAN`
  - `OrderStatus`: `PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `REFUNDED`
  - `Zone`: `A`, `B`, `C`, `X`
  - `PaymentMethod`: `ONLINE`, `COD`
  - `CodStatus`: `PENDING`, `COLLECTED`, `FAILED`
  - `ReturnStatus`: `REQUESTED`, `APPROVED`, `REJECTED`, `PICKED_UP`, `REFUNDED`
- Models:
  - `User`: `role`, `email` unique, `password` optional, `orders`, `cartItems`, `reviews`, `returnRequests`
  - `Category`: tree via `parentId` + `children`
  - `AttributeDefinition`: belongs to `Category`, with filtering metadata
  - `Product`: includes `categoryId`, `basePrice`, `isVisible`, `stock`, `images` (JSON), relations to `Category`, `ProductAttribute`, `OrderItem`, `Review`, `CartItem`
  - `ProductAttribute`: per-product attribute values
  - `CartItem`: per-user cart items (unique on userId+productId)
  - `Order`: order status + payment fields + shipping fields + return requests
  - `OrderItem`: order/product snapshots
  - `Review`: unique on `userId + productId`
  - `ReturnRequest`: per order/user return flow
  - `Pincode`: serviceability model keyed by pincode

## 3. Folder Structure (VERY DETAILED)

### 3.1 `apps/web/src/app/` (App Router)

```text
apps/web/src/app/
├── layout.tsx                         -> Root layout (Providers)
├── providers.tsx                     -> QueryClientProvider + CartDrawer + Toaster (client)
├── globals.css
├── (admin)/
│   ├── layout.tsx                   -> Client admin guard + sidebar layout
│   └── admin/
│       ├── page.tsx               -> /admin
│       ├── categories/
│       │   └── page.tsx          -> /admin/categories
│       ├── products/
│       │   ├── page.tsx          -> /admin/products
│       │   ├── new/
│       │   │   └── page.tsx    -> /admin/products/new
│       │   └── [id]/
│       │       └── edit/
│       │           └── page.tsx -> /admin/products/:id/edit
│       ├── inventory/
│       │   └── page.tsx          -> /admin/inventory
│       └── orders/
│           └── page.tsx          -> /admin/orders
├── (auth)/
│   ├── login/
│   │   └── page.tsx               -> /login
│   └── register/
│       └── page.tsx               -> /register
└── (shop)/
    ├── layout.tsx                   -> Includes public `Navbar`
    ├── products/
    │   ├── page.tsx               -> /products
    │   └── [slug]/
    │       └── page.tsx          -> /products/:slug
    ├── orders/
    │   ├── page.tsx              -> /orders (customer orders list)
    │   └── [id]/
    │       └── page.tsx         -> /orders/:id (order detail)
    ├── cart/
    │   └── page.tsx              -> /cart
    └── checkout/
        └── page.tsx              -> /checkout
```

### 3.2 `apps/web/src/components/`
Observed component files:
```text
apps/web/src/components/
├── admin/
│   ├── AdminSidebar.tsx
│   ├── AttributeDrawer.tsx
│   ├── AttributeForm.tsx
│   ├── CategoryModal.tsx
│   ├── ImageUploader.tsx
│   ├── ProductForm.tsx
│   └── (others referenced indirectly by hooks)
├── shop/
│   ├── CartDrawer.tsx
│   ├── FilterSidebar.tsx
│   ├── Navbar.tsx
│   ├── PincodeChecker.tsx
│   ├── ProductCard.tsx
│   ├── ReviewSection.tsx
│   └── ReturnRequestSection.tsx
└── ui/
    ├── StarRating.tsx
    └── Toaster.tsx
```

### 3.3 `apps/web/src/hooks/`
Observed hooks:
```text
apps/web/src/hooks/
├── useAuth.ts
├── useCart.ts
├── useCategories.ts
├── useLocationDetect.ts
├── useProducts.ts
├── useRazorpay.ts
└── useReviews.ts
```

### 3.4 `apps/web/src/store/`
Observed Zustand stores:
```text
apps/web/src/store/
├── auth.store.ts       (user + token persisted)
├── cart.store.ts       (cart items persisted)
├── location.store.ts   (pincode/location persisted)
└── toast.store.ts      (toast queue)
```

### 3.5 `apps/web/src/lib/`
Observed libs:
```text
apps/web/src/lib/
├── api.ts        (Axios instance + interceptors)
├── authApi.ts    (login/register/me/logout API functions)
└── utils.ts      (formatPrice + slugify)
```

## 4. Routing Map (CRITICAL)

### 4.1 Folder → URL mapping (current)
**Root**
- `apps/web/src/app/page.tsx` → `/`

**Auth**
- `(auth)/login/page.tsx` → `/login`
- `(auth)/register/page.tsx` → `/register`

**Shop**
- `(shop)/products/page.tsx` → `/products`
- `(shop)/products/[slug]/page.tsx` → `/products/:slug`
- `(shop)/cart/page.tsx` → `/cart`
- `(shop)/checkout/page.tsx` → `/checkout`
- `(shop)/orders/page.tsx` → `/orders`
- `(shop)/orders/[id]/page.tsx` → `/orders/:id`

**Admin**
- `(admin)/admin/page.tsx` → `/admin`
- `(admin)/admin/categories/page.tsx` → `/admin/categories`
- `(admin)/admin/products/page.tsx` → `/admin/products`
- `(admin)/admin/products/new/page.tsx` → `/admin/products/new`
- `(admin)/admin/products/[id]/edit/page.tsx` → `/admin/products/:id/edit`
- `(admin)/admin/inventory/page.tsx` → `/admin/inventory`
- `(admin)/admin/orders/page.tsx` → `/admin/orders`

### 4.2 Missing routes / misplacements
- Earlier symptom: `/admin/products` returned 404 because the products route files did not exist in the filesystem.
- Current state: the missing structure has been added under:
  - `apps/web/src/app/(admin)/admin/products/`
  - so `/admin/products` now has corresponding `page.tsx` and children routes.
- Important Next.js App Router rule (observed in your project):
  - Route groups `(admin)` do **not** affect the URL path.
  - The URL segment `/admin` is produced by the actual `admin/` folder under `(admin)/`.
  - Products admin routes must be under `(admin)/admin/products` (not `(admin)/products`).

### 4.3 Potential 404/security routing issues
1. **Auth redirect masking routes:** Admin layout uses Zustand user state; if `user === null`, it redirects to `/login?callbackUrl=/admin` even if the route exists.
2. **Middleware coverage mismatch risk:** Next middleware matcher includes `/orders/:path*`, `/checkout/:path*`, etc. Depending on matcher semantics, `/orders` or `/checkout` might not be protected exactly the same way as nested paths. Treat this as a potential gap.

## 5. Authentication Flow

### 5.1 Token storage (two sources)
The frontend uses **two auth mechanisms** that must stay aligned:

1. **Cookie (`token`, httpOnly)**
   - Set/cleared by backend `/api/auth/login`, `/api/auth/logout`.
   - Used by Next.js middleware (`apps/web/src/middleware.ts`) to decide whether a route is protected.

2. **localStorage (`ecommerce-auth`)**
   - Zustand persist store writes `user` and `token` to localStorage key `ecommerce-auth`.
   - Axios interceptor (`apps/web/src/lib/api.ts`) reads this localStorage entry and attaches `Authorization: Bearer <token>`.

### 5.2 Login flow
1. User visits `/login`.
2. `/login` uses `useAuth()` hook.
3. `useAuth.login()`:
   - sets Zustand `isLoading`
   - calls `loginApi(email, password)` which calls backend `POST /api/auth/login`
   - stores returned `{ user, token }` in Zustand (`useAuthStore.setAuth`)
   - shows toast success and returns user
4. Client redirects:
   - if `user.role === "ADMIN"` → `/admin`
   - otherwise → `callbackUrl` from query string (`callbackUrl ?? "/"`)

### 5.3 Logout flow
1. `logoutApi()` calls backend `POST /api/auth/logout`.
2. Clears Zustand auth (`clearAuth()`), clears React Query cache (`queryClient.clear()`), then redirects to `/`.

### 5.4 Middleware protection
`apps/web/src/middleware.ts`:
- Reads `req.cookies.get("token")?.value`
- Protects:
  - `/checkout/*`, `/orders/*`, `/account/*`
  - `/admin/*` (but role check is not done in middleware)
- Redirects unauthenticated users to:
  - `/login?callbackUrl=/the-requested-path`
  - includes pathname + search query

### 5.5 Admin role enforcement
Admin role checks are done **client-side** in:
`apps/web/src/app/(admin)/layout.tsx`
- Uses `useAuthStore((s) => s.user)`
- `useEffect`:
  - if `user === null` → pushes `/login?callbackUrl=/admin`
  - if `user.role !== "ADMIN"` → pushes `/`
- Until user is non-null, it renders a centered “Checking access...” loading UI.

### 5.6 Possible hydration/redirect issues (high risk)
- Middleware uses cookie; admin layout uses Zustand `user`.
- On refresh or first load, there can be a window where:
  - cookie exists (middleware would allow access)
  - but Zustand rehydration has not completed yet (`user` still `null`)
  - admin layout redirects to `/login` even though the cookie may be valid.
- There is a `getMeApi()` function in `authApi.ts`, but there is **no observed usage** to hydrate Zustand user from the cookie at startup.

## 6. API Layer

### 6.1 Axios client implementation
`apps/web/src/lib/api.ts` defines:
- `apiClient`:
  - `baseURL` from `NEXT_PUBLIC_API_URL`
  - `withCredentials: true` (credentials included)
- Request interceptor:
  - reads `localStorage.getItem("ecommerce-auth")`
  - parses `JSON.parse(raw)?.state?.token`
  - sets `Authorization: Bearer <token>`
- Response interceptor:
  - on HTTP `401`:
    - removes `ecommerce-auth` from localStorage
    - redirects to `/login`

### 6.2 Frontend API endpoints used (observed from source)
Auth:
- `POST /api/auth/login` (login)
- `POST /api/auth/register` (register)
- `POST /api/auth/logout` (logout)
- `POST /api/auth/oauth` is used only indirectly via Google redirect (`/api/auth/google` route is referenced in login/register UI)
- `GET /api/auth/me` exists in `authApi.ts` but is not observed as used in current UI flow.

Products & catalog:
- `GET /api/products?{filters}` (shop products list)
- `GET /api/products/:slug` (shop product detail)
- `GET /api/products/admin/all?{filters}` (admin products list)
- `GET /api/products/admin/:id` (admin edit product)
- `POST /api/products` (create product)
- `PATCH /api/products/:id` (update product)
- `PATCH /api/products/:id/visibility` (toggle visibility)
- `DELETE /api/products/:id` (delete product)

Categories / Attributes:
- `GET /api/categories` (list)
- `GET /api/categories/tree` (tree)
- `POST /api/categories` / `PATCH /api/categories/:id` / `DELETE /api/categories/:id`
- `GET /api/categories/:categoryId/attributes`
- `POST /api/categories/:categoryId/attributes`
- `PATCH /api/categories/:categoryId/attributes/:id`
- `DELETE /api/categories/:categoryId/attributes/:id`

Cart:
- `GET /api/cart` (server cart; enabled when Zustand token exists)
- `POST /api/cart/items` (add/increment)
- `PATCH /api/cart/items/:productId` (update quantity)
- `DELETE /api/cart/items/:productId` (remove item)
- `DELETE /api/cart` (clear)

Orders:
- `GET /api/orders/my` (customer order list)
- `GET /api/orders/:id` (order detail)
- `POST /api/orders` (create order from checkout)
- `POST /api/orders/:id/verify-payment` (verify Razorpay payment)
- Admin:
  - `GET /api/orders` (admin orders list)
  - `PATCH /api/orders/:id/status` (admin updates status)

Reviews:
- `GET /api/products/:productId/reviews`
- `POST /api/products/:productId/reviews`
- `DELETE /api/products/:productId/reviews/:reviewId`

Returns:
- `POST /api/returns` (Return request creation)

Delivery & Pincode:
- `GET /api/delivery/check?pincode=...&total=...`

Inventory:
- `GET /api/inventory`
- `PATCH /api/inventory/:id` (stock update)

Uploads (R2):
- `POST /api/upload/presign` (presigned URL for direct PUT)

### 6.3 Error handling strategy
- Centralized Axios error normalization:
  - Converts errors into `Error(message)` with extra fields `status` and `details`.
- UI typically catches `err instanceof Error` and displays `err.message` in a red box.
- Logout and some “fire-and-forget” flows ignore errors to avoid UI crashes.

## 7. State Management

### 7.1 Zustand stores
1. **Auth Store (`auth.store.ts`)**
   - Persisted fields: `user`, `token`
   - Not persisted: `isLoading`
   - Actions:
     - `setAuth(user, token)`
     - `clearAuth()`
     - `setLoading(value)`

2. **Cart Store (`cart.store.ts`)**
   - Persisted fields: `items` only (not `isOpen`)
   - `CartItem` structure:
     - `productId`
     - `quantity`
     - `snapshot: Product` (name/price/images locked at add-time)
   - Actions: `openCart`, `closeCart`, `addItem`, `removeItem`, `updateQty`, `clearCart`, `syncFromServer`, `getTotal`, `getCount`.

3. **Location Store (`location.store.ts`)**
   - Persisted fields: city/state/pincode/detectedBy.
   - Used by `Navbar` to show location and by `PincodeChecker`.

4. **Toast Store (`toast.store.ts`)**
   - `push(message, type?)` adds toast with `crypto.randomUUID()`
   - auto-dismiss after 4 seconds

### 7.2 React Query usage
- Used for:
  - product lists
  - details
  - reviews
  - cart server sync (`useServerCart`)
  - category/attribute queries & admin mutation invalidation
- `Providers` creates a QueryClient once and wraps the whole app.

### 7.3 Persistence model overview
- **localStorage** persistence:
  - auth (`ecommerce-auth`)
  - cart items (`ecommerce-cart`)
  - location (`ecommerce-location`)
  - toast is not persisted

## 8. Core Features Status

### User Side
- Auth (Login/Register/Logout): ✅ Implemented
- Product listing: ✅ `/products`
- Product detail: ✅ `/products/:slug`
- Cart: ✅ Zustand + server sync on login
- Checkout: ✅ `/checkout` (Razorpay modal + COD flow)

### Admin Side
- Dashboard: ✅ `/admin`
- Products: ✅ `/admin/products` + `/admin/products/new` + `/admin/products/:id/edit`
- Categories: ✅ `/admin/categories`
- Orders: ✅ `/admin/orders`
- Inventory: ✅ `/admin/inventory`

### Notes on “completed”
- “Completed” means routes exist and code compiles.
- Some flows may still have edge-case issues (notably auth hydration timing; see High Risk Areas).

## 9. Components Audit

### 9.1 `ProductForm`
- Location: `apps/web/src/components/admin/ProductForm.tsx`
- Role: create/update product with attributes and images.
- Used by:
  - Admin new product page
  - Admin edit product page
  - The component expects a `product` prop in edit mode.
- Potential integration risks:
  - The component assumes the product shape includes fields like `categoryId`, `basePrice`, `stock`, `isVisible`, `images`.
  - These must match what `/api/products/admin/:id` returns.

### 9.2 Product listing & admin products table
- Admin products list: `apps/web/src/app/(admin)/admin/products/page.tsx`
  - Uses `useAdminProducts` (calls `GET /api/products/admin/all`)
  - Renders:
    - name, slug, category name (if present), visibility (if boolean)
    - edit link: `/admin/products/:id/edit`
  - Known behavioral limitation:
    - Page state exists (`page`), but there is no visible pagination UI in the current page code.

### 9.3 Auth-related UI
- Public Navbar: `apps/web/src/components/shop/Navbar.tsx`
  - Uses `useAuth()` for `user`, `isAdmin`, `logout`
  - Dropdown triggers `logout()`
  - Admin button appears if `isAdmin === true`

- Admin sidebar: `apps/web/src/components/admin/AdminSidebar.tsx`
  - Navigation includes:
    - `/admin/products`
    - `/admin/categories`
    - `/admin/orders`
    - `/admin/inventory`
  - Logout button calls `logout()`

### 9.4 Reviews
- Review section: `apps/web/src/components/shop/ReviewSection.tsx`
  - Uses `useAuthStore` to get `user`
  - Uses `useReviews(productId)` which returns `{ data, meta }`
  - Uses `user?.id` to find whether the current user already reviewed
  - Delete review uses `useDeleteReview`

### 9.5 Checkout / Payment
- Checkout page: `apps/web/src/app/(shop)/checkout/page.tsx`
  - Uses `useAuthStore` for `user`
  - On mount, fills shipping address `name` from `user?.name`
  - Calls:
    - `POST /api/orders` (COD or ONLINE)
    - `POST /api/orders/:id/verify-payment` after Razorpay success
  - Calls `openRazorpay({ userEmail: user?.email, userName: user?.name })`

## 10. Errors & Issues (VERY IMPORTANT)

### 10.1 Missing admin products route (historical)
- Symptom: `/admin/products` returned 404.
- Cause: Products route did not exist in filesystem under the correct `admin/` folder.
- Current state: added missing pages under `(admin)/admin/products`.

### 10.2 Auth hydration & redirect risks (high risk)
**Where:**
- `apps/web/src/app/(admin)/layout.tsx`
- `apps/web/src/middleware.ts`

**Why it matters:**
- Middleware checks the `token` cookie.
- Admin layout checks Zustand `user` (localStorage-backed).
- On initial load/refresh:
  - Zustand `user` can be temporarily `null` before rehydration.
  - Admin layout may redirect to `/login` even though the cookie is valid.

### 10.3 Potential API auth desync
- Axios bearer token comes from localStorage.
- Middleware uses cookie existence.
- If cookie is present but localStorage is missing/stale, API requests may return 401.
- Axios interceptor will redirect to `/login` on 401.

### 10.4 Middleware matcher coverage edge case (medium)
- Middleware matcher includes `/orders/:path*` but protection logic includes exact `/orders`.
- If Next.js matcher does not match the base route as expected, `/orders` could be unprotected.
- Treat as verify-by-test.

### 10.5 Build output warning (low)
- `ESLint: nextVitals is not iterable`
- Appears during `next build` in `apps/web`.
- Not currently a build failure.

### 10.6 Past dev-only errors (context)
- `ChunkLoadError` was reported previously in dev.
- This is commonly caused by stale Next.js chunk references during HMR after route/file moves.
- It should be treated as a dev/HMR caching issue, not a core routing bug (verify after route creation).

## 11. Environment & Config

### Frontend `.env.local` (current)
- `NEXT_PUBLIC_API_URL=http://localhost:0311`
- `NEXT_PUBLIC_RAZORPAY_KEY_ID=...`

### Middleware reliance
- Reads httpOnly cookie `token` (set by backend).

### Backend required env (from schema)
- Prisma `DATABASE_URL` must be configured.
- Razorpay key and other integration variables are referenced in backend code (e.g. Shiprocket).

## 12. High-Risk Areas

1. **Dual auth sources (cookie vs localStorage)**
   - Middleware and API client rely on different sources.
   - Any desync produces redirect loops or “works for middleware but fails API” behavior.

2. **Admin role enforcement is client-side only**
   - Middleware only checks presence of cookie.
   - Role check happens after hydration in admin layout.

3. **Zustand hydration timing**
   - Admin layout redirects immediately when `user === null`.
   - If localStorage rehydration is delayed, the UX can redirect to login erroneously.

4. **Product admin table assumes optional fields**
   - Table renders category/visibility defensively, but it still depends on admin product response shape containing those properties.

## 13. Suggested Next Fixes (PRIORITIZED) — prompt fixes (no code changes in this audit)

1. **Fix auth hydration correctness for admin pages**
   - When entering `(admin)` routes and `user === null`:
     - check cookie presence in the browser (or attempt `GET /api/auth/me`)
     - populate Zustand `user` from backend if localStorage is empty.
   - This removes redirect loops and makes server-side cookie the source of truth.

2. **Enforce admin role at middleware/server level (optional hardening)**
   - Currently middleware can only check cookie presence.
   - For stronger guarantees, validate role in middleware (requires API call or signed token claims).

3. **Make middleware matcher coverage explicit**
   - Validate that `/orders` and `/checkout` base routes are protected consistently with the `:path*` matcher.

4. **Harden admin product list rendering**
   - Ensure `/api/products/admin/all` includes:
     - `category` relation name (or return `categoryId`)
     - `isVisible` boolean
   - Add UI guards if the response differs.

5. **Add pagination UI for admin products**
   - `page` exists but there is no pagination controls.

## Appendices

### A. Next.js routes existing in `apps/web/src/app`
- Listed in section 4.1 above.

### B. Backend Express routes (entrypoints)
- Express app mounts:
  - `/api/auth` (from `routes/auth.ts`)
  - `/api/products` (from `routes/products.ts`)
  - `/api/categories` (from `routes/categories.ts`)
  - `/api/upload` (from `routes/upload.ts`)
  - `/api/cart` (from `routes/cart.ts`)
  - `/api/orders` (from `routes/orders.ts`)
  - `/api/reviews` nested under products (from `routes/reviews.ts`)
  - `/api/inventory` (from `routes/inventory.ts`)
  - `/api/delivery` (from `routes/delivery.ts`)
  - `/api/returns` (from `routes/returns.ts`)

