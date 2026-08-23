# VITBookMart — Frontend

A React + TypeScript frontend for the VITBookMart Spring Boot backend. Students can
browse, search, wishlist, sell, rent and hand over books and notes within VIT.

Built **against the backend that exists**. Every endpoint, enum value, query
parameter and multipart field name in this app was read out of the Java source
before it was written. Nothing here is mocked.

---

## Quick start

```bash
npm install
cp .env.example .env      # then fill in the Google client ID
npm run dev               # http://localhost:5173
```

The backend should be running on `http://localhost:8080`.

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload and the `/api` proxy |
| `npm run build` | Type-check, then produce `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | `tsc --noEmit` |
| `node scripts/contract-check.mjs` | Runs the API layer against a mock shaped exactly like the backend |
| `node scripts/refresh-check.mjs` | Verifies the 401 → refresh → retry interceptor |

---

## Configuration

All configuration lives in `.env` (see `.env.example`). Nothing else in the app
reads `import.meta.env` — it is all funnelled through `src/config/env.ts`.

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Backend origin. **Leave empty in dev** so requests go to `/api` and the Vite proxy forwards them. |
| `VITE_API_PROXY_TARGET` | Where the dev proxy points. Default `http://localhost:8080`. |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth **Web client ID**. Public — safe in the frontend. |
| `VITE_GOOGLE_REDIRECT_URI` | Must match the backend's `GOOGLE_REDIRECT_URI` **exactly**. |
| `VITE_GOOGLE_HOSTED_DOMAIN` | Optional `hd` hint for the account chooser. A UX nicety, never a security control. |
| `VITE_BACKEND_TIME_IS_UTC` | `true` when the backend server runs in UTC. See "Timestamps" below. |
| `VITE_CONTRIBUTE_URL` | Footer "Contribute" destination. Blank shows a placeholder. |
| `VITE_CONTACT_EMAIL` | Footer contact address. Blank shows a placeholder. |

The Google **client secret** never appears here. The backend holds it and performs
the code exchange itself.

### Pointing at a different backend

```bash
# .env
VITE_API_BASE_URL=https://api.vitbookmart.example.com
```

In production the app calls that origin directly, so the backend must allow it
via CORS — see below.

---

## Google OAuth setup

The backend uses the **authorization-code** flow. `GoogleOAuthService` calls
`GoogleAuthorizationCodeTokenRequest` with its own client secret *and its own
configured `redirect_uri`*, and Google requires the redirect URI presented at
exchange time to match the one that produced the code.

Two consequences drive the implementation:

1. **The URIs must be identical.** `VITE_GOOGLE_REDIRECT_URI` and the backend's
   `GOOGLE_REDIRECT_URI` must be byte-for-byte the same string, and both must be
   registered in Google Cloud Console. A mismatch produces `redirect_uri_mismatch`.
2. **A full-page redirect is required, not a popup.** Google's popup mode issues
   codes bound to the special `postmessage` redirect URI, which this backend does
   not use.

### Console steps

1. Google Cloud Console → **APIs & Services → Credentials**.
2. Create an **OAuth client ID** of type **Web application**.
3. Authorised JavaScript origins: `http://localhost:5173` (plus your production origin).
4. Authorised redirect URIs: `http://localhost:5173/auth/callback` (plus production).
5. Put the client **ID** in `VITE_GOOGLE_CLIENT_ID`, and the client **secret** in the
   backend's `GOOGLE_CLIENT_SECRET`.
6. Set the backend's `GOOGLE_REDIRECT_URI` to the same `/auth/callback` URL.

Requested scopes are `openid email profile` — exactly what the backend reads off the
verified ID token (`subject`, `email`, `name`).

---

## Authentication flow

```
/login → "Continue with Google"
   → accounts.google.com  (response_type=code, state=<random>)
   → /auth/callback?code=…&state=…
   → state verified against sessionStorage
   → POST /api/auth/google  { code }
   → { accessToken, refreshToken, user } stored, user redirected back
```

Tokens: the access token lives 15 minutes, the refresh token 30 days. Both are
plain JWTs signed with `jwt.secret`; there is no server-side session or revocation
list.

**Refreshing.** Any 401 on an authenticated request triggers `POST /api/auth/refresh`,
after which the original request is replayed with the new token. Parallel 401s
collapse into a single refresh call, and a request whose sibling already refreshed
simply replays with the newer token instead of refreshing again. If the refresh
fails, the session is cleared, the query cache is emptied and the user sees one
"session expired" message — there is no retry loop. All of this is covered by
`scripts/refresh-check.mjs`.

**Storage.** `src/api/tokenStore.ts` is the only module that touches token storage.
Tokens go in `localStorage` because the backend returns them in a JSON body rather
than setting an httpOnly cookie, and a standalone SPA has no safer place to persist
a session across reloads. The honest trade-off: a successful XSS would expose the
refresh token. If you later add cookie-based auth to the backend, `tokenStore.ts` is
the single file that changes.

