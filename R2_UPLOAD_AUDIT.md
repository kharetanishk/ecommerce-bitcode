# R2_UPLOAD_AUDIT.md

## Summary

The browser error **“Failed to fetch”** during image upload from `"/admin/products/new"` is occurring in the **direct PUT to Cloudflare R2** step, not in the product form itself.

Your upload pipeline is:
1) Frontend requests a presigned URL from your API: `POST /api/upload/presign`  
2) Frontend performs a **cross-origin** `fetch(uploadUrl, { method: "PUT", ... })` directly to R2  

The “Failed to fetch” message is what the browser throws when a request is **blocked at the network layer** (most commonly **CORS/preflight denied**) or when the response is **opaque due to missing CORS headers** (even if R2 returns an error like 403).

This audit identifies the concrete failure points based on the current code.

---

## Files inspected (as requested)

### Frontend
- `apps/web/src/components/admin/ProductForm.tsx`
- `apps/web/src/components/admin/ImageUploader.tsx`
- `apps/web/src/hooks/useProducts.ts` (contains the actual upload function)

### Backend
- `apps/api/src/routes/upload.ts`
- `apps/api/src/lib/r2.ts`

### Env
- `apps/api/.env` (values **redacted** in this doc)

---

## 1) Upload Flow (end-to-end trace)

### Step A — Admin UI triggers upload

`ImageUploader` calls `uploadImageToR2(file)` for each selected file:

- File: `apps/web/src/components/admin/ImageUploader.tsx`
- Call site:
  - `const { url, key } = await uploadImageToR2(file);`

### Step B — Presign request (API)

`uploadImageToR2` first calls your API:

- File: `apps/web/src/hooks/useProducts.ts`

```ts
const { uploadUrl, key, publicUrl } = await api.post("/api/upload/presign", {
  contentType: file.type,
});
```

Backend route:
- File: `apps/api/src/routes/upload.ts`
- Route: `POST /api/upload/presign`
- Guards:
  - `authenticate`
  - `requireAdmin`

So presign only works when:
- User is authenticated **and**
- User role is ADMIN

### Step C — Direct PUT to R2 (browser → R2)

After presign, frontend uploads directly to the signed URL:

- File: `apps/web/src/hooks/useProducts.ts`

```ts
await fetch(uploadUrl, {
  method: "PUT",
  body: file,
  headers: { "Content-Type": file.type },
});
```

This request goes to:
- `https://<accountId>.r2.cloudflarestorage.com/...` (S3-compatible R2 endpoint)
- i.e. **different origin** from `http://localhost:3000`

This direct PUT requires proper **R2 bucket CORS** configuration.

---

## 2) Presign API audit (is it returning a “valid URL”?)

Backend presign generator:
- File: `apps/api/src/lib/r2.ts`

Key details:
- Creates `S3Client` with:
  - `region: "auto"`
  - `endpoint: https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
  - credentials from `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY`
- Signs a `PutObjectCommand`:

```ts
const command = new PutObjectCommand({
  Bucket: process.env.R2_BUCKET_NAME!,
  Key: key,
  ContentType: contentType,
  ContentLength: MAX_SIZE_BYTES,
});
const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 300 });
```

### Important observation: `ContentLength` is set to a fixed 5MB

`ContentLength` is set to `MAX_SIZE_BYTES` (5MB), not the real file size.

In S3-style signed PUTs, specifying headers/fields on the command can influence what is **signed**. If R2 expects the request to match the signed headers/metadata and the browser sends a different `Content-Length` (the real file size), R2 can reject the PUT with a signature mismatch.

In a browser, that rejection often surfaces as **“Failed to fetch”** when:
- the PUT is blocked by CORS, or
- the PUT returns 403/400 without permissive CORS headers (browser hides details).

### Public URL construction is likely incorrect for “public viewing”

`publicUrl` is computed as:

```ts
const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
```

Your `.env` has `R2_PUBLIC_URL` set to a Cloudflare storage hostname (redacted here).  
That hostname is typically **not** a public CDN URL unless:
- the bucket is public, or
- you have a public domain (`r2.dev` or custom domain) configured.

This does **not** cause “Failed to fetch” during upload, but it can cause “broken images” after upload (404/403 when trying to view).

---

## 3) PUT Request audit (method/headers/etc.)

### Method
- Frontend uses `PUT` ✅
- Backend presigns a `PutObjectCommand` ✅

### Headers
- Frontend sets only:
  - `Content-Type: file.type` ✅
- Backend signs with:
  - `ContentType: contentType` ✅
- Backend also sets:
  - `ContentLength: MAX_SIZE_BYTES` ⚠️ (see below)

### Response handling
Frontend does:

```ts
await fetch(uploadUrl, ...);
return { url: publicUrl, key };
```

It does **not** check:
- `if (!res.ok) ...`

So if the request fails with a non-CORS-visible error, the user still sees a generic failure from the thrown fetch error or from subsequent steps.

---

## 4) CORS issues (most likely immediate cause of “Failed to fetch”)

### Why CORS is required here
The upload is a direct browser request to:
- `https://<accountId>.r2.cloudflarestorage.com/...`

