import { env } from "@/config/env";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 0,
});

export function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  if (value === 0) return "Free";
  return Number.isInteger(value) ? inr.format(value) : inr.format(Math.round(value));
}

/** LocalDateTime arrives with no offset; assume UTC unless configured otherwise. */
export function parseBackendDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(value);
  const normalised = hasZone || !env.backendTimeIsUtc ? value : `${value}Z`;
  const date = new Date(normalised);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "23 Aug 2026, 14:32" — admins need the time, not a fuzzy "3 days ago". */
export function formatDateTime(value: string | Date | null | undefined): string {
  const date = value instanceof Date ? value : parseBackendDate(value);
  if (!date) return "—";
  return date.toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

export function formatDate(value: string | Date | null | undefined): string {
  const date = value instanceof Date ? value : parseBackendDate(value);
  if (!date) return "—";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function toIsoString(value: string | Date | null | undefined): string | undefined {
  const date = value instanceof Date ? value : parseBackendDate(value);
  return date?.toISOString();
}

export function initialsOf(name: string | null | undefined): string {
  const trimmed = (name ?? "").trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "?";
}
