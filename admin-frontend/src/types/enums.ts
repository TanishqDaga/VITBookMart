/** Copied verbatim from com.vitbookmart.entity.enums.* */

export const USER_STATUSES = ["FREE", "PAID", "TERMINATED"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const LISTING_TYPES = ["SALE", "RENT"] as const;
export type ListingType = (typeof LISTING_TYPES)[number];

export const LISTING_CATEGORIES = ["BOOK", "NOTES", "EBOOK_PRINTOUT"] as const;
export type ListingCategory = (typeof LISTING_CATEGORIES)[number];

export const LISTING_STATUSES = ["AVAILABLE", "SOLD"] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

export const ADMIN_ROLES = ["ADMIN"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const EXAM_SLOTS = [
  "A1","A2","B1","B2","C1","C2","D1","D2","E1","E2","F1","F2","G1","G2",
] as const;
export type ExamSlot = (typeof EXAM_SLOTS)[number];

export const EXAM_SLOT_ROWS: ReadonlyArray<readonly [ExamSlot, ExamSlot]> = [
  ["A1","A2"],["B1","B2"],["C1","C2"],["D1","D2"],["E1","E2"],["F1","F2"],["G1","G2"],
];
