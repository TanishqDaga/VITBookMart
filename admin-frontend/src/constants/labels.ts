import type { ListingCategory, ListingStatus, ListingType, UserStatus } from "@/types";

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  FREE: "Free",
  PAID: "Paid",
  TERMINATED: "Terminated",
};

export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  SALE: "Sale",
  RENT: "Rent",
};

export const LISTING_CATEGORY_LABELS: Record<ListingCategory, string> = {
  BOOK: "Book",
  NOTES: "Notes",
  EBOOK_PRINTOUT: "E-book / printout",
};

export const LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
  AVAILABLE: "Available",
  SOLD: "Sold",
};
