import { get, put } from "./axios";
import type { ListingResponse, UpdateUserProfileRequest, UserResponse } from "@/types";

export const userApi = {
  /** GET /api/users/me -> UserResponse. Requires auth. */
  getMe() {
    return get<UserResponse>("/api/users/me");
  },

  /** PUT /api/users/me/update -> UserResponse. Requires auth. Email is not updatable. */
  updateMe(payload: UpdateUserProfileRequest) {
    return put<UserResponse>("/api/users/me/update", payload);
  },

  /**
   * GET /api/users/my/listings -> ListingResponse[]. Requires auth.
   * Returns every listing owned by the caller, including SOLD ones, unpaginated.
   */
  getMyListings() {
    return get<ListingResponse[]>("/api/users/my/listings");
  },
};
