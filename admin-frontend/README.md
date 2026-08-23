# VITBookMart — Admin Portal

A staff console for the VITBookMart Spring Boot backend: manage student accounts,
moderate listings, and administer admin accounts.

Built as a **separate application** from the student frontend. The two share no
code and no session: admin tokens carry `type=ADMIN_ACCESS`, student tokens carry
`type=ACCESS`, and `JwtAuthenticationConverter` rejects each on the other's routes.
Keeping them apart means the admin bundle is never shipped to students, the portal
can be deployed behind separate network controls, and neither app's `localStorage`
keys collide when both run on `localhost`.

---

## Quick start

```bash
npm install
cp .env.example .env
npm run dev            # http://localhost:5174
```

The backend should be on `http://localhost:8080`. Port 5174 keeps this off the
student app's 5173 so both can run at once.

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with the `/api` proxy |
| `npm run build` | Type-check, then produce `dist/` |
| `npm run preview` | Serve the production build |
| `npm run lint` | `tsc --noEmit` |
| `node scripts/contract-check.mjs` | Runs the API layer against a mock that reproduces the backend's raw-entity responses |

### Getting the first admin account

`POST /api/admin/create` is itself behind `hasRole("ADMIN")`, so it cannot
bootstrap an empty system. The first admin has to be inserted directly into
MongoDB with a bcrypt hash:

```js
// mongosh
db.admins.insertOne({
  username: "root",
  password: "$2a$10$...",   // bcrypt hash of the password, cost 10
  role: "ADMIN",
  active: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

After that, every further admin can be created from the Admins page.

---

## Read this before deploying: three backend problems

These were found by reading the source. Two are blocking. **I have not modified
any backend code** — each is written up here with the fix.

### 1. The backend does not currently compile — `AdminMapper`

`mapper/AdminMapper.java` calls `admin.getName()` and `admin.getEmail()`:

```java
return new AdminResponse(admin.getId(), admin.getName(), admin.getEmail());
```

But `entity/Admin` has `username`, `password`, `role`, `active`, `createdAt`,
`updatedAt` — no `name`, no `email`. The compiled `AdminMapper.class` in `target/`
is stale (dated before the entity was refactored), which is why a packaged jar
exists. A clean `mvn compile` will fail.

`AdminMapper` is injected nowhere — `AdminController` returns raw entities — so it
is dead code. **Deleting `AdminMapper.java` and `AdminResponse.java` fixes the
build.** The alternative, keeping them, is the better long-term answer (see #2).

### 2. Record IDs are unusable — this blocks every per-record action

`AdminController` returns raw MongoDB entities. `Admin`, `User` and `Listing` all
declare a bare `ObjectId id` with no Jackson annotation, so Jackson serialises it
by bean properties. bson 5.8.0 exposes `getTimestamp()` and `getDate()`, producing:

```json
"id": { "timestamp": 1755939292, "date": 1755939292000 }
```

An ObjectId is 12 bytes: 4 of timestamp, 5 random, 3 counter. Only the first 4 are
transmitted, so **the full id cannot be reconstructed** — not by this portal, not by
anything. Every endpoint addressed by id (`/users/terminate/{userId}`,
`/listings/{listingId}`, `/admins/{adminId}`, …) is unreachable.

The public DTOs already solve this, which is how the student app works:

```java
@JsonSerialize(using = ToStringSerializer.class)
private ObjectId id;
```

**Fix — one annotation on each of the three entities:**

```java
// entity/Admin.java, entity/User.java, entity/Listing.java
import tools.jackson.databind.annotation.JsonSerialize;
import tools.jackson.databind.ser.std.ToStringSerializer;

