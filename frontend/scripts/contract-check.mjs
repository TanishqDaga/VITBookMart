/**
 * Runs the app's real api/*.ts modules (compiled on the fly by Vite's esbuild)
 * against the contract mock, then asserts on what came back.
 */
import { server } from "./mock-backend.mjs";
import { build } from "vite";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import fs from "node:fs";

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, "..");

const PORT = 8099;
let passed = 0;
let failed = 0;

function check(name, condition, detail = "") {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

// --- bundle the api layer so we exercise the real source, not a copy ---------
const entry = path.join(root, "scripts", ".entry.ts");
fs.writeFileSync(
  entry,
  `export { authApi } from "@/api/authApi";
export { listingApi } from "@/api/listingApi";
export { userApi } from "@/api/userApi";
export { wishlistApi } from "@/api/wishlistApi";
export { tokenStore } from "@/api/tokenStore";
export { toApiError } from "@/api/errors";
export { formatPrice, formatRelativeDate } from "@/lib/format";
`,
);

// Minimal browser globals the modules touch at import time.
const store = new Map();
const webStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};
globalThis.window = {
  location: { origin: "http://localhost:5173" },
  localStorage: webStorage,
  addEventListener() {},
  removeEventListener() {},
};
globalThis.localStorage = webStorage;
globalThis.sessionStorage = webStorage;
// Node 22 defines `navigator` as a getter-only global, so patch the property.
if (!("onLine" in globalThis.navigator)) {
  Object.defineProperty(globalThis.navigator, "onLine", { value: true, configurable: true });
}

await build({
  root,
  logLevel: "error",
  configFile: false,
  resolve: { alias: { "@": path.join(root, "src") } },
  define: {
    "import.meta.env.VITE_API_BASE_URL": JSON.stringify(`http://127.0.0.1:${PORT}`),
    "import.meta.env.VITE_GOOGLE_CLIENT_ID": JSON.stringify("test-client-id"),
    "import.meta.env.VITE_GOOGLE_REDIRECT_URI": JSON.stringify("http://localhost:5173/auth/callback"),
    "import.meta.env.VITE_BACKEND_TIME_IS_UTC": JSON.stringify("true"),
    "import.meta.env.VITE_GOOGLE_HOSTED_DOMAIN": JSON.stringify(""),
    "import.meta.env.VITE_CONTRIBUTE_URL": JSON.stringify(""),
    "import.meta.env.VITE_CONTACT_EMAIL": JSON.stringify(""),
    "import.meta.env.DEV": "false",
  },
  build: {
    ssr: entry,
    outDir: "scripts/.tmp",
    emptyOutDir: true,
    rollupOptions: { output: { format: "es", entryFileNames: "api.mjs" } },
    minify: false,
  },
});

const api = await import(pathToFileURL(path.join(root, "scripts/.tmp/api.mjs")).href);

await new Promise((resolve) => server.listen(PORT, resolve));
console.log(`\nContract checks against mock backend on :${PORT}\n`);

