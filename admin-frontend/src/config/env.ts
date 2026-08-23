const raw = import.meta.env;

const str = (v: unknown, fallback = "") =>
  typeof v === "string" && v.trim() !== "" ? v.trim() : fallback;

/** The only module that reads import.meta.env. */
export const env = {
  apiBaseUrl: str(raw.VITE_API_BASE_URL).replace(/\/+$/, ""),
  backendTimeIsUtc: str(raw.VITE_BACKEND_TIME_IS_UTC, "true") !== "false",
} as const;
