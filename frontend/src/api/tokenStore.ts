import type { UserResponse } from "@/types";

/**
 * Central token storage. No other module reads or writes these keys.
 *
 * The backend issues a stateless 15-minute access token and a 30-day refresh
 * token in the JSON body of POST /api/auth/google. It does not set an httpOnly
 * cookie, so a standalone SPA has to persist the refresh token itself if the
 * session is to survive a page reload.
 *
 * Trade-off, stated plainly: localStorage is readable by any script running on
 * this origin, so a successful XSS would expose the refresh token. We accept it
 * because the backend contract leaves no safer option, and we keep the surface
 * small — one module, one place to change if the backend later moves to cookies.
 */

const ACCESS_TOKEN_KEY = "vbm.accessToken";
const REFRESH_TOKEN_KEY = "vbm.refreshToken";
const USER_KEY = "vbm.user";

/** Kept in memory too so the hot path never touches localStorage. */
let accessTokenCache: string | null = null;

type Listener = () => void;
const listeners = new Set<Listener>();

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage full or blocked (private mode) — session degrades to in-memory */
  }
}

function safeRemove(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export const tokenStore = {
  getAccessToken(): string | null {
    if (accessTokenCache === null) {
      accessTokenCache = safeGet(ACCESS_TOKEN_KEY);
    }
    return accessTokenCache;
  },

  getRefreshToken(): string | null {
    return safeGet(REFRESH_TOKEN_KEY);
  },

  getUser(): UserResponse | null {
    const raw = safeGet(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserResponse;
    } catch {
      safeRemove(USER_KEY);
      return null;
    }
  },

  setSession(accessToken: string, refreshToken: string, user: UserResponse) {
    accessTokenCache = accessToken;
    safeSet(ACCESS_TOKEN_KEY, accessToken);
    safeSet(REFRESH_TOKEN_KEY, refreshToken);
    safeSet(USER_KEY, JSON.stringify(user));
    notify();
  },

  /** POST /api/auth/refresh returns a fresh access token and echoes the refresh token. */
  setAccessToken(accessToken: string) {
    accessTokenCache = accessToken;
    safeSet(ACCESS_TOKEN_KEY, accessToken);
  },

  setUser(user: UserResponse) {
    safeSet(USER_KEY, JSON.stringify(user));
    notify();
  },

  clear() {
    accessTokenCache = null;
    safeRemove(ACCESS_TOKEN_KEY);
    safeRemove(REFRESH_TOKEN_KEY);
    safeRemove(USER_KEY);
    notify();
  },

  isAuthenticated(): boolean {
    return Boolean(tokenStore.getRefreshToken());
  },

  /** Lets AuthContext react when the interceptor clears a dead session. */
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

function notify() {
  listeners.forEach((listener) => listener());
}