try {
  // --- auth ---------------------------------------------------------------
  const auth = await api.authApi.loginWithGoogle("fake-google-code");
  check("POST /api/auth/google returns accessToken + refreshToken + user",
    Boolean(auth.accessToken && auth.refreshToken && auth.user?.id));
  check("AuthResponse.user.id is a hex string, not an object",
    typeof auth.user.id === "string" && /^[a-f\d]{24}$/.test(auth.user.id));

  api.tokenStore.setSession(auth.accessToken, auth.refreshToken, auth.user);
  check("tokenStore reports an authenticated session", api.tokenStore.isAuthenticated());

  const refreshed = await api.authApi.refresh(auth.refreshToken);
  check("POST /api/auth/refresh echoes the same refresh token",
    refreshed.refreshToken === auth.refreshToken && refreshed.accessToken !== auth.accessToken);

  // --- public listings ----------------------------------------------------
  const latest = await api.listingApi.getLatest(0, 8);
  check("latest returns PaginatedResponse fields",
    Array.isArray(latest.content) &&
      typeof latest.page === "number" &&
      typeof latest.totalElements === "number" &&
      typeof latest.first === "boolean" &&
      typeof latest.last === "boolean");
  check("ListingResponse carries no category (list DTO omits it)",
    !("category" in latest.content[0]));

  const search = await api.listingApi.search({
    query: "chem", type: "SALE", category: "BOOK", sort: "priceAsc", page: 0, size: 12,
  });
  check("search sends only the backend's parameter names", Boolean(search.content));

  const detail = await api.listingApi.getById("66b1f2c4e4b0a1d2c3e4f5a6");
  check("detail exposes description, category and seller",
    detail.description !== undefined && detail.category === "BOOK" && detail.seller?.name === "Tanishq");
  check("RENT detail exposes unavailableExamSlots",
    Array.isArray(detail.unavailableExamSlots) && detail.unavailableExamSlots.includes("A1"));

  // --- multipart ----------------------------------------------------------
  const image = new File([new Uint8Array([1, 2, 3])], "book.jpg", { type: "image/jpeg" });
  const created = await api.listingApi.create(
    { title: "T", description: "D", subject: "S", category: "BOOK", type: "SALE", price: 450, unavailableExamSlots: [] },
    image,
  );
  check("multipart boundary generated by the browser, not hand-set", created.__check.hasBoundary);
  check('part "listing" is sent as application/json (required by @RequestPart)',
    created.__check.listingPartIsJson);
  check('part "image" is present with the exact field name', created.__check.hasImagePart);

  // --- authenticated ------------------------------------------------------
  const me = await api.userApi.getMe();
  check("GET /api/users/me sends the bearer token", me.email.includes("@"));

  const mine = await api.userApi.getMyListings();
  check("GET /api/users/my/listings returns a bare array", Array.isArray(mine));

  const wishlist = await api.wishlistApi.getMine();
  check("GET /api/wishlist/my returns { listings }", Array.isArray(wishlist.listings));

  await api.wishlistApi.add("66b1f2c4e4b0a1d2c3e4f5a6");
  await api.wishlistApi.remove("66b1f2c4e4b0a1d2c3e4f5a6");
  check("wishlist add/remove tolerate a 204 with no body", true);

  const sold = await api.listingApi.markAsSold("66b1f2c4e4b0a1d2c3e4f5a6");
  check("markSold uses PATCH and returns the updated listing", sold.status === "SOLD");

  const contact = await api.listingApi.getContactUrl("66b1f2c4e4b0a1d2c3e4f5a6");
  check("contact seller returns the backend-built wa.me URL",
    contact.whatsappUrl === "https://wa.me/919876543210");

  // --- errors -------------------------------------------------------------
  try {
    await api.listingApi.getById("000000000000000000000000");
    check("404 rejects", false);
  } catch (error) {
    const mapped = api.toApiError(error);
    check('backend "Listing not found" becomes a friendly message',
      mapped.kind === "notFound" && mapped.message === "This listing is no longer available.",
      mapped.message);
  }

  // --- formatting ---------------------------------------------------------
  check("price uses Indian grouping with no stray decimals",
    api.formatPrice(1200) === "₹1,200" && api.formatPrice(450) === "₹450",
    `${api.formatPrice(1200)} / ${api.formatPrice(450)}`);
  check("LocalDateTime with no offset produces a sane relative date",
    !api.formatRelativeDate("2026-08-23T09:14:52.318").startsWith("in "));
} catch (error) {
  failed += 1;
  console.log("  FAIL  unexpected throw —", error?.message ?? error);
} finally {
  server.close();
  fs.rmSync(entry, { force: true });
  fs.rmSync(path.join(root, "scripts/.tmp"), { recursive: true, force: true });
}

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
