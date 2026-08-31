import { get, patch, post, put } from "./axios";
import type {
  ContactSellerResponse,
  CreateListingRequest,
  ListingDetailResponse,
  ListingResponse,
  ObjectIdString,
  PaginatedResponse,
  SearchListingsParams,
  UpdateListingRequest,
} from "@/types";

export const listingApi = {
  /**
   * GET /api/listings/latest?page=&size= -> PaginatedResponse<ListingResponse>. Public.
   * Sorting is fixed server-side (findByStatusOrderByCreatedAtDesc), AVAILABLE only.
   * `page` is zero-based.
   */
  getLatest(page = 0, size = 20) {
    return get<PaginatedResponse<ListingResponse>>("/api/listings/latest", {
      params: { page, size },
    });
  },

  /**
   * GET /api/listings/search -> PaginatedResponse<ListingResponse>. Public.
   * Params: query, type, category, sort, page, size — all optional.
   * `query` matches title OR subject, case-insensitive. AVAILABLE only.
   */
  search(params: SearchListingsParams, signal?: AbortSignal) {
    // Omitting empty params keeps the backend's Redis cache key stable, so the
    // same search from different users hits the same cached entry.
    const query: Record<string, string | number> = {};
    if (params.query) query.query = params.query;
    if (params.type) query.type = params.type;
    if (params.category) query.category = params.category;
    if (params.sort) query.sort = params.sort;
    query.page = params.page ?? 0;
    query.size = params.size ?? 20;

    return get<PaginatedResponse<ListingResponse>>("/api/listings/search", {
      params: query,
      signal,
    });
  },

  /** GET /api/listings/{listingId} -> ListingDetailResponse. Public. */
  getById(listingId: ObjectIdString) {
    return get<ListingDetailResponse>(`/api/listings/${listingId}`);
  },

  /**
   * POST /api/listings/create — multipart/form-data. Requires auth. Returns 201.
   *
   * The controller declares two @RequestPart names: "listing" and "image".
   * "listing" is bound to CreateListingRequest, so that part must carry
   * Content-Type: application/json — appending a plain string would arrive as
   * text/plain and Spring would reject it. Wrapping the JSON in a Blob sets it.
   *
   * The Content-Type header is deliberately not set by hand: the browser has to
   * generate the multipart boundary itself.
   */
  create(request: CreateListingRequest, image: File) {
    const formData = new FormData();
    formData.append(
      "listing",
      new Blob([JSON.stringify(request)], { type: "application/json" }),
    );
    formData.append("image", image);

    return post<ListingResponse>("/api/listings/create", formData);
  },

  /**
   * PUT /api/listings/update/{listingId} -> ListingResponse. Requires auth + ownership.
   * JSON body. Image cannot be changed — the backend exposes no image update path.
   */
  update(listingId: ObjectIdString, request: UpdateListingRequest) {
    return put<ListingResponse>(`/api/listings/update/${listingId}`, request);
  },

  /** PATCH /api/listings/markSold/{listingId} -> ListingResponse. Requires auth + ownership. */
  markAsSold(listingId: ObjectIdString) {
    return patch<ListingResponse>(`/api/listings/markSold/${listingId}`);
  },
//Mark Available
  markAsAvailable(listingId: ObjectIdString) {
  return patch<ListingResponse>(`/api/listings/markAvailable/${listingId}`);
},

  /**
   * GET /api/listings/contact/{listingId} -> { whatsappUrl }.
   *
   * Requires auth. The security config permits GET on "/api/listings/*" (one path
   * segment), which does not cover "/api/listings/contact/{id}", so this falls
   * through to `.anyRequest().authenticated()`.
   */
  getContactUrl(listingId: ObjectIdString) {
    return get<ContactSellerResponse>(`/api/listings/contact/${listingId}`);
  },

  /**
   * GET /api/listings -> ListingResponse[] (every AVAILABLE listing, unpaginated).
   * Public. Not used by the UI — /latest and /search cover the same ground with
   * pagination and Redis caching. Kept for contract completeness.
   */
  getAllAvailable() {
    return get<ListingResponse[]>("/api/listings");
  },
};
