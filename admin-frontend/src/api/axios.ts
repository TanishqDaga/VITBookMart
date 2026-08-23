import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { env } from "@/config/env";
import { tokenStore } from "./tokenStore";
import type { AdminAuthResponse } from "@/types";

export const api = axios.create({
  baseURL: env.apiBaseUrl,
  headers: { Accept: "application/json" },
  timeout: 30_000,
});

/** Separate client so a 401 on refresh can't recurse through the interceptor. */
const refreshClient = axios.create({
  baseURL: env.apiBaseUrl,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
  timeout: 15_000,
});

interface RetriableRequest extends InternalAxiosRequestConfig {
  _retriedAfterRefresh?: boolean;
  _accessTokenUsed?: string | null;
}

const AUTH_PATHS = ["/api/admin/auth/login", "/api/admin/auth/refresh"];
const isAuthEndpoint = (url?: string) => !!url && AUTH_PATHS.some((p) => url.includes(p));

let onSessionExpired: (() => void) | null = null;
export function setSessionExpiredHandler(handler: (() => void) | null) {
  onSessionExpired = handler;
}

function endSession() {
  tokenStore.clear();
  onSessionExpired?.();
}

api.interceptors.request.use((config) => {
  const token = tokenStore.getAccessToken();
  if (token && !isAuthEndpoint(config.url)) {
    config.headers.set("Authorization", `Bearer ${token}`);
    (config as RetriableRequest)._accessTokenUsed = token;
  }
  return config;
});

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStore.getRefreshToken();
  if (!refreshToken) return null;

  try {
    // POST /api/admin/auth/refresh -> AdminAuthResponse { accessToken, refreshToken }.
    // AdminAuthService echoes the same refresh token back and re-checks admin.isActive(),
    // so a deactivated admin is cut off at the next refresh.
    const { data } = await refreshClient.post<AdminAuthResponse>(
      "/api/admin/auth/refresh",
      { refreshToken },
    );
    if (!data?.accessToken) return null;
    tokenStore.setAccessToken(data.accessToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

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

    const recoverable =
      error.response?.status === 401 &&
      original !== undefined &&
      !original._retriedAfterRefresh &&
      !isAuthEndpoint(original.url) &&
      tokenStore.getRefreshToken() !== null;

    if (!recoverable) {
      if (error.response?.status === 401 && tokenStore.getRefreshToken()) endSession();
      return Promise.reject(error);
    }

    original!._retriedAfterRefresh = true;

    // A sibling request may have refreshed while this 401 was in flight.
    const current = tokenStore.getAccessToken();
    if (current && current !== original!._accessTokenUsed) {
      original!.headers.set("Authorization", `Bearer ${current}`);
      return api(original!);
    }

    const token = await requestRefresh();
    if (!token) {
      endSession();
      return Promise.reject(error);
    }

    original!.headers.set("Authorization", `Bearer ${token}`);
    return api(original!);
  },
);

export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return (await api.get<T>(url, config)).data;
}
export async function post<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return (await api.post<T>(url, body, config)).data;
}
export async function put<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return (await api.put<T>(url, body, config)).data;
}
export async function patch<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return (await api.patch<T>(url, body, config)).data;
}
export async function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return (await api.delete<T>(url, config)).data;
}
