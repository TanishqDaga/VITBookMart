/**
 * Enum values below are copied verbatim from the backend.
 * Source: com.vitbookmart.entity.enums.*
 * Never send a different string to the API — UI labels live in constants/labels.ts.
 */

export const LISTING_TYPES = ["SALE", "RENT"] as const;
export type ListingType = (typeof LISTING_TYPES)[number];

export const LISTING_CATEGORIES = ["BOOK", "NOTES", "EBOOK_PRINTOUT"] as const;
export type ListingCategory = (typeof LISTING_CATEGORIES)[number];

export const LISTING_STATUSES = ["AVAILABLE", "SOLD"] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

export const USER_STATUSES = ["FREE", "PAID", "TERMINATED"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const EXAM_SLOTS = [
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "C2",
  "D1",
  "D2",
  "E1",
  "E2",
  "F1",
  "F2",
  "G1",
  "G2",
] as const;
export type ExamSlot = (typeof EXAM_SLOTS)[number];

/** Exam slots laid out as the backend declares them: paired rows A1/A2 … G1/G2. */
export const EXAM_SLOT_ROWS: ReadonlyArray<readonly [ExamSlot, ExamSlot]> = [
  ["A1", "A2"],
  ["B1", "B2"],
  ["C1", "C2"],
  ["D1", "D2"],
  ["E1", "E2"],
  ["F1", "F2"],
  ["G1", "G2"],
];

/**
 * Sort values accepted by GET /api/listings/search.
 * Source: ListingRepositoryCustomImpl.search — anything other than
 * "priceAsc" / "priceDesc" falls back to newest-first.
 */
export const SORT_VALUES = ["latest", "priceAsc", "priceDesc"] as const;
export type SortValue = (typeof SORT_VALUES)[number];

export function isListingType(value: unknown): value is ListingType {
  return typeof value === "string" && (LISTING_TYPES as readonly string[]).includes(value);
}

export function isListingCategory(value: unknown): value is ListingCategory {
  return (
    typeof value === "string" && (LISTING_CATEGORIES as readonly string[]).includes(value)
  );
}

export function isSortValue(value: unknown): value is SortValue {
  return typeof value === "string" && (SORT_VALUES as readonly string[]).includes(value);
}

export function isExamSlot(value: unknown): value is ExamSlot {
  return typeof value === "string" && (EXAM_SLOTS as readonly string[]).includes(value);
}
