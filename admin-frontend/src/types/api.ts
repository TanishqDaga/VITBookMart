/**
 * The admin API returns RAW MongoDB ENTITIES, not DTOs.
 *
 * AdminController's return types are `Admin`, `User` and `Listing` straight from
 * com.vitbookmart.entity. That has three consequences the rest of this app has to
 * live with, all documented in the README:
 *
 *  1. `id` is a bare org.bson.types.ObjectId with no @JsonSerialize annotation, so
 *     Jackson emits it as `{ timestamp, date }` rather than a 24-char hex string.
 *     See lib/objectId.ts.
 *  2. `Admin` includes the bcrypt password hash. It is stripped in api/adminApi.ts
 *     before the record ever reaches app state.
 *  3. `User` includes googleId, and `Listing` includes sellerId — internal fields
 *     the public DTOs deliberately withhold.
 */

import type { AdminRole, ExamSlot, ListingCategory, ListingStatus, ListingType, UserStatus } from "./enums";

/**
 * How an ObjectId can arrive. A hex string once the backend is fixed; the
 * `{ timestamp, date }` bean shape as things currently stand.
 */
export type RawObjectId =
  | string
  | { timestamp?: number; date?: string | number }
  | null;

/** com.vitbookmart.entity.Hostel */
export interface Hostel {
  type: string | null;
  block: string | null;
  room: string | null;
}

/** com.vitbookmart.entity.Admin — as sent over the wire, password included. */
export interface RawAdmin {
  id: RawObjectId;
  username: string | null;
  /** bcrypt hash. Never render, never store — stripped on arrival. */
  password?: string | null;
  role: AdminRole | null;
  active: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

/** What the app actually holds: the same record with the hash removed. */
export interface AdminRecord {
  id: RawObjectId;
  username: string | null;
  role: AdminRole | null;
  active: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

/** com.vitbookmart.entity.User */
export interface UserRecord {
  id: RawObjectId;
  name: string | null;
  email: string | null;
  googleId: string | null;
  whatsappNumber: string | null;
  hostel: Hostel | null;
  status: UserStatus | null;
  createdAt: string | null;
  updatedAt: string | null;
}

/** com.vitbookmart.entity.Listing */
export interface ListingRecord {
  id: RawObjectId;
  sellerId: RawObjectId;
  title: string | null;
  description: string | null;
  subject: string | null;
  type: ListingType | null;
  unavailableExamSlots: ExamSlot[] | null;
  category: ListingCategory | null;
  price: number | null;
  imageUrl: string | null;
  status: ListingStatus | null;
  createdAt: string | null;
  updatedAt: string | null;
}

/** dto/response/AdminAuthResponse — tokens only, no admin details. */
export interface AdminAuthResponse {
  accessToken: string;
  refreshToken: string;
}

/** dto/request/AdminLoginRequest */
export interface AdminLoginRequest {
  username: string;
  password: string;
}

/** dto/request/CreateAdminRequest */
export interface CreateAdminRequest {
  username: string;
  password: string;
}

/** dto/response/ErrorResponse (GlobalExceptionHandler). */
export interface ErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}

/**
 * Identity derived from the ADMIN_ACCESS JWT payload.
 * The login response carries no admin object, so this is read from the token's
 * claims. Decoding is for display only — the backend verifies the signature.
 */
export interface AdminIdentity {
  adminId: string;
  username: string;
}
