import type { RawObjectId } from "@/types";

/**
 * Recovering a usable id from the admin API.
 *
 * The public DTOs annotate their id with @JsonSerialize(using = ToStringSerializer.class),
 * so they emit a 24-character hex string. The admin controller returns raw entities
 * instead, and com.vitbookmart.entity.{Admin,User,Listing} carry no such annotation.
 * Jackson therefore serialises org.bson.types.ObjectId by its bean properties —
 * bson 5.8.0 exposes getTimestamp() and getDate() — producing:
 *
 *     "id": { "timestamp": 1755000000, "date": 1755000000000 }
 *
 * Those four timestamp bytes are only a third of an ObjectId; the remaining eight
 * bytes (random value + counter) are not transmitted, so the full id CANNOT be
 * reconstructed. Any endpoint addressed by id is unreachable until the backend is
 * fixed. The fix is one annotation per entity — see the README.
 *
 * These helpers accept either shape, so the portal starts working the moment the
 * backend is patched, with no frontend changes. Until then it disables per-record
 * actions and says why, rather than firing requests it knows will fail.
 */

const HEX_24 = /^[a-f\d]{24}$/i;

/** A usable hex id, or null when the backend didn't send one. */
export function toHexId(value: RawObjectId | undefined): string | null {
  if (typeof value === "string") return HEX_24.test(value) ? value : null;
  return null;
}

/** True when this record can be targeted by an id-addressed endpoint. */
export function hasUsableId(value: RawObjectId | undefined): boolean {
  return toHexId(value) !== null;
}

/**
 * A stable React key. Falls back to the creation timestamp plus the row index,
 * which is enough to keep a list rendering when ids are unusable.
 */
export function rowKey(value: RawObjectId | undefined, index: number): string {
  const hex = toHexId(value);
  if (hex) return hex;
  if (value && typeof value === "object" && typeof value.timestamp === "number") {
    return `ts-${value.timestamp}-${index}`;
  }
  return `row-${index}`;
}

/** Short id for dense tables: first 6 and last 4 characters. */
export function shortId(value: RawObjectId | undefined): string {
  const hex = toHexId(value);
  if (!hex) return "unavailable";
  return `${hex.slice(0, 6)}…${hex.slice(-4)}`;
}

/**
 * The creation time embedded in an ObjectId. Available from both shapes, and the
 * one genuinely useful thing the degraded form still gives us.
 */
export function objectIdCreatedAt(value: RawObjectId | undefined): Date | null {
  if (typeof value === "string" && HEX_24.test(value)) {
    return new Date(parseInt(value.slice(0, 8), 16) * 1000);
  }
  if (value && typeof value === "object") {
    if (typeof value.timestamp === "number") return new Date(value.timestamp * 1000);
    if (typeof value.date === "number") return new Date(value.date);
    if (typeof value.date === "string") {
      const parsed = new Date(value.date);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
  }
  return null;
}

/**
 * Scans a page of records so the UI can warn once, at the top, instead of
 * showing a broken action on every row.
 */
export function summariseIds<T>(
  records: readonly T[] | undefined,
  pick: (record: T) => RawObjectId | undefined,
): { total: number; usable: number; allUsable: boolean; noneUsable: boolean } {
  const total = records?.length ?? 0;
  const usable = records?.filter((record) => hasUsableId(pick(record))).length ?? 0;
  return {
    total,
    usable,
    allUsable: total > 0 && usable === total,
    noneUsable: total > 0 && usable === 0,
  };
}
