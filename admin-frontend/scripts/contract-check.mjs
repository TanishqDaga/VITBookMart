/**
 * Admin contract conformance check.
 *
 * The mock reproduces what the Spring backend actually emits for /api/admin/**:
 * RAW ENTITIES, including the ObjectId `{ timestamp, date }` shape and the bcrypt
 * password hash on Admin. It then runs the portal's own api modules against it.
 */
import http from "node:http";
import { build } from "vite";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import fs from "node:fs";

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, "..");
const PORT = 8097;

let passed = 0;
let failed = 0;
const check = (name, ok, detail = "") => {
  ok ? passed++ : failed++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${!ok && detail ? ` — ${detail}` : ""}`);
};

const now = "2026-08-23T09:14:52.318";

// How Jackson serialises a bare org.bson.types.ObjectId (bson 5.8.0 exposes
// getTimestamp() and getDate(), and neither entity annotates the field).
const brokenId = { timestamp: 1755939292, date: 1755939292000 };
// What it looks like once @JsonSerialize(using = ToStringSerializer.class) is added.
const fixedId = "66b1f2c4e4b0a1d2c3e4f5a6";

const ADMIN_ACCESS_TOKEN = (() => {
  const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url");
  return `${b64({ alg: "HS256" })}.${b64({
    sub: "66b1f2c4e4b0a1d2c3e4f5b7",
    username: "root",
    role: "ADMIN",
    type: "ADMIN_ACCESS",
  })}.sig`;
})();

const USER_ACCESS_TOKEN = (() => {
  const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url");
  return `${b64({ alg: "HS256" })}.${b64({ sub: "x", email: "a@b.c", type: "ACCESS" })}.sig`;
})();

const rawAdmin = (id) => ({
  id,
  username: "root",
  // AdminController returns the entity, hash and all.
  password: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
  role: "ADMIN",
  active: true,
  createdAt: now,
  updatedAt: now,
});

const rawUser = (id) => ({
  id,
  name: "Tanishq",
  email: "tanishq.2023@vitstudent.ac.in",
  googleId: "108234509823450982345",
  whatsappNumber: "9876543210",
  hostel: { type: "MH", block: "B", room: "412" },
  status: "FREE",
  createdAt: now,
  updatedAt: now,
});

const rawListing = (id) => ({
  id,
  sellerId: id,
  title: "Engineering Chemistry textbook",
  description: "Lightly used.",
  subject: "Engineering Chemistry",
  type: "RENT",
  unavailableExamSlots: ["A1", "C2"],
  category: "BOOK",
  price: 450.0,
  imageUrl: "https://res.cloudinary.com/demo/image/upload/x.jpg",
  status: "AVAILABLE",
  createdAt: now,
  updatedAt: now,
});

const seen = [];
let useFixedIds = false;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  const p = url.pathname;
  seen.push(`${req.method} ${p}${url.search}`);
  const id = () => (useFixedIds ? fixedId : brokenId);
  const json = (s, b) => {
    res.writeHead(s, { "Content-Type": "application/json" });
    res.end(JSON.stringify(b));
  };
  const err = (s, m) => json(s, { timestamp: now, status: s, error: "Bad Request", message: m, path: p });

  if (req.method === "POST" && p === "/api/admin/auth/login") {
    let raw = "";
    req.on("data", (c) => (raw += c));
    return req.on("end", () => {
      const body = JSON.parse(raw);
      if (body.password !== "correct") return err(400, "Invalid username or password");
      json(200, { accessToken: ADMIN_ACCESS_TOKEN, refreshToken: "admin.refresh" });
    });
  }

  if (req.method === "POST" && p === "/api/admin/auth/refresh") {
    let raw = "";
    req.on("data", (c) => (raw += c));
    return req.on("end", () =>
      json(200, { accessToken: ADMIN_ACCESS_TOKEN, refreshToken: JSON.parse(raw).refreshToken }),
    );
  }

  // Everything under /api/admin/** needs ROLE_ADMIN.
  if (req.headers.authorization !== `Bearer ${ADMIN_ACCESS_TOKEN}`) {
    res.writeHead(401, { "WWW-Authenticate": 'Bearer error="invalid_token"' });
    return res.end();
  }

  if (req.method === "GET" && p === "/api/admin/admins") return json(200, [rawAdmin(id())]);
  if (req.method === "POST" && p === "/api/admin/create") return json(201, rawAdmin(id()));
  if (req.method === "PUT" && p.startsWith("/api/admin/update/")) {
    const username = url.searchParams.get("username");
    if (!username) return err(400, "username query parameter missing");
    return json(200, { ...rawAdmin(id()), username });
  }
  if (req.method === "DELETE" && p.startsWith("/api/admin/admins/")) {
    res.writeHead(204);
    return res.end();
  }

  if (req.method === "GET" && p === "/api/admin/users") return json(200, [rawUser(id())]);
  if (req.method === "PATCH" && p.startsWith("/api/admin/users/terminate/"))
    return json(200, { ...rawUser(id()), status: "TERMINATED" });
  if (req.method === "PATCH" && p.startsWith("/api/admin/users/paid/"))
    return json(200, { ...rawUser(id()), status: "PAID" });
  if (req.method === "PATCH" && p.startsWith("/api/admin/users/free/"))
    return json(200, { ...rawUser(id()), status: "FREE" });
  if (req.method === "DELETE" && p.startsWith("/api/admin/users/")) {
    res.writeHead(204);
    return res.end();
  }

  if (req.method === "GET" && p === "/api/admin/listings/available") return json(200, [rawListing(id())]);
  if (req.method === "GET" && p === "/api/admin/listings/sold") return json(200, []);
  if (req.method === "GET" && p === "/api/admin/listings") return json(200, [rawListing(id())]);
  if (req.method === "PUT" && p.startsWith("/api/admin/listings/")) {
    let raw = "";
    req.on("data", (c) => (raw += c));
    return req.on("end", () => json(200, { ...rawListing(id()), __received: JSON.parse(raw) }));
  }
  if (req.method === "DELETE" && p.startsWith("/api/admin/listings/")) {
    res.writeHead(204);
    return res.end();
  }

  err(400, "Listing not found");
});

const entry = path.join(root, "scripts", ".entry.ts");
fs.writeFileSync(
  entry,
  `export { adminApi } from "@/api/adminApi";
export { adminAuthApi } from "@/api/adminAuthApi";
export { tokenStore, decodeAdminIdentity } from "@/api/tokenStore";
export { toApiError } from "@/api/errors";
export { toHexId, hasUsableId, objectIdCreatedAt, summariseIds, shortId } from "@/lib/objectId";
`,
);

const store = new Map();
const ws = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};
globalThis.window = { localStorage: ws, addEventListener() {}, removeEventListener() {} };
globalThis.localStorage = ws;
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
    "import.meta.env.VITE_BACKEND_TIME_IS_UTC": JSON.stringify("true"),
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
await new Promise((r) => server.listen(PORT, r));
console.log(`\nAdmin contract checks on :${PORT}\n`);

try {
  // --- auth ---------------------------------------------------------------
  try {
    await api.adminAuthApi.login({ username: "root", password: "wrong" });
    check("bad credentials reject", false);
  } catch (error) {
    const mapped = api.toApiError(error);
    check("wrong password maps to invalidCredentials", mapped.kind === "invalidCredentials", mapped.kind);
  }

  const auth = await api.adminAuthApi.login({ username: "root", password: "correct" });
  check("login returns accessToken + refreshToken only", Boolean(auth.accessToken && auth.refreshToken && !("user" in auth)));

  api.tokenStore.setSession(auth.accessToken, auth.refreshToken);
  const identity = api.tokenStore.getIdentity();
  check("identity is decoded from the ADMIN_ACCESS token claims", identity?.username === "root" && identity.adminId.length === 24);
  check("a student ACCESS token is rejected as an admin identity", api.decodeAdminIdentity(USER_ACCESS_TOKEN) === null);

  // --- the password-hash leak --------------------------------------------
  const admins = await api.adminApi.getAdmins();
  check("bcrypt hash is stripped before reaching app state", !("password" in admins[0]), JSON.stringify(Object.keys(admins[0])));
  check("admin record keeps username, role and active", admins[0].username === "root" && admins[0].active === true);

  // --- degraded ObjectId --------------------------------------------------
  check("the { timestamp, date } id yields no hex id", api.toHexId(admins[0].id) === null);
  check("hasUsableId is false for the degraded shape", api.hasUsableId(admins[0].id) === false);
  check("shortId says 'unavailable' rather than inventing one", api.shortId(admins[0].id) === "unavailable");
  const created = api.objectIdCreatedAt(admins[0].id);
  check("creation time is still recoverable from the timestamp", created instanceof Date && !Number.isNaN(created.getTime()));
  const summary = api.summariseIds(admins, (a) => a.id);
  check("summariseIds reports none usable, so the UI can warn once", summary.noneUsable === true && summary.usable === 0);

  const users = await api.adminApi.getUsers();
  check("user list still parses despite the broken id", users[0].email.includes("@") && users[0].googleId.length > 0);

  // --- once the backend is patched ---------------------------------------
  useFixedIds = true;
  const fixedAdmins = await api.adminApi.getAdmins();
  check("a hex id is accepted with no frontend change", api.toHexId(fixedAdmins[0].id) === fixedId);
  check("shortId abbreviates a real id", api.shortId(fixedAdmins[0].id) === "66b1f2…f5a6");
  const fixedSummary = api.summariseIds(fixedAdmins, (a) => a.id);
  check("summariseIds reports all usable once patched", fixedSummary.allUsable === true);

  // --- writes -------------------------------------------------------------
  const renamed = await api.adminApi.updateAdminUsername(fixedId, "newname");
  check("rename sends username as a QUERY parameter, not a body", renamed.username === "newname");
  check("rename response also has its hash stripped", !("password" in renamed));

  const terminated = await api.adminApi.terminateUser(fixedId);
  check("terminate uses PATCH and returns the updated user", terminated.status === "TERMINATED");
  const paid = await api.adminApi.makeUserPaid(fixedId);
  check("make paid uses its own PATCH route", paid.status === "PAID");

  await api.adminApi.deleteUser(fixedId);
  await api.adminApi.deleteListing(fixedId);
  await api.adminApi.deleteAdmin(fixedId);
  check("deletes tolerate a 204 with no body", true);

  const updated = await api.adminApi.updateListing(fixedId, {
    title: "T", description: "D", subject: "S", category: "BOOK",
    type: "SALE", price: 100, status: "SOLD", unavailableExamSlots: [],
  });
  const body = updated.__received;
  const EIGHT = ["title", "description", "subject", "category", "type", "price", "status", "unavailableExamSlots"];
  check("listing update sends all eight fields the service overwrites",
    EIGHT.every((field) => field in body), EIGHT.filter((f) => !(f in body)).join(", "));

  const available = await api.adminApi.getAvailableListings();
  const sold = await api.adminApi.getSoldListings();
  check("available and sold scopes hit their own endpoints", available.length === 1 && sold.length === 0);

  // --- routing sanity -----------------------------------------------------
  check("listings/available was not swallowed by listings/{id}",
    seen.includes("GET /api/admin/listings/available"));
  check("no student-side endpoint was ever called",
    !seen.some((entry) => /\/api\/(auth|users|wishlist|listings)\b/.test(entry)),
    seen.filter((e) => /\/api\/(auth|users|wishlist|listings)\b/.test(e)).join(", "));
} catch (error) {
  failed += 1;
  console.log("  FAIL  unexpected throw —", error?.stack ?? error);
} finally {
  server.close();
  fs.rmSync(entry, { force: true });
  fs.rmSync(path.join(root, "scripts/.tmp"), { recursive: true, force: true });
}

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
