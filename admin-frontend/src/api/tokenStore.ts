import type { AdminIdentity } from "@/types";

/**
 * Admin session storage.
 *
 * Keys are prefixed "vbm.admin." so this portal and the student frontend can be
 * served from the same origin without trampling each other's sessions. The two
 * token families are separate on the backend too: admin tokens carry
 * type=ADMIN_ACCESS / ADMIN_REFRESH and are rejected by the user endpoints.
 *
 * Same trade-off as the student app: the backend returns tokens in a JSON body
 * rather than an httpOnly cookie, so a standalone SPA has to persist them itself.
 * This module is the only place that touches storage.
 */

const ACCESS_KEY = "vbm.admin.accessToken";
const REFRESH_KEY = "vbm.admin.refreshToken";

let accessCache: string | null = null;

const read = (key: string) => {
  try { return window.localStorage.getItem(key); } catch { return null; }
};
const write = (key: string, value: string) => {
  try { window.localStorage.setItem(key, value); } catch { /* private mode */ }
};
const drop = (key: string) => {
  try { window.localStorage.removeItem(key); } catch { /* ignore */ }
};

/**
 * Reads the payload of an ADMIN_ACCESS token.
 *
 * Display only — this does NOT verify the signature and must never gate anything
 * that matters. The backend is the authority. We do it because
 * AdminAuthResponse carries only tokens, with no admin object to show in the UI.
 */
export function decodeAdminIdentity(accessToken: string | null): AdminIdentity | null {
  if (!accessToken) return null;
  const segments = accessToken.split(".");
  if (segments.length !== 3) return null;

  try {
    const base64 = segments[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const claims = JSON.parse(atob(padded)) as Record<string, unknown>;

    // JwtService.generateAdminAccessToken: subject=adminId, claims username + role + type.
    if (claims.type !== "ADMIN_ACCESS") return null;

    return {
      adminId: typeof claims.sub === "string" ? claims.sub : "",
      username: typeof claims.username === "string" ? claims.username : "",
    };
  } catch {
    return null;
  }
}

export const tokenStore = {
  getAccessToken(): string | null {
    if (accessCache === null) accessCache = read(ACCESS_KEY);
    return accessCache;
  },
  getRefreshToken: () => read(REFRESH_KEY),
  getIdentity(): AdminIdentity | null {
    return decodeAdminIdentity(tokenStore.getAccessToken());
  },
  setSession(accessToken: string, refreshToken: string) {
    accessCache = accessToken;
    write(ACCESS_KEY, accessToken);
    write(REFRESH_KEY, refreshToken);
  },
  setAccessToken(accessToken: string) {
    accessCache = accessToken;
    write(ACCESS_KEY, accessToken);
  },
  clear() {
    accessCache = null;
    drop(ACCESS_KEY);
    drop(REFRESH_KEY);
  },
  isAuthenticated: () => read(REFRESH_KEY) !== null,
};
