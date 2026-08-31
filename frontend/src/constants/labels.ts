import type { ListingCategory, ListingStatus, ListingType, SortValue } from "@/types";

/**
 * Human-facing labels for backend enum values.
 * The KEYS are the exact API values; only the values here are for display.
 */

export const CATEGORY_LABELS: Record<ListingCategory, string> = {
  BOOK: "Books",
  NOTES: "Notes",
  CALCULATOR: "Calculators",
};

export const CATEGORY_LABELS_SHORT: Record<ListingCategory, string> = {
  BOOK: "Books",
  NOTES: "Notes",
  CALCULATOR: "Calculators",
};

export const CATEGORY_DESCRIPTIONS: Record<ListingCategory, string> = {
  BOOK: "Textbooks, reference books and lab manuals",
  NOTES: "Handwritten and printed class notes",
  CALCULATOR: "Scientific and academic calculators",
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