Origin is:
- `http://localhost:3000`

This is cross-origin, and the browser will require R2 to allow it via CORS.

### What must be allowed at R2 for this to work
R2 bucket CORS must allow:
- **Allowed Origins**: `http://localhost:3000` (and your production domain)
- **Allowed Methods**: `PUT` (and usually `GET`, `HEAD`)
- **Allowed Headers**:
  - at minimum: `Content-Type`
  - often: `x-amz-*` headers if present (signed URL may require them)
- **Expose Headers**: optional; helpful for debugging

### Why lack of CORS looks like “Failed to fetch”
When the browser blocks the response due to CORS, `fetch()` rejects with:
- `TypeError: Failed to fetch`

And you will **not** see the real R2 status code/body from JS unless CORS is configured.

---

## 5) Endpoint issues

### R2 endpoint used by code
`apps/api/src/lib/r2.ts` ignores `R2_ENDPOINT` from `.env` and constructs endpoint from:
- `R2_ACCOUNT_ID`:
  - `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`

This is a standard R2 S3 endpoint, so it’s typically fine.

### Region
- `region: "auto"` ✅ correct for R2 S3 compatibility.

---

## 6) Error source (CRITICAL): the exact failing step

Based on the code and the symptom text **“Failed to fetch”**, the failure is occurring in:

**Step C: the browser `fetch(uploadUrl, { method: "PUT", ... })` call to R2**

This is the only place in the upload pipeline where the browser commonly throws “Failed to fetch” as a generic TypeError.

Within Step C, the two concrete causes supported by current code are:

### Cause 1 (most likely): R2 bucket CORS is not configured for PUT from localhost
- Browser blocks the request/response at the CORS layer.
- JS sees `TypeError: Failed to fetch`.

### Cause 2 (also plausible, code-supported): signed request mismatch due to `ContentLength`
- Backend signs with `ContentLength: MAX_SIZE_BYTES` (5MB), but browser sends the real file size.
- R2 rejects (often 403 SignatureDoesNotMatch / request mismatch).
- Without proper CORS on R2, browser still surfaces it as “Failed to fetch”.

---

## Fix (conceptual, no code)

### Fix A (required): Configure R2 bucket CORS for direct browser uploads
Set bucket CORS to allow:
- Origin: `http://localhost:3000`
- Methods: `PUT`, `GET`, `HEAD` (and possibly `POST`, `DELETE` if needed later)
- Allowed headers: `Content-Type`, `*` (or at least all headers your PUT requires)

### Fix B (strongly recommended): Ensure the presigned URL does not require a mismatched Content-Length
Because the backend currently sets a fixed `ContentLength`, make sure the presigned URL does not effectively lock the request to a specific content length that the browser cannot match.

### Fix C (for image display): Use a true public base URL
If you want uploaded images to be viewable in the browser, ensure `R2_PUBLIC_URL` points to:
- an `r2.dev` public bucket domain, or
- a custom domain fronting the bucket, or
- a CDN URL

Using the `r2.cloudflarestorage.com` endpoint as “public URL” often results in non-public access unless explicitly configured.

---

## How to confirm in 60 seconds (no code changes)

1. Open DevTools → **Network**.
2. Upload an image.
3. Look for two requests:
   - `POST http://localhost:0311/api/upload/presign`
   - `PUT https://<account>.r2.cloudflarestorage.com/...` (signed URL)
4. If you only see the `POST` and the `PUT` is missing or red, it’s CORS/network.
5. If you see an `OPTIONS` preflight failing, it’s CORS for sure.

---

## Notes about sensitive env

Your `apps/api/.env` contains credentials (`R2_SECRET_ACCESS_KEY`, etc.). Do **not** commit them, and rotate if exposed. This audit intentionally does not print the secret values.

