import { post } from "./axios";
import { env } from "@/config/env";
import type { AuthResponse } from "@/types";

/**
 * Google OAuth 2.0 "authorization code" flow.
 *
 * The backend (GoogleOAuthService) exchanges the code server-side using
 * GoogleAuthorizationCodeTokenRequest with its own client secret AND its own
 * configured redirect_uri. Google requires the redirect_uri sent at exchange time
 * to match the one used to obtain the code, so VITE_GOOGLE_REDIRECT_URI must equal
 * the backend's GOOGLE_REDIRECT_URI exactly.
 *
 * That is also why we use a full-page redirect rather than a popup: Google's popup
 * mode issues codes bound to the special "postmessage" redirect_uri, which the
 * backend does not use.
 */
const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const STATE_KEY = "vbm.oauthState";
const RETURN_TO_KEY = "vbm.returnTo";

function randomState(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Builds the consent URL and remembers where to send the user afterwards. */
export function buildGoogleAuthUrl(returnTo?: string): string {
  const state = randomState();
  try {
    sessionStorage.setItem(STATE_KEY, state);
    if (returnTo) sessionStorage.setItem(RETURN_TO_KEY, returnTo);
    else sessionStorage.removeItem(RETURN_TO_KEY);
  } catch {
    /* sessionStorage blocked — the state check below will simply be skipped */
  }

  const params = new URLSearchParams({
    client_id: env.googleClientId,
    redirect_uri: env.googleRedirectUri,
    response_type: "code",
    // The backend reads email + name from the verified ID token.
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });

  // A hint for the account chooser only. The backend is the authority on who may sign in.
  if (env.googleHostedDomain) params.set("hd", env.googleHostedDomain);

  return `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;
}

export function consumeOAuthState(): string | null {
  try {
    const state = sessionStorage.getItem(STATE_KEY);
    sessionStorage.removeItem(STATE_KEY);
    return state;
  } catch {
    return null;
  }
}

export function consumeReturnTo(): string | null {
  try {
    const returnTo = sessionStorage.getItem(RETURN_TO_KEY);
    sessionStorage.removeItem(RETURN_TO_KEY);
    return returnTo;
  } catch {
    return null;
  }
}

export const authApi = {
  /** POST /api/auth/google  body: { code }  -> AuthResponse. Public. */
  loginWithGoogle(code: string) {
    return post<AuthResponse>("/api/auth/google", { code });
  },

  /** POST /api/auth/refresh  body: { refreshToken } -> AuthResponse. Public. */
  refresh(refreshToken: string) {
    return post<AuthResponse>("/api/auth/refresh", { refreshToken });
  },
};
