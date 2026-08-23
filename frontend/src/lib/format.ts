import { env } from "@/config/env";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const inrWithPaise = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** ₹450, ₹1,200, ₹12,500 — decimals only when the price actually has them. */
export function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  if (value === 0) return "Free";
  return Number.isInteger(value) ? inr.format(value) : inrWithPaise.format(value);
}

/**
 * The backend serialises java.time.LocalDateTime, which carries no offset
 * (e.g. "2026-08-23T09:14:52.318"). JavaScript would read that as local time.
 * Most deployments run in UTC, so we append "Z" unless configured otherwise.
 */
export function parseBackendDate(value: string | null | undefined): Date | null {
  if (!value) return null;

  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(value);
  const normalised = hasZone || !env.backendTimeIsUtc ? value : `${value}Z`;

  const date = new Date(normalised);
  return Number.isNaN(date.getTime()) ? null : date;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** "Just now", "2 hours ago", "Yesterday", "3 days ago", then an absolute date. */
export function formatRelativeDate(value: string | null | undefined): string {
  const date = parseBackendDate(value);
  if (!date) return "";

  const diff = Date.now() - date.getTime();

  // Clock skew or a non-UTC backend can produce a future timestamp; don't say "in 4 hours".
  if (diff < MINUTE) return "Just now";
  if (diff < HOUR) {
    const minutes = Math.floor(diff / MINUTE);
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }
  if (diff < DAY) {
    const hours = Math.floor(diff / HOUR);
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }
  if (diff < 2 * DAY) return "Yesterday";
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)} days ago`;

  return formatDate(value);
}

/** "23 Aug 2026" */
export function formatDate(value: string | null | undefined): string {
  const date = parseBackendDate(value);
  if (!date) return "";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Machine-readable value for <time dateTime="…">. */
export function toIsoString(value: string | null | undefined): string | undefined {
  return parseBackendDate(value)?.toISOString();
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** First letter of a name, for avatar placeholders. */
export function initialsOf(name: string | null | undefined): string {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return "?";
  return trimmed.charAt(0).toUpperCase();
}

/** "Tanishq Sharma" -> "Tanishq" */
export function firstNameOf(name: string | null | undefined): string {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return "";
  return trimmed.split(/\s+/)[0];
}
