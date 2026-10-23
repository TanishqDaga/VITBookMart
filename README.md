# VITBookMart

A campus marketplace for VIT students to buy, sell and rent textbooks, notes and calculators. Sign-in is restricted to `@vitstudent.ac.in` Google accounts, listings carry one photo and a hostel location, and buyers reach sellers over WhatsApp.

The repository holds three applications:

| Directory | What it is | Dev port |
| --- | --- | --- |
| `backend/` | Spring Boot 4.1 REST API — MongoDB, Redis, Cloudinary, Google OAuth | 8080 |
| `frontend/` | Student-facing React + TypeScript SPA | 5173 |
| `admin-frontend/` | Staff console for moderating users, listings and admin accounts | 5174 |

---

## Table of contents

- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Domain model](#domain-model)
- [Caching](#caching)
- [Image handling](#image-handling)
- [Authentication and authorization](#authentication-and-authorization)
- [API reference](#api-reference)
- [Running locally](#running-locally)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Project layout](#project-layout)

---

## Architecture

```
  Student SPA (React)          Admin SPA (React)
         │                            │
         │  JWT: type=ACCESS          │  JWT: type=ADMIN_ACCESS
         └──────────────┬─────────────┘
                        ▼
            Spring Boot API (:8080)
            OAuth2 resource server
                        │
        ┌───────────────┼────────────────┐
        ▼               ▼                ▼
    MongoDB          Redis          Cloudinary
  (source of      (read-through   (image storage +
     truth)          cache)        transformations)
                        │
                        ▼
                Google OAuth 2.0
          (authorization-code exchange)
```

Both SPAs are standalone bundles that share no code and no session. The admin bundle is never shipped to students, and the two apps use different `localStorage` key namespaces so they can run side by side on localhost.

Reads flow through Redis first and fall back to MongoDB on a miss; writes go straight to MongoDB and then invalidate the affected cache entries. Images never pass through the database — only their Cloudinary URLs are stored.

---

## Tech stack

**Backend**

| Technology | Role |
| --- | --- |
| Java 17, Spring Boot 4.1.0 | Application framework |
| Spring Web MVC | REST controllers |
| Spring Data MongoDB | Persistence, auditing, compound indexes |
| Spring Data Redis | Cache layer via `RedisTemplate<String, String>` |
| Spring Security + OAuth2 Resource Server | Stateless JWT authentication |
| JJWT 0.13 | Token minting (`jjwt-api`, `jjwt-impl`, `jjwt-jackson`) |
| Nimbus `JwtDecoder` | HMAC-SHA token verification on inbound requests |
| Google API Client 2.8.1 | Authorization-code exchange and ID-token verification |
| Cloudinary `cloudinary-http5` 2.4.0 | Image upload and on-the-fly transformation |
| BCrypt | Admin password hashing |
| Lombok | Boilerplate reduction |
| Bean Validation | Request DTO validation |
| Maven + Docker (multi-stage) | Build and packaging |

**Frontend and admin portal**

| Technology | Role |
| --- | --- |
| React 18 + TypeScript 5.6 | UI |
| Vite 5 | Dev server, `/api` proxy, production build |
| TanStack Query 5 | Server-state cache, retries, invalidation |
| React Router 6 | Routing with route-level code splitting |
| Axios | HTTP client with refresh-token interceptors |
| React Hook Form + Zod | Forms and schema validation |
| Tailwind CSS 3 | Styling |
| lucide-react | Icons |
| sonner | Toasts |
| clsx + tailwind-merge | Class composition |

---

## Domain model

MongoDB collections, mapped with Spring Data and audited via `@EnableMongoAuditing` (`createdAt` / `updatedAt` are populated automatically).

**`listings`** — title, description, subject, category, type, price, `imageUrl`, status, `sellerId`, and `unavailableExamSlots`.

- `ListingCategory`: `BOOK`, `NOTES`, `CALCULATOR` — a calculator has its `subject` forced to null on both create and update.
- `ListingType`: `SALE`, `RENT` — exam slots are only meaningful for rentals and are cleared whenever a listing is `SALE`.
- `ListingStatus`: `AVAILABLE`, `SOLD`.
- `ExamSlot`: `A1`–`G2`, so a renter can mark which slots the item is already committed to.

Three compound indexes back the query patterns:

```
idx_listing_status_createdAt                       { status: 1, createdAt: -1 }
idx_listing_status_type_category_createdAt         { status: 1, type: 1, category: 1, createdAt: -1 }
idx_listing_status_type_category_price             { status: 1, type: 1, category: 1, price: 1 }
```

**`users`** — name, email, `googleId`, `whatsappNumber`, an embedded `Hostel` (type `MH`/`LH`, block, room) and a `UserStatus` of `FREE`, `PAID` or `TERMINATED`. The Google display name is cleaned on first login: VIT appends a registration number such as `23BCE2343`, which is stripped by regex.

**`wishlists`** — one document per user (`userId` uniquely indexed) holding an array of listing ids.

**`admins`** — username, BCrypt password hash, role and an `active` flag.

### Search

Search is implemented in `ListingRepositoryCustomImpl` with `MongoTemplate` rather than derived queries, because filters are optional and combine freely:

- Always constrained to `status = AVAILABLE`.
- Free-text matches `title` or `subject` with a case-insensitive regex. The term is length-capped at 70 characters and passed through `Pattern.quote`, so regex metacharacters in user input are treated literally.
- Optional `type` and `category` equality filters.
- Sorting by `priceAsc`, `priceDesc`, or newest first by default.
- The count runs before pagination is applied, so `totalElements` reflects the whole result set rather than the page.

---

## Caching

Redis sits in front of MongoDB as a read-through cache, driven by `ListingCacheService`. Values are stored as JSON strings — `RedisConfig` registers a `RedisTemplate` with `StringRedisSerializer` on keys, values, hash keys and hash values, so everything in Redis stays human-readable and portable rather than Java-serialized.

### Three cache families

| Cache | Key shape | TTL | Invalidation |
| --- | --- | --- | --- |
| Single listing | `listing:{listingId}` | 12h | Key deleted directly |
| Latest feed | `listings:latest:{version}:{page}:{size}` | 2h | Version counter bumped |
| Search results | `listings:search:{version}:{sha256}` | 2h | Version counter bumped |

TTLs are not hard-coded — they come from `application.properties` and are injected into `ListingService`:

```properties
vitbookmart.cache.listing.ttl-hours=12
vitbookmart.cache.latest.ttl-hours=2
vitbookmart.cache.search.ttl-hours=2
```

### Versioned keys instead of key scanning

Paginated and filtered results fan out into a large number of keys — every page size, every filter combination, every sort order. Deleting them individually would mean a `SCAN` over the keyspace on every write.

Instead, the page and search caches embed a version number held at `listings:latest:version` and `listings:search:version`. Invalidation is a single `INCR`: every subsequent key is built with the new version, so the entire previous generation is orphaned at once and expires on its own TTL. Creating the counter uses `SETNX` so two concurrent requests can't both initialise it to a conflicting value.

### Cache key construction for search

Search parameters are normalised before hashing — trimmed, lowercased, with nulls and blanks collapsed to the literal `"null"` — then joined with `|` and hashed with SHA-256:

```
query | type | category | sort | page | size   →  sha256  →  listings:search:{version}:{hash}
```

Normalising first means `"Physics"`, `" physics "` and `"PHYSICS"` all land on the same cache entry instead of three.

### Write-path invalidation

| Operation | Effect on cache |
| --- | --- |
| Create listing | Bumps the latest and search versions |
| Update listing | Full invalidation: deletes the listing key, bumps both versions |
| Mark sold / available | Full invalidation |
| Admin update / delete | Full invalidation |

### Failure behaviour

The cache never takes the request down. Deserialization failures are caught, logged, the poisoned key is deleted, and the request falls through to MongoDB as a normal miss. Serialization failures on write are logged and swallowed — the response still goes out. Empty search results are deliberately *not* cached, so a query that returns nothing today doesn't keep returning nothing for two hours after matching listings appear.

### Client-side caching

Both SPAs run TanStack Query with a policy tuned to the server cache: a 2-minute `staleTime`, a 10-minute `gcTime`, and no refetch on window focus. Retries are suppressed for errors that can never succeed on a retry — 404, 401, 403, validation failures, terminated accounts, incomplete profiles and ownership violations — so a 401 doesn't race the refresh interceptor. Query keys are centralised in `lib/queryKeys.ts` in a hierarchy (`["listings","search",params]`, `["listings","detail",id]`, `["me"]`, `["wishlist"]`) so invalidation after a mutation stays surgical. Authenticated data is dropped entirely on sign-out so nothing leaks between accounts.

Routes are lazily loaded with `React.lazy` — only the home page ships in the main bundle. The backend Dockerfile copies `pom.xml` and runs `mvn dependency:go-offline` before copying sources, so the dependency layer stays cached across source-only rebuilds.

---

## Image handling

Every listing carries exactly one image. The pipeline spans all three tiers.

### 1. Browser-side downscaling

Phone cameras produce 12–48 MP photos of several megabytes, while a listing is displayed a few hundred pixels wide. `lib/image.ts` downscales before upload:

- Files under 400 KB are left alone — already cheap to send.
- Larger files are drawn to a canvas, capped at 1600 px on the longest edge, and re-encoded as JPEG at quality 0.82.
- Transparent regions in PNG/WEBP sources are painted white first, since JPEG has no alpha channel and would otherwise render them black.
- Modern browsers apply EXIF orientation to both `naturalWidth/Height` and `drawImage`, so rotated phone photos come out upright.
- If the re-encoded blob isn't actually smaller, the original is kept.
- **Every failure path returns the original file untouched.** The backend validates independently, so a skipped resize can never make things worse.

### 2. Client-side validation

`ImageUploader` mirrors the server's rules so a doomed upload is rejected before it goes over the wire: JPEG, PNG or WEBP, under 5 MB, exactly one file. It supports drag-and-drop, a file picker and a direct camera input, with object-URL previews that are revoked on replacement to avoid leaking blob references.

### 3. Server-side validation and upload

`ListingService.validateImage` re-checks everything — non-empty, at most 5 MB, and a content type of `image/jpeg`, `image/png` or `image/webp`. `ImageService` then uploads the bytes to Cloudinary under the `vitbookmart/listings` folder and persists only the returned `secure_url`. Cloudinary is configured with `secure=true`, so URLs are always HTTPS.

Multipart limits are set in `application.properties`:

```properties
spring.servlet.multipart.max-file-size=5MB
spring.servlet.multipart.max-request-size=6MB
server.tomcat.max-swallow-size=10MB
```

`max-swallow-size` is raised above the default 2 MB deliberately. When a request is rejected before its body is read — an expired token, an oversized upload — Tomcat drains only up to that limit before resetting the connection. With the default, a typical phone photo exceeds it and the client sees a network error instead of the real 401 or 413.

### 4. Delivery-time transformation

Thumbnails are generated by Cloudinary on demand rather than stored. `ImageService.getThumbnailUrl` rewrites the URL path:

```
/upload/  →  /upload/w_200,h_400,c_limit,q_auto,f_auto/
```

`c_limit` preserves aspect ratio without upscaling, `q_auto` picks a quality level per image, and `f_auto` serves WebP or AVIF to browsers that accept them. `ListingMapper` applies this to the lightweight `ListingResponse` used in grids and feeds, while `ListingDetailResponse` carries the full-resolution URL for the detail page.

### 5. Rendering

`ListingImage` wraps each image with its own loading and failure states: a skeleton while loading, an `ImageOff` placeholder on error, so one broken URL degrades gracefully instead of leaving an empty card. Grid cards use `loading="lazy"`, detail pages opt into `priority` for eager loading with `fetchPriority="high"`, and decoding is async throughout.

### Upload-path token refresh

A subtle interaction gets special handling in `api/axios.ts`. Relying on the usual 401-then-replay path breaks for uploads: the server rejects a stale token before reading the multipart body, then drops the connection mid-upload. Browsers — Safari especially — report that as a network error with no response, so the 401 never reaches the refresh logic and posting a listing fails. The request interceptor therefore refreshes proactively when the access token is within 30 seconds of expiry, sidestepping the problem for every request.

---

## Authentication and authorization

### Student sign-in

1. The SPA sends the user to Google with the configured client ID and redirect URI.
2. Google returns an authorization code to `/auth/callback`.
3. The SPA posts the code to `POST /api/auth/google`.
4. `GoogleOAuthService` exchanges it server-side (the client secret never leaves the backend), then verifies the returned ID token with `GoogleIdTokenVerifier`, checking the audience against the client ID.
5. `AuthService` rejects any email that doesn't end in `@vitstudent.ac.in`, blocks `TERMINATED` accounts, and creates the user on first login.
6. The response carries an access token, a refresh token and the user object.

### Tokens

Tokens are stateless HMAC-signed JWTs. Access tokens live 15 minutes; refresh tokens live 30 days. Every token carries a `type` claim, and `JwtAuthenticationConverter` enforces it on the way in:

| `type` | Granted authorities |
| --- | --- |
| `ACCESS` | authenticated user, no roles |
| `ADMIN_ACCESS` | `ROLE_ADMIN` (only if the `role` claim is also `ADMIN`) |
| anything else | rejected |

Because `REFRESH` and `ADMIN_REFRESH` tokens fail that check, a refresh token can never be replayed as a bearer credential on an API route. Refresh tokens are not rotated — `/api/auth/refresh` mints a new access token and echoes the same refresh token back.

On the client, `tokenStore` is the single module that touches token storage. Parallel 401s are collapsed into one in-flight refresh and the queued requests are replayed afterwards, so a burst of expired requests triggers exactly one refresh rather than several. The trade-off of persisting the refresh token in `localStorage` is documented in that module: the backend issues tokens in the JSON body rather than an httpOnly cookie, so a standalone SPA has to persist it to survive a reload.

### Route protection

`SecurityConfig` is stateless (`SessionCreationPolicy.STATELESS`), with CSRF disabled since no cookies are used. Public routes: CORS preflight, `/api/auth/**`, admin login and refresh, `GET /api/health`, and the public listing reads (`/api/listings`, `/api/listings/latest`, `/api/listings/search`, `/api/listings/{id}`). `/api/admin/**` requires `ROLE_ADMIN`. Everything else requires authentication.

Selling additionally requires a complete profile — `UserService.validateProfileComplete` runs before a listing is created, which is what makes the WhatsApp handover possible. Completeness means name, email, WhatsApp number, and a hostel with a type and block; the room number is currently commented out of the check.

### Admin access

Admins authenticate with username and password against BCrypt hashes. Note that `POST /api/admin/create` is itself behind `hasRole("ADMIN")`, so it cannot bootstrap an empty system; the first admin must be inserted directly into MongoDB with a BCrypt hash.

### CORS

`CorsConfig` allow-lists the dev origin and the production domains, permits the standard verbs plus `OPTIONS`, allows all request headers (so preflight can carry `Authorization` and `Content-Type`), exposes `Authorization`, and sets a one-hour preflight cache. Credentials are disabled, since authentication travels in the `Authorization` header rather than cookies.

### Errors

`GlobalExceptionHandler` maps domain exceptions to a consistent envelope of `timestamp`, `status`, `error`, `message` and `path`. `ResourceNotFoundException` → 404; `BadRequestException`, `ProfileIncompleteException`, `IllegalArgumentException`, `IllegalStateException` and bean-validation failures → 400. The frontend's `api/errors.ts` narrows these into typed error kinds that drive both the retry policy and the UI.

---

## API reference

Base path `/api`. 🔓 public, 🔒 authenticated, 👮 admin.

### Auth

| Method | Endpoint | | Description |
| --- | --- | --- | --- |
| POST | `/api/auth/google` | 🔓 | Exchange a Google authorization code for tokens |
| POST | `/api/auth/refresh` | 🔓 | Mint a new access token from a refresh token |
| POST | `/api/admin/auth/login` | 🔓 | Admin username/password login |
| POST | `/api/admin/auth/refresh` | 🔓 | Refresh an admin access token |

### Listings

| Method | Endpoint | | Description |
| --- | --- | --- | --- |
| GET | `/api/listings` | 🔓 | All available listings |
| GET | `/api/listings/latest` | 🔓 | Paginated newest-first feed (default size 20) |
| GET | `/api/listings/search` | 🔓 | Filter by `query`, `type`, `category`, `sort`, paginated |
| GET | `/api/listings/{listingId}` | 🔓 | Listing detail with seller info |
| GET | `/api/listings/contact/{listingId}` | 🔓 | Seller's WhatsApp deep link |
| POST | `/api/listings/create` | 🔒 | Create a listing (multipart: `listing` + `image`) |
| PUT | `/api/listings/update/{listingId}` | 🔒 | Update your own listing |
| PATCH | `/api/listings/markSold/{listingId}` | 🔒 | Mark your listing sold |
| PATCH | `/api/listings/markAvailable/{listingId}` | 🔒 | Re-list your listing |

Ownership is checked on every write — editing someone else's listing returns a 400 rather than silently succeeding.

### Users

| Method | Endpoint | | Description |
| --- | --- | --- | --- |
| GET | `/api/users/me` | 🔒 | Current profile |
| PUT | `/api/users/me/update` | 🔒 | Update name, WhatsApp number, hostel |
| GET | `/api/users/my/listings` | 🔒 | Your own listings |

### Wishlist

| Method | Endpoint | | Description |
| --- | --- | --- | --- |
| GET | `/api/wishlist/my` | 🔒 | Your wishlist |
| POST | `/api/wishlist/add/{listingId}` | 🔒 | Add (204) |
| DELETE | `/api/wishlist/remove/{listingId}` | 🔒 | Remove (204) |
| GET | `/api/wishlist/isWishlisted/{listingId}` | 🔒 | Boolean check |
| DELETE | `/api/wishlist/clear` | 🔒 | Clear the wishlist |

### Admin

| Method | Endpoint | | Description |
| --- | --- | --- | --- |
| GET | `/api/admin/users` | 👮 | All users |
| GET | `/api/admin/users/{userId}` | 👮 | One user |
| PATCH | `/api/admin/users/terminate/{userId}` | 👮 | Terminate an account |
| PATCH | `/api/admin/users/paid/{userId}` | 👮 | Set status `PAID` |
| PATCH | `/api/admin/users/free/{userId}` | 👮 | Set status `FREE` |
| DELETE | `/api/admin/users/{userId}` | 👮 | Delete a user |
| GET | `/api/admin/listings` | 👮 | All listings |
| GET | `/api/admin/listings/available` | 👮 | Available only |
| GET | `/api/admin/listings/sold` | 👮 | Sold only |
| GET | `/api/admin/listings/{listingId}` | 👮 | One listing |
| PUT | `/api/admin/listings/{listingId}` | 👮 | Update any listing |
| DELETE | `/api/admin/listings/{listingId}` | 👮 | Delete any listing |
| POST | `/api/admin/create` | 👮 | Create an admin |
| GET | `/api/admin/admins` | 👮 | All admins |
| GET | `/api/admin/{adminId}` | 👮 | One admin |
| GET | `/api/admin/username?username=` | 👮 | Look up by username |
| PUT | `/api/admin/update/{adminId}` | 👮 | Update an admin |
| DELETE | `/api/admin/admins/{adminId}` | 👮 | Delete an admin |

### Health

| Method | Endpoint | | Description |
| --- | --- | --- | --- |
| GET | `/api/health` | 🔓 | Returns `{"status":"UP"}` |

---

## Running locally

### Prerequisites

Java 17, Node.js 18+, a MongoDB instance (local or Atlas), a Redis instance, a Cloudinary account, and Google OAuth 2.0 web credentials.

### Backend

```bash
cd backend

export Mongo_URL="mongodb://localhost:27017/vitbookmart"
export REDIS_HOST=localhost
export REDIS_PORT=6379
export REDIS_USERNAME=default
export REDIS_PASSWORD=""
export CLOUDINARY_CLOUD_NAME=...
export CLOUDINARY_API_KEY=...
export CLOUDINARY_API_SECRET=...
export GOOGLE_CLIENT_ID=...
export GOOGLE_CLIENT_SECRET=...
export GOOGLE_REDIRECT_URI=http://localhost:5173/auth/callback
export JWT_SECRET=...   # Base64-encoded, long enough for HMAC-SHA

./mvnw spring-boot:run
```

`JWT_SECRET` is Base64-decoded before the HMAC key is derived, so it must be valid Base64. `GOOGLE_REDIRECT_URI` must match the frontend's value byte for byte — the backend replays it during the code exchange, and Google rejects any mismatch.

Or with Docker:

```bash
cd backend
docker build -t vitbookmart-backend .
docker run -p 8080:8080 --env-file .env vitbookmart-backend
```

### Student frontend

```bash
cd frontend
npm install
cp .env.example .env     # fill in the Google client ID
npm run dev              # http://localhost:5173
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload and the `/api` proxy |
| `npm run build` | Type-check, then build `dist/` |
| `npm run preview` | Serve the production build |
| `npm run lint` | `tsc --noEmit` |
| `node scripts/contract-check.mjs` | Runs the real API layer against a mock shaped exactly like the backend's responses |
| `node scripts/refresh-check.mjs` | Asserts an expired token triggers exactly one refresh, replays the queue, and ends the session on a dead refresh token |

The contract check is worth calling out: it bundles the app's actual `src/api/*.ts` modules with Vite and runs them against a mock that reproduces the backend's field names, enum values, `LocalDateTime` format, 204s and error envelope. Anything the frontend expects that the backend doesn't send shows up as a failure rather than as a runtime bug.

### Admin portal

```bash
cd admin-frontend
npm install
npm run dev
```

The admin app reads only `VITE_API_BASE_URL` and `VITE_BACKEND_TIME_IS_UTC`, both of which have working defaults, so no `.env` is required for local development — set `VITE_API_PROXY_TARGET` if your backend isn't on `http://localhost:8080`.

> **Note:** `admin-frontend/vite.config.ts` currently sets `server.port` to `5173`, the same port as the student app, even though the surrounding comment and its README describe 5174. Running both at once means one of them gets bumped to a random port. Changing that value to `5174` makes the two match their documentation.

---

## Configuration

### Backend environment variables

| Variable | Purpose |
| --- | --- |
| `Mongo_URL` | MongoDB connection string |
| `REDIS_HOST` / `REDIS_PORT` | Redis endpoint |
| `REDIS_USERNAME` / `REDIS_PASSWORD` | Redis credentials |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Cloudinary credentials |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth credentials |
| `GOOGLE_REDIRECT_URI` | Must match the frontend exactly |
| `JWT_SECRET` | Base64-encoded HMAC signing key |

Tunable in `application.properties`: the three cache TTLs, multipart limits, `server.tomcat.max-swallow-size`, and `spring.data.mongodb.auto-index-creation` (enabled, so the compound indexes are created at startup).

### Frontend environment variables

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Backend origin. Leave empty in dev so requests go to `/api` and the Vite proxy forwards them |
| `VITE_API_PROXY_TARGET` | Dev proxy target, default `http://localhost:8080` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth **web client ID** — public, safe in the bundle |
| `VITE_GOOGLE_REDIRECT_URI` | Must match the backend's value exactly |
| `VITE_GOOGLE_HOSTED_DOMAIN` | Optional `hd` hint pre-filtering the account chooser. A UX nicety, never a security control |
| `VITE_BACKEND_TIME_IS_UTC` | `true` when the backend runs in UTC, so relative timestamps are computed correctly |
| `VITE_CONTRIBUTE_URL` / `VITE_CONTACT_EMAIL` | Footer links |

The Google **client secret** never appears in frontend configuration — the backend holds it and performs the code exchange itself. Every variable is funnelled through `src/config/env.ts`; nothing else in either app reads `import.meta.env` directly.

Timestamps are worth noting: the backend serialises `LocalDateTime` with no timezone offset, which is why `VITE_BACKEND_TIME_IS_UTC` exists — without it, "2 hours ago" would be computed against the wrong zone.

---

## Deployment

The backend ships as a multi-stage Docker image: `maven:3.9-eclipse-temurin-17` builds the JAR, `eclipse-temurin:17-jre` runs it, exposing port 8080. Dependencies are resolved in their own layer before sources are copied, so source-only changes don't re-download the world.

Both SPAs build to static `dist/` directories deployable to any static host. The production origins currently allow-listed in `CorsConfig` are `https://vitbookmart.in`, `https://www.vitbookmart.in` and an AWS Amplify deployment, alongside `http://localhost:5173` for development — adding a new deployment origin means updating that list.

---

## Project layout

```
backend/src/main/java/com/vitbookmart/
├── config/          CloudinaryConfig, RedisConfig, CorsConfig, MongoConfig
├── controller/      Auth, Listing, User, Wishlist, ContactSeller, Admin, AdminAuth, Health
├── dto/
│   ├── request/     Create/Update listing, profile, admin, Google auth, refresh
│   └── response/    Listing, ListingDetail, Paginated, User, Wishlist, Auth, Error, SellerInfo
├── entity/          Listing, User, Wishlist, Admin, Hostel + enums/
├── exception/       GlobalExceptionHandler + domain exceptions
├── mapper/          ListingMapper, UserMapper, WishlistMapper
├── repository/      Mongo repositories + custom search implementation
├── security/        SecurityConfig, JwtService, JwtConfig, JwtAuthenticationConverter,
│                    AdminAuthenticationToken, AuthenticatedUserService
└── service/         Auth, GoogleOAuth, Listing, ListingCache, Image, User,
                     Wishlist, ContactSeller, Admin, AdminAuth

frontend/src/
├── api/             axios instance + interceptors, tokenStore, per-domain API modules
├── components/      auth, common, footer, home, listings, navbar, profile, sell, wishlist
├── config/          env.ts — the only reader of import.meta.env
├── constants/       app, labels, hostel
├── context/         AuthContext
├── hooks/           useListings, useProfile, useWishlist, useBrowseParams, useDebounce, …
├── layouts/         MainLayout
├── lib/             image.ts, queryClient.ts, queryKeys.ts, format.ts, cn.ts
├── pages/           Home, Browse, ListingDetails, Sell, EditListing, Wishlist,
│                    Profile, MyListings, Login, AuthCallback, NotFound
├── routes/          AppRoutes, ProtectedRoute, ScrollToTop
└── types/           api.ts, enums.ts

admin-frontend/src/
├── api/             adminApi, adminAuthApi, axios, tokenStore
├── components/      ui/ (DataTable, Modal, Badge, …), layout/Sidebar
├── context/         AdminAuthContext
├── pages/           Dashboard, Users, Listings, Admins, Login, NotFound
└── lib/             objectId.ts, queryClient.ts, queryKeys.ts, format.ts
```
