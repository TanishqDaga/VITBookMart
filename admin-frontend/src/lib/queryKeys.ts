/**
 * Every cache key in one place. The admin API has no pagination or filtering, so
 * each collection is a single key holding the whole list; filtering happens client
 * side over data we already have.
 */
export const queryKeys = {
  users: ["admin", "users"] as const,
  listings: (scope: "all" | "available" | "sold") => ["admin", "listings", scope] as const,
  listingsAll: ["admin", "listings"] as const,
  admins: ["admin", "admins"] as const,
} as const;