**Redirects.** Protected routes bounce to `/login` while preserving the intended
path. After signing in the user returns there — except when they were heading to
`/sell` with an incomplete profile, in which case they land on `/profile` first,
because the backend would reject the listing anyway.

---

## Backend endpoints used

Verified against the controllers, not guessed from names.

### Public

| Method | Path | Notes |
| --- | --- | --- |
| `POST` | `/api/auth/google` | `{ code }` → `AuthResponse` |
| `POST` | `/api/auth/refresh` | `{ refreshToken }` → `AuthResponse` (same refresh token echoed back) |
| `GET` | `/api/listings/latest?page&size` | `PaginatedResponse<ListingResponse>`, zero-based, AVAILABLE only |
| `GET` | `/api/listings/search?query&type&category&sort&page&size` | `query` matches title **or** subject |
| `GET` | `/api/listings/{listingId}` | `ListingDetailResponse` |

### Authenticated

| Method | Path | Notes |
| --- | --- | --- |
| `POST` | `/api/listings/create` | `multipart/form-data`, parts `listing` + `image` → 201 |
| `PUT` | `/api/listings/update/{listingId}` | JSON, ownership enforced |
| `PATCH` | `/api/listings/markSold/{listingId}` | ownership enforced |
| `GET` | `/api/listings/contact/{listingId}` | `{ whatsappUrl }` |
| `GET` | `/api/users/me` | `UserResponse` |
| `PUT` | `/api/users/me/update` | `{ name?, whatsappNumber?, hostel? }` |
| `GET` | `/api/users/my/listings` | array, **includes SOLD**, unpaginated |
| `GET` | `/api/wishlist/my` | `{ listings: ListingResponse[] }` |
| `POST` | `/api/wishlist/add/{listingId}` | 204 |
| `DELETE` | `/api/wishlist/remove/{listingId}` | 204 |
| `DELETE` | `/api/wishlist/clear` | `{ listings: [] }` |

**Deliberately not used:** `GET /api/listings` (unpaginated dump — `/latest` and
`/search` do the same job with pagination and Redis caching) and
`GET /api/wishlist/isWishlisted/{id}` (calling it per card would be one request per
listing; the full wishlist is fetched once and reduced to a `Set` of ids instead).

**Admin endpoints are ignored entirely,** as scoped.

### Multipart, exactly as the controller expects

`@RequestPart("listing") @Valid CreateListingRequest` only binds when that part
carries `Content-Type: application/json`. Appending a plain string would arrive as
`text/plain` and Spring would reject it, so the JSON is wrapped in a `Blob`:

```ts
formData.append("listing", new Blob([JSON.stringify(request)], { type: "application/json" }));
formData.append("image", image);
```

The `Content-Type` header is never set by hand — the browser must generate the
multipart boundary itself.

---

## Integration limitations found in the backend

None of these are worked around with invented endpoints. Each one is either handled
honestly in the UI or listed here as a backend change you'd need to make.

1. **No CORS configuration exists.** There is no `.cors(...)` in `SecurityConfig`, no
   `@CrossOrigin`, and no `WebMvcConfigurer`. A browser cannot call this backend
   cross-origin at all. Development works because Vite proxies `/api`, making every
   request same-origin. **Production needs a backend change**:

   ```java
   // SecurityConfig.securityFilterChain
   http.cors(cors -> cors.configurationSource(request -> {
       CorsConfiguration config = new CorsConfiguration();
       config.setAllowedOrigins(List.of("https://your-frontend-origin"));
       config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
       config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
       return config;
   }));
   ```

   You would also need to permit `OPTIONS` preflight requests, which currently fall
   through to `.anyRequest().authenticated()` and would be rejected.

2. **`ListingResponse` has no `category` and no `description`.** Listing cards
   therefore show title, subject, price, type, status, image and date — and nothing
   else. Category still works as a *filter* because it is a query parameter. If you
   want category badges on cards, add the field to `ListingResponse` and
   `ListingMapper.toResponse`.

3. **No delete endpoint for normal users.** `ListingService.deleteListing` exists but
   no controller maps to it, so there is no delete button anywhere. Mark-as-sold is
   the only way to retire a listing.

4. **Listing images cannot be replaced.** `UpdateListingRequest` has no image field
   and the update endpoint is JSON-only. The edit form shows the current photo
   read-only and says so plainly.

5. **`ListingDetailResponse` exposes no seller id.** Ownership can't be determined
   from the detail endpoint alone, so the UI cross-references
   `GET /api/users/my/listings` to decide whether to show Edit. The backend enforces
   ownership on write regardless — this is presentation only. Adding `sellerId` (or an
   `isOwner` flag) to the detail DTO would remove the extra request.

6. **Sort values are `latest`, `priceAsc`, `priceDesc`** — not `priceLow`/`priceHigh`.
   Anything unrecognised silently falls back to newest-first.

7. **The VIT email restriction is commented out** in `AuthService.authenticateWithGoogle`.
   The backend currently accepts any Google account. The UI says "Please use your VIT
   student Google account" as guidance, and `VITE_GOOGLE_HOSTED_DOMAIN` can pre-filter
   the account chooser, but **neither is enforcement**. Uncomment the backend check if
   you want it enforced.

