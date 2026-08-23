/**
 * Single source of truth for runtime configuration.
 * Nothing else in the app reads import.meta.env directly.
 */

const raw = import.meta.env;

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : fallback;
}

/**
 * Base URL for API calls.
 *
 * Empty string => requests go to a relative "/api/..." path. In development the
 * Vite dev server proxies that to the backend, which sidesteps the fact that the
 * backend ships no CORS configuration.
 */
const apiBaseUrl = str(raw.VITE_API_BASE_URL).replace(/\/+$/, "");

export const env = {
  apiBaseUrl,
  googleClientId: str(raw.VITE_GOOGLE_CLIENT_ID),
  googleRedirectUri: str(
    raw.VITE_GOOGLE_REDIRECT_URI,
    `${window.location.origin}/auth/callback`,
  ),
  googleHostedDomain: str(raw.VITE_GOOGLE_HOSTED_DOMAIN),
  /** Backend serialises LocalDateTime with no offset; assume UTC unless told otherwise. */
  backendTimeIsUtc: str(raw.VITE_BACKEND_TIME_IS_UTC, "true") !== "false",
  contributeUrl: str(raw.VITE_CONTRIBUTE_URL),
  contactEmail: str(raw.VITE_CONTACT_EMAIL),
  isDev: raw.DEV,
} as const;

export const isGoogleConfigured = env.googleClientId.length > 0;
