import type { ListingCategory, ListingStatus, ListingType, SortValue } from "@/types";

/**
 * Human-facing labels for backend enum values.
 * The KEYS are the exact API values; only the values here are for display.
 */

export const CATEGORY_LABELS: Record<ListingCategory, string> = {
  BOOK: "Books",
  NOTES: "Notes",
  EBOOK_PRINTOUT: "E-books & printouts",
};

export const CATEGORY_LABELS_SHORT: Record<ListingCategory, string> = {
  BOOK: "Books",
  NOTES: "Notes",
  EBOOK_PRINTOUT: "E-books",
};

export const CATEGORY_DESCRIPTIONS: Record<ListingCategory, string> = {
  BOOK: "Textbooks, reference books and lab manuals",
  NOTES: "Handwritten and printed class notes",
  EBOOK_PRINTOUT: "Soft copies and printed material",
};

export const TYPE_LABELS: Record<ListingType, string> = {
  SALE: "For sale",
  RENT: "For rent",
};

export const TYPE_FILTER_LABELS: Record<ListingType, string> = {
  SALE: "For sale",
  RENT: "For rent",
};

export const STATUS_LABELS: Record<ListingStatus, string> = {
  AVAILABLE: "Available",
  SOLD: "Sold",
};

export const SORT_LABELS: Record<SortValue, string> = {
  latest: "Newest first",
  priceAsc: "Price: low to high",
  priceDesc: "Price: high to low",
};
