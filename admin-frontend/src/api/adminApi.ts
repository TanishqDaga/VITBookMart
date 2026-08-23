import { del, get, patch, post, put } from "./axios";
import type {
  AdminRecord,
  CreateAdminRequest,
  ListingRecord,
  RawAdmin,
  UserRecord,
} from "@/types";

/**
 * Every route below sits under /api/admin/** and requires ROLE_ADMIN, which the
 * JwtAuthenticationConverter only grants for a token with type=ADMIN_ACCESS.
 *
 * All of these return raw MongoDB entities rather than DTOs. See types/api.ts.
 */

/**
 * GET /api/admin/admins returns the full Admin entity, bcrypt password hash
 * included. Strip it here so the hash never reaches React state, the query cache,
 * a devtools panel, or an error report.
 */
function stripPassword(admin: RawAdmin): AdminRecord {
  const { password: _password, ...safe } = admin;
  return safe;
}

export const adminApi = {
  // --- admin management --------------------------------------------------

  /** GET /api/admin/admins -> Admin[] (whole collection, unpaginated). */
  async getAdmins(): Promise<AdminRecord[]> {
    const admins = await get<RawAdmin[]>("/api/admin/admins");
    return admins.map(stripPassword);
  },

  /**
   * POST /api/admin/create -> 201 Admin.
   * Requires ROLE_ADMIN, so the very first admin has to be seeded directly in
   * MongoDB — this endpoint cannot bootstrap an empty system.
   */
  async createAdmin(request: CreateAdminRequest): Promise<AdminRecord> {
    return stripPassword(await post<RawAdmin>("/api/admin/create", request));
  },

  /**
   * PUT /api/admin/update/{adminId}?username=… -> Admin.
   * The new username is a QUERY PARAMETER, not a request body.
   */
  async updateAdminUsername(adminId: string, username: string): Promise<AdminRecord> {
    return stripPassword(
      await put<RawAdmin>(`/api/admin/update/${adminId}`, null, { params: { username } }),
    );
  },

  /** DELETE /api/admin/admins/{adminId} -> 204. */
  async deleteAdmin(adminId: string): Promise<void> {
    await del<void>(`/api/admin/admins/${adminId}`);
  },

  /**
   * GET /api/admin/{adminId} -> Admin. Not used by the UI: the list endpoint
   * already returns every field this would. Kept for contract completeness.
   */
  async getAdminById(adminId: string): Promise<AdminRecord> {
    return stripPassword(await get<RawAdmin>(`/api/admin/${adminId}`));
  },

  /** GET /api/admin/username?username=… -> Admin. Also unused; see above. */
  async getAdminByUsername(username: string): Promise<AdminRecord> {
    return stripPassword(await get<RawAdmin>("/api/admin/username", { params: { username } }));
  },

  // --- user management ---------------------------------------------------

  /** GET /api/admin/users -> User[] (whole collection, unpaginated). */
  getUsers() {
    return get<UserRecord[]>("/api/admin/users");
  },

  /** GET /api/admin/users/{userId} -> User. */
  getUser(userId: string) {
    return get<UserRecord>(`/api/admin/users/${userId}`);
  },

  /** PATCH /api/admin/users/terminate/{userId} -> User with status TERMINATED. */
  terminateUser(userId: string) {
    return patch<UserRecord>(`/api/admin/users/terminate/${userId}`);
  },

  /** PATCH /api/admin/users/paid/{userId} -> User with status PAID. */
  makeUserPaid(userId: string) {
    return patch<UserRecord>(`/api/admin/users/paid/${userId}`);
  },

  /** PATCH /api/admin/users/free/{userId} -> User with status FREE. */
  makeUserFree(userId: string) {
    return patch<UserRecord>(`/api/admin/users/free/${userId}`);
  },

  /**
   * DELETE /api/admin/users/{userId} -> 204.
   * Cascades server-side: deletes the user's listings, pulls those listings from
   * every wishlist, deletes the user's own wishlist, then deletes the user.
   */
  async deleteUser(userId: string): Promise<void> {
    await del<void>(`/api/admin/users/${userId}`);
  },

  // --- listing management ------------------------------------------------

  /** GET /api/admin/listings -> Listing[] (every listing, any status). */
  getListings() {
    return get<ListingRecord[]>("/api/admin/listings");
  },

  /** GET /api/admin/listings/available -> Listing[] with status AVAILABLE. */
  getAvailableListings() {
    return get<ListingRecord[]>("/api/admin/listings/available");
  },

  /** GET /api/admin/listings/sold -> Listing[] with status SOLD. */
  getSoldListings() {
    return get<ListingRecord[]>("/api/admin/listings/sold");
  },

  /** GET /api/admin/listings/{listingId} -> Listing. */
  getListing(listingId: string) {
    return get<ListingRecord>(`/api/admin/listings/${listingId}`);
  },

  /**
   * PUT /api/admin/listings/{listingId} -> Listing.
   *
   * AdminService.updateListing copies eight fields off the body unconditionally:
   * title, description, subject, category, type, price, unavailableExamSlots and
   * status. Anything omitted is written as null, so the form always sends all
   * eight. sellerId, imageUrl and createdAt are left untouched server-side.
   */
  updateListing(listingId: string, listing: Partial<ListingRecord>) {
    return put<ListingRecord>(`/api/admin/listings/${listingId}`, listing);
  },

  /**
   * DELETE /api/admin/listings/{listingId} -> 204.
   * Also pulls the listing out of every wishlist.
   */
  async deleteListing(listingId: string): Promise<void> {
    await del<void>(`/api/admin/listings/${listingId}`);
  },
};
