import type { SearchListingsParams } from "@/types";

/**
 * Every cache key in one place, so invalidation stays surgical.
 *
 * Hierarchy:
 *   ["listings"]                       everything listing-related
 *   ["listings","latest",{page,size}]  home + public feed
 *   ["listings","search",{...params}]  browse
 *   ["listings","detail",id]           listing detail page
 *   ["me"]                             current user profile
 *   ["me","listings"]                  my listings
 *   ["wishlist"]                       the signed-in user's wishlist
 */
export const queryKeys = {
  listings: {
    all: ["listings"] as const,
    latest: (page: number, size: number) => ["listings", "latest", { page, size }] as const,
    latestAll: ["listings", "latest"] as const,
    search: (params: SearchListingsParams) => ["listings", "search", params] as const,
    searchAll: ["listings", "search"] as const,
    detail: (id: string) => ["listings", "detail", id] as const,
  },
  me: {
    profile: ["me"] as const,
    listings: ["me", "listings"] as const,
  },
  wishlist: ["wishlist"] as const,
} as const;