8. **`ProfileIncompleteException` returns HTTP 400,** the same status as every other
   `BadRequestException`. The frontend distinguishes it by matching the exact message
   `"Complete your profile before creating a listing"`. A dedicated status or error
   code would be more robust.

9. **`POST /api/listings/create` is currently reachable without authentication.** The
   matcher `/api/listings/{listingId}` matches `/api/listings/create` for every HTTP
   method, so anonymous requests reach the controller and NPE into a 500 rather than
   returning 401. The frontend never sends an unauthenticated create, but you should
   tighten that matcher.

10. **`unavailableExamSlots` is RENT-only.** The mapper omits it for SALE listings and
    the service clears it on write, so the slot picker only appears for RENT. The
    codebase documents no further meaning for the slots, so the UI claims none.

11. **Contact seller requires a session.** `/api/listings/*` permits one path segment;
    `/api/listings/contact/{id}` is two, so it falls through to `authenticated()`.
    Signed-out users get a sign-in prompt rather than a failed request.

### Timestamps

The backend serialises `java.time.LocalDateTime`, which carries no timezone
(`"2026-08-23T09:14:52.318"`). JavaScript would read that as *local* time. Since
most deployments run in UTC, the frontend appends `Z` before parsing; set
`VITE_BACKEND_TIME_IS_UTC=false` if your server runs in local time. Relative dates
are also clamped so clock skew can never render "in 4 hours".

---

## Architecture

```
src/
├── api/            axios instance, token store, error mapping, one module per resource
├── components/     common/ auth/ navbar/ footer/ home/ listings/ profile/ sell/ wishlist/
├── config/         env.ts — the only reader of import.meta.env
├── constants/      labels, app limits, hostel options
├── context/        AuthContext
├── hooks/          useListings, useWishlist, useProfile, useBrowseParams, …
├── layouts/        MainLayout
├── lib/            cn, format, queryClient, queryKeys
├── pages/          one file per route, all lazy-loaded except Home
├── routes/         AppRoutes, ProtectedRoute, ScrollToTop
└── types/          enums.ts + api.ts, mirroring the backend DTOs
```

Components never call `axios` directly. Data flows `page → hook → api module →
axios instance`.

### Query and cache strategy

Keys are centralised in `src/lib/queryKeys.ts`:

```
["listings","latest",{page,size}]     public feed
["listings","search",{…params}]       browse — the filter object IS the key
["listings","detail",id]              detail page
["me"] / ["me","listings"]            profile, own listings
["wishlist"]                          signed-in user's wishlist
```

Public listing data is held for two minutes, which is comfortable because the
backend already caches it in Redis and busts those caches on every write.
Authenticated queries are `enabled: isAuthenticated`, so a signed-out visitor never
triggers a protected request, and the whole cache is cleared on sign-out so nothing
leaks between accounts.

Invalidation is targeted, never a blanket wipe:

| Mutation | Invalidates |
| --- | --- |
| Create listing | latest, search, my listings |
| Update listing | that detail, my listings, latest, search |
| Mark as sold | that detail, my listings, latest, search, wishlist |
| Wishlist add/remove | wishlist only (optimistic, rolls back on failure) |

Searches are debounced at 400 ms, cancelled via `AbortSignal` when superseded, and
keep the previous page visible while the next one loads. Omitting empty parameters
keeps the backend's Redis search key stable across users.

### URL state

Browse keeps its whole state in the query string, using the backend's own parameter
names, so `/browse?query=java&category=BOOK&type=SALE&page=1` is shareable,
bookmarkable and survives refresh and back/forward navigation. Unknown enum values
in the URL are dropped rather than forwarded, since the backend would 400 on them.
Typing uses `replace: true` so keystrokes don't fill the history stack.

---

## Deployment

`npm run build` emits a static `dist/`. Because this is a client-side router, the
host must rewrite unknown paths to `index.html` — otherwise a refresh on
`/listing/abc` returns 404. Netlify: `/* /index.html 200`. Vercel: a rewrite to
`/index.html`. Nginx: `try_files $uri $uri/ /index.html;`.

Set `VITE_API_BASE_URL` to the deployed backend and register the production
`/auth/callback` URL in both Google Cloud Console and the backend's
`GOOGLE_REDIRECT_URI`. And resolve the CORS gap in item 1 above, or nothing will
load.

---

## Accessibility and responsiveness

Semantic landmarks with a skip link; one consistent `:focus-visible` ring; dialogs
and drawers trap focus, close on Escape and restore focus on exit; status is never
signalled by colour alone; `prefers-reduced-motion` disables the guide's auto-scroll,
the heart animation and the skeleton shimmer.

Laid out for 320 px upward — two-column grids on phones, three on tablets, four on
desktop, filters in a bottom sheet on small screens and a sticky sidebar on large
ones. `overflow-x` is pinned at the body so nothing scrolls sideways, and the
floating Sell button clears the mobile tab bar and the iOS home indicator.
