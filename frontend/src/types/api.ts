import type {
  ExamSlot,
  ListingCategory,
  ListingStatus,
  ListingType,
  UserStatus,
} from "./enums";

/** Mongo ObjectIds are serialised to hex strings by the backend (ToStringSerializer). */
export type ObjectIdString = string;

/** Backend: com.vitbookmart.entity.Hostel — three free-form strings, no enum. */
export interface Hostel {
  type: string | null;
  block: string | null;
  room: string | null;
}

/** Backend: dto/response/UserResponse */
export interface UserResponse {
  id: ObjectIdString;
  name: string | null;
  email: string | null;
  whatsappNumber: string | null;
  hostel: Hostel | null;
  status: UserStatus;
  createdAt: string | null;
  updatedAt: string | null;
}

/** Backend: dto/response/AuthResponse */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
}

/**
 * Backend: dto/response/ListingResponse — the LIST projection.
 *
 * This DTO deliberately has NO `category` and NO `description` field, so cards
 * cannot display either. `imageUrl` here is a Cloudinary thumbnail transform
 * (w_200,h_400,c_limit) applied by ImageService, not the original upload.
 */
export interface ListingResponse {
  id: ObjectIdString;
  title: string;
  subject: string;
  price: number | null;
  type: ListingType;
  imageUrl: string | null;
  status: ListingStatus;
  createdAt: string | null;
  updatedAt: string | null;
}

/** Backend: dto/response/SellerInfo — name + hostel only. No email, no phone. */
export interface SellerInfo {
  name: string | null;
  hostel: Hostel | null;
}

/**
 * Backend: dto/response/ListingDetailResponse.
 * `unavailableExamSlots` is only populated for RENT listings (ListingMapper).
 */
export interface ListingDetailResponse {
  id: ObjectIdString;
  title: string;
  description: string | null;
  subject: string;
  category: ListingCategory | null;
  type: ListingType;
  price: number | null;
  imageUrl: string | null;
  unavailableExamSlots: ExamSlot[] | null;
  status: ListingStatus;
  createdAt: string | null;
  updatedAt: string | null;
  seller: SellerInfo | null;
}

/** Backend: dto/response/PaginatedResponse — `page` is ZERO-BASED. */
export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

/** Backend: dto/response/WishlistResponse */
export interface WishlistResponse {
  listings: ListingResponse[];
}

/** Backend: dto/response/ContactSellerResponse */
export interface ContactSellerResponse {
  whatsappUrl: string;
}

/** Backend: dto/response/ErrorResponse (GlobalExceptionHandler). */
export interface ErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}

/** Backend: dto/request/CreateListingRequest — sent as the `listing` multipart part. */
export interface CreateListingRequest {
  title: string;
  description: string;
  subject: string;
  category: ListingCategory;
  type: ListingType;
  price: number;
  unavailableExamSlots: ExamSlot[];
}

/** Backend: dto/request/UpdateListingRequest — omitted fields are left unchanged. */
export interface UpdateListingRequest {
  title?: string;
  description?: string;
  subject?: string;
  category?: ListingCategory;
  type?: ListingType;
  price?: number;
  unavailableExamSlots?: ExamSlot[];
}

/** Backend: dto/request/UpdateUserProfileRequest. Email is NOT updatable. */
export interface UpdateUserProfileRequest {
  name?: string;
  whatsappNumber?: string;
  hostel?: Hostel;
}

/** Backend: GET /api/listings/search query parameters. */
export interface SearchListingsParams {
  query?: string;
  type?: ListingType;
  category?: ListingCategory;
  sort?: string;
  page?: number;
  size?: number;
}
