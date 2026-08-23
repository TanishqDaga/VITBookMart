import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { env } from "@/config/env";
import { tokenStore } from "./tokenStore";
import type { AuthResponse } from "@/types";

/**
 * The single axios instance for the whole app.
 *
 * baseURL is empty in development, so calls go to a relative "/api/..." path and
 * the Vite dev proxy forwards them. In production VITE_API_BASE_URL points at the
 * deployed backend origin.
 */
export const api = axios.create({
  baseURL: env.apiBaseUrl,
  headers: { Accept: "application/json" },
  timeout: 30_000,
});

/**
 * A bare client for the refresh call. Using `api` here would recurse through the
 * response interceptor when the refresh itself returns 401.
 */
const refreshClient = axios.create({
  baseURL: env.apiBaseUrl,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
  timeout: 15_000,
});

interface RetriableRequest extends InternalAxiosRequestConfig {
  _retriedAfterRefresh?: boolean;
  /** The access token this request actually went out with. */
  _accessTokenUsed?: string | null;
}

/** Endpoints that must never trigger a refresh attempt. */
const AUTH_PATHS = ["/api/auth/google", "/api/auth/refresh"];

function isAuthEndpoint(url?: string): boolean {
  if (!url) return false;
  return AUTH_PATHS.some((path) => url.includes(path));
}

// ---------------------------------------------------------------------------
// Session-expiry hand-off
// ---------------------------------------------------------------------------

type SessionExpiredHandler = () => void;
let onSessionExpired: SessionExpiredHandler | null = null;

/** AuthContext registers here so a dead session can clear React state and redirect. */
export function setSessionExpiredHandler(handler: SessionExpiredHandler | null) {
  onSessionExpired = handler;
}

function endSession() {
  tokenStore.clear();
  onSessionExpired?.();
}

// ---------------------------------------------------------------------------
// Request: attach the access token
// ---------------------------------------------------------------------------

api.interceptors.request.use((config) => {
  const token = tokenStore.getAccessToken();
  if (token && !isAuthEndpoint(config.url)) {
    config.headers.set("Authorization", `Bearer ${token}`);
    (config as RetriableRequest)._accessTokenUsed = token;
  }
  return config;
});

// ---------------------------------------------------------------------------
// Response: refresh once, then replay the queued requests
// ---------------------------------------------------------------------------

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStore.getRefreshToken();
  if (!refreshToken) return null;

  try {
    // POST /api/auth/refresh -> AuthResponse { accessToken, refreshToken, user }
    // The backend echoes the same refresh token back; it does not rotate it.
    const { data } = await refreshClient.post<AuthResponse>("/api/auth/refresh", {
      refreshToken,
    });

    if (!data?.accessToken) return null;

    tokenStore.setAccessToken(data.accessToken);
    if (data.user) tokenStore.setUser(data.user);
    return data.accessToken;
  } catch {
    // Expired, malformed, or the account was terminated — either way the session is over.
    return null;
  }
}

/** Collapses parallel 401s into a single refresh request. */
function requestRefresh(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = refreshAccessToken().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableRequest | undefined;

    const shouldTryRefresh =
      error.response?.status === 401 &&
      original !== undefined &&
      !original._retriedAfterRefresh &&
      !isAuthEndpoint(original.url) &&
      tokenStore.getRefreshToken() !== null;

    if (!shouldTryRefresh) {
      // A 401 we can't recover from, on a request that carried credentials.
      if (error.response?.status === 401 && tokenStore.getRefreshToken()) {
        endSession();
      }
      return Promise.reject(error);
    }

    original!._retriedAfterRefresh = true;

    /**
     * Requests fired together get their 401s back at slightly different times.
     * If a sibling already refreshed while this response was in flight, the
     * stored token has moved on — replay with it rather than refreshing again.
     */
    const current = tokenStore.getAccessToken();
    if (current && current !== original!._accessTokenUsed) {
      original!.headers.set("Authorization", `Bearer ${current}`);
      return api(original!);
    }

    const newToken = await requestRefresh();

    if (!newToken) {
      endSession();
      return Promise.reject(error);
    }

    original!.headers.set("Authorization", `Bearer ${newToken}`);
    return api(original!);
  },
);

// ---------------------------------------------------------------------------
// Thin helpers so call sites don't repeat `.then(r => r.data)`
// ---------------------------------------------------------------------------

export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await api.get<T>(url, config);
  return data;
}

export async function post<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const { data } = await api.post<T>(url, body, config);
  return data;
}

export async function put<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const { data } = await api.put<T>(url, body, config);
  return data;
}

export async function patch<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const { data } = await api.patch<T>(url, body, config);
  return data;
}

export async function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await api.delete<T>(url, config);
  return data;
}
