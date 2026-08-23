/** Page size used for browse/search. Backend default is 20 when omitted. */
export const BROWSE_PAGE_SIZE = 12;

/** How many latest listings the home page shows. */
export const HOME_LATEST_COUNT = 8;

/** Backend limit: ListingService.MAX_IMAGE_SIZE = 5 * 1024 * 1024. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Backend allow-list: ListingService.validateImage. */
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const ACCEPTED_IMAGE_EXTENSIONS = ".jpg,.jpeg,.png,.webp";

/**
 * Backend regex: UpdateUserProfileRequest.whatsappNumber
 * ^[6-9][0-9]{9}$ — 10 digits, no country code.
 */
export const WHATSAPP_PATTERN = /^[6-9][0-9]{9}$/;

/** Mongo ObjectId hex string — used to reject malformed ids before hitting the API. */
export const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

export const SITE = {
  name: "VITBookMart",
  tagline: "Buy, sell and rent books and notes within VIT.",
  description:
    "A student marketplace for buying, selling and renting books and notes within VIT.",
  year: 2026,
} as const;