@Id
@JsonSerialize(using = ToStringSerializer.class)
private ObjectId id;
```

`Listing.sellerId` and `Wishlist.userId` need the same treatment if they are ever
returned. The cleaner fix is admin DTOs, which would also solve #3.

**How the portal behaves meanwhile.** `src/lib/objectId.ts` accepts either shape.
While ids are unusable the portal loads and displays every record normally, shows a
banner explaining exactly what is broken and how to fix it, and **disables the
per-row actions** rather than firing requests it knows will 400. It still surfaces
each record's creation time, which the timestamp bytes do give us. The moment the
annotation is added, everything enables itself — no frontend change required. This
is covered both ways in `scripts/contract-check.mjs`.

### 3. `GET /api/admin/admins` returns bcrypt password hashes

The raw `Admin` entity includes `password`, so the admin list ships every hash over
the wire. Hashes are not plaintext, but shipping them lets anyone with a valid admin
token take them away for offline cracking, and they land in browser caches, devtools
and error reports.

This portal strips `password` in `api/adminApi.ts` the moment a response arrives, so
it never enters React state or the query cache. **That is damage control on the
client, not a fix** — the data is still on the wire. The real fix is an admin DTO
without the password field, or `@JsonIgnore` on `Admin.password`.

### Also worth knowing

- **Admin writes never invalidate the Redis cache.** `ListingService` calls
  `listingCacheService.invalidateListingCaches(...)` on every write;
  `AdminService.updateListing` and `deleteListing` do not. An admin edit or deletion
  won't appear on the student site until the TTL expires — up to 2 hours for
  latest/search, 12 hours for a single listing detail. Injecting `ListingCacheService`
  into `AdminService` and calling it on write would fix this.
- **`deleteUser` cascades, `deleteListing` is narrower.** Deleting a user deletes
  their listings, pulls those from every wishlist, and deletes their own wishlist.
  Deleting a listing pulls it from wishlists but nothing else. The confirmation
  dialogs say which is which.
- **Most "not found" errors arrive as HTTP 400,** because `AdminService` throws
  `IllegalArgumentException`. `api/errors.ts` recognises them by message text.
- **No pagination, filtering or sorting server-side.** Every list endpoint returns
  the whole collection. Search, sort and paging are therefore done client-side over
  data already in memory. Fine for a campus-scale dataset; it will not hold up past
  a few thousand rows, at which point the backend needs `Pageable` support.
- **No admin deactivation or password reset.** `active` is set to `true` at creation
  and there is no endpoint to change it, nor to change a password. A lost password
  means deleting and recreating the account. The UI says so rather than offering a
  control that doesn't exist.
- **No CORS configuration** anywhere in the backend, same as the student app. Dev
  works through the Vite proxy; production needs the CORS block documented in the
  student frontend's README.
- **`PUT /api/admin/update/{adminId}` takes `username` as a query parameter,** not a
  body. The portal sends it that way.

---

## Endpoints used

All under `/api/admin/**`, all requiring `ROLE_ADMIN` except the two auth routes.

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/admin/auth/login` | `{ username, password }` → `{ accessToken, refreshToken }` |
| `POST` | `/api/admin/auth/refresh` | `{ refreshToken }` → new access token, same refresh token |
| `GET` | `/api/admin/admins` | All admin accounts |
| `POST` | `/api/admin/create` | Create an admin |
| `PUT` | `/api/admin/update/{adminId}?username=` | Rename an admin |
| `DELETE` | `/api/admin/admins/{adminId}` | Delete an admin |
| `GET` | `/api/admin/users` | All users |
| `PATCH` | `/api/admin/users/terminate/{userId}` | Set status TERMINATED |
| `PATCH` | `/api/admin/users/paid/{userId}` | Set status PAID |
| `PATCH` | `/api/admin/users/free/{userId}` | Set status FREE |
| `DELETE` | `/api/admin/users/{userId}` | Delete user and cascade |
| `GET` | `/api/admin/listings` | All listings |
| `GET` | `/api/admin/listings/available` | Status AVAILABLE |
| `GET` | `/api/admin/listings/sold` | Status SOLD |
| `PUT` | `/api/admin/listings/{listingId}` | Overwrite eight fields |
| `DELETE` | `/api/admin/listings/{listingId}` | Delete and pull from wishlists |

**Not used:** `GET /api/admin/{adminId}` and `GET /api/admin/username?username=` —
the list endpoint already returns every field they would. Both are implemented in
`api/adminApi.ts` for contract completeness.

**The listing update overwrites unconditionally.** `AdminService.updateListing`
copies `title`, `description`, `subject`, `category`, `type`, `price`,
`unavailableExamSlots` and `status` off the body with no null checks, so omitting a
field writes `null`. The edit form always sends all eight. `sellerId`, `imageUrl`
and `createdAt` are untouched server-side and cannot be edited here.

---

## Authentication

```
/login → POST /api/admin/auth/login
       → { accessToken, refreshToken } stored under vbm.admin.*
       → identity read from the access token's claims
```

`AdminAuthResponse` carries only tokens — no admin object — so the signed-in
username and id are read from the JWT payload in `api/tokenStore.ts`. That decode is
**display only**: it does not verify the signature and gates nothing. A token whose
`type` isn't `ADMIN_ACCESS` is refused as an identity, so a student token can never
produce an admin session in the UI.

Access tokens last 15 minutes, refresh tokens 30 days. A 401 triggers one refresh
and replays the request; parallel 401s collapse into a single refresh call, and a
failed refresh clears the session with one message and no retry loop — the same
interceptor design as the student app.

On boot the portal spends the refresh token immediately rather than trusting the
stored access token. `AdminAuthService.refreshAdminToken` re-checks `admin.isActive()`
and that the record still exists, so a deleted or deactivated admin is cut off at
the next page load instead of lingering for up to 15 minutes.

Tokens live in `localStorage` for the same reason as the student app: the backend
returns them in a JSON body rather than an httpOnly cookie. Given this console's
privileges, that trade-off is worth revisiting — moving admin auth to an httpOnly,
`SameSite=Strict` cookie would be a real improvement, and `tokenStore.ts` is the only
file that would change.

---

## Architecture

```
src/
├── api/          axios instance, token store, error mapping, adminApi, adminAuthApi
├── components/
│   ├── ui/       Button, Input/Field/Select, Badge, Modal, DataTable, IdCell, states
│   └── layout/   Sidebar and mobile drawer
├── config/       env.ts — the only reader of import.meta.env
├── constants/    enum labels
├── context/      AdminAuthContext
├── hooks/        useAdminData — every query and mutation
├── layouts/      AdminLayout
├── lib/          cn, format, objectId, queryClient, queryKeys
├── pages/        Login, Dashboard, Users, Listings, Admins, NotFound
├── routes/       AppRoutes, ProtectedRoute
└── types/        enums.ts + api.ts, mirroring the raw entities
```

`DataTable` handles search, sorting and paging for all three management screens, so
each page only declares its columns and actions.

### Cache strategy

Operational data goes stale in ways that matter, so windows are short: 15-second
`staleTime` and refetch on window focus, against the student app's two minutes.
Every query is `enabled` only when authenticated, and the entire cache is cleared on
sign-out so no admin's view of user data survives into the next session.

Invalidation is targeted. A user status change invalidates users only; deleting a
user also invalidates listings, because the backend cascade removes theirs. Listing
writes invalidate the `["admin","listings"]` prefix, which covers all three scopes at
once since a status edit moves a record between them.

### Dashboard figures

There is no statistics endpoint, so every number on the Overview page is counted
client-side from the three list endpoints. Nothing is sampled or estimated — each
figure is a count over records actually received. If the collections grow past what
is reasonable to load in one request, the dashboard needs a real backend aggregate.

---

## Deployment

`npm run build` emits a static `dist/`. As a client-side router it needs unknown
paths rewritten to `index.html`.

This console has no rate limiting, no audit log and no IP restriction of its own —
the backend provides none of those. Put it behind whatever access control you use
for internal tools (VPN, SSO proxy, IP allow-list) rather than exposing it publicly.
`index.html` sets `noindex, nofollow`, which discourages crawlers but is not a
security control.

---

## Accessibility

Semantic landmarks and a skip link; a single `:focus-visible` ring with a dark-surface
variant for the sidebar; focus-trapped dialogs that close on Escape and restore focus;
sortable headers exposing `aria-sort`; status conveyed by label as well as colour;
`prefers-reduced-motion` respected. Tables scroll horizontally with lower-priority
columns hidden below `lg`, and the sidebar becomes a drawer on small screens.
