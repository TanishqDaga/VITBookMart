/**
 * Verifies the axios response interceptor: an expired access token must trigger
 * exactly ONE refresh, then replay every queued request — and a dead refresh
 * token must end the session instead of looping.
 */
import http from "node:http";
import { build } from "vite";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import fs from "node:fs";

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, "..");
const PORT = 8098;

let passed = 0, failed = 0;
const check = (name, ok, detail = "") => {
  ok ? passed++ : failed++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${!ok && detail ? ` — ${detail}` : ""}`);
};

let refreshCalls = 0;
let refreshWorks = true;
let validToken = "access.v1";

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  const json = (s, b) => { res.writeHead(s, { "Content-Type": "application/json" }); res.end(JSON.stringify(b)); };

  if (url.pathname === "/api/auth/refresh") {
    refreshCalls++;
    if (!refreshWorks) return json(400, { timestamp: "", status: 400, error: "Bad Request", message: "Invalid or expired refresh token", path: url.pathname });
    validToken = "access.v2";
    let raw = ""; req.on("data", c => raw += c);
    return req.on("end", () => json(200, { accessToken: validToken, refreshToken: JSON.parse(raw).refreshToken, user: { id: "a".repeat(24), name: "T", email: "t@v.in", whatsappNumber: null, hostel: null, status: "FREE", createdAt: null, updatedAt: null } }));
  }

  if (req.headers.authorization !== `Bearer ${validToken}`) {
    res.writeHead(401, { "WWW-Authenticate": 'Bearer error="invalid_token"' });
    return res.end();
  }
  return json(200, { ok: url.pathname });
});

const entry = path.join(root, "scripts", ".entry2.ts");
fs.writeFileSync(entry, `export { api, setSessionExpiredHandler } from "@/api/axios";\nexport { tokenStore } from "@/api/tokenStore";\n`);

const store = new Map();
const ws = { getItem: k => store.has(k) ? store.get(k) : null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) };
globalThis.window = { location: { origin: "http://localhost:5173" }, localStorage: ws, addEventListener() {}, removeEventListener() {} };
globalThis.localStorage = ws; globalThis.sessionStorage = ws;

await build({
  root, logLevel: "error", configFile: false,
  resolve: { alias: { "@": path.join(root, "src") } },
  define: Object.fromEntries(["VITE_API_BASE_URL","VITE_GOOGLE_CLIENT_ID","VITE_GOOGLE_REDIRECT_URI","VITE_BACKEND_TIME_IS_UTC","VITE_GOOGLE_HOSTED_DOMAIN","VITE_CONTRIBUTE_URL","VITE_CONTACT_EMAIL"]
    .map(k => [`import.meta.env.${k}`, JSON.stringify(k === "VITE_API_BASE_URL" ? `http://127.0.0.1:${PORT}` : "")])
    .concat([["import.meta.env.DEV", "false"]])),
  build: { ssr: entry, outDir: "scripts/.tmp2", emptyOutDir: true, rollupOptions: { output: { format: "es", entryFileNames: "ax.mjs" } }, minify: false },
});

const m = await import(pathToFileURL(path.join(root, "scripts/.tmp2/ax.mjs")).href);
await new Promise(r => server.listen(PORT, r));
console.log(`\nRefresh-flow checks on :${PORT}\n`);

try {
  // Session holds a token the server no longer accepts.
  m.tokenStore.setSession("access.STALE", "refresh.good", { id: "a".repeat(24) });

  // Five requests fire at once, all 401. Only one refresh should go out.
  const results = await Promise.all([1,2,3,4,5].map(n => m.api.get(`/api/x${n}`).then(r => r.data.ok)));
  check("all five queued requests succeed after refresh", results.length === 5 && results.every(Boolean));
  check("parallel 401s collapse into a single refresh call", refreshCalls === 1, `${refreshCalls} calls`);
  check("new access token is persisted", m.tokenStore.getAccessToken() === "access.v2");

  // Now the refresh token itself is dead.
  refreshCalls = 0; refreshWorks = false; validToken = "access.NOBODY";
  let sessionEnded = false;
  m.setSessionExpiredHandler(() => { sessionEnded = true; });

  await m.api.get("/api/y").then(() => check("dead refresh rejects", false)).catch(() => check("dead refresh rejects the original request", true));
  check("failed refresh ends the session", sessionEnded);
  check("failed refresh clears stored tokens", m.tokenStore.getRefreshToken() === null);
  check("no refresh loop: exactly one attempt", refreshCalls === 1, `${refreshCalls} calls`);
} catch (e) { failed++; console.log("  FAIL  threw —", e?.message ?? e); }
finally {
  server.close();
  fs.rmSync(entry, { force: true });
  fs.rmSync(path.join(root, "scripts/.tmp2"), { recursive: true, force: true });
}

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
