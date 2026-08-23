import { del, get, post } from "./axios";
import type { ObjectIdString, WishlistResponse } from "@/types";

export const wishlistApi = {
  /** GET /api/wishlist/my -> { listings: ListingResponse[] }. Requires auth. */
  getMine() {
    return get<WishlistResponse>("/api/wishlist/my");
  },

  /** POST /api/wishlist/add/{listingId} -> 204 No Content. Requires auth. */
  async add(listingId: ObjectIdString): Promise<void> {
    await post<void>(`/api/wishlist/add/${listingId}`);
  },

  /** DELETE /api/wishlist/remove/{listingId} -> 204 No Content. Requires auth. */
  async remove(listingId: ObjectIdString): Promise<void> {
    await del<void>(`/api/wishlist/remove/${listingId}`);
  },

  /** DELETE /api/wishlist/clear -> WishlistResponse (empty). Requires auth. */
  clear() {
    return del<WishlistResponse>("/api/wishlist/clear");
  },

  /**
   * GET /api/wishlist/isWishlisted/{listingId} -> boolean. Requires auth.
   *
   * Intentionally unused by the UI: calling it per card would be one request per
   * listing. We load the full wishlist once and derive a Set of ids instead
   * (see hooks/useWishlist.ts). Kept here for contract completeness.
   */
  isWishlisted(listingId: ObjectIdString) {
    return get<boolean>(`/api/wishlist/isWishlisted/${listingId}`);
  },
};
