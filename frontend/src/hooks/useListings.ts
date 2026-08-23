import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listingApi } from "@/api/listingApi";
import { userApi } from "@/api/userApi";
import { errorMessage } from "@/api/errors";
import { OBJECT_ID_PATTERN } from "@/constants/app";
import { useAuth } from "@/context/AuthContext";
import { queryKeys } from "@/lib/queryKeys";
import type {
  CreateListingRequest,
  ObjectIdString,
  SearchListingsParams,
  UpdateListingRequest,
} from "@/types";

/** GET /api/listings/latest — public, AVAILABLE only, newest first. */
export function useLatestListings(page = 0, size = 20) {
  return useQuery({
    queryKey: queryKeys.listings.latest(page, size),
    queryFn: () => listingApi.getLatest(page, size),
    staleTime: 2 * 60_000,
  });
}

/** GET /api/listings/search — public. Params double as the cache key. */
export function useSearchListings(params: SearchListingsParams) {
  return useQuery({
    queryKey: queryKeys.listings.search(params),
    // TanStack passes an AbortSignal, so a superseded search is cancelled
    // instead of racing the newer one.
    queryFn: ({ signal }) => listingApi.search(params, signal),
    staleTime: 60_000,
    placeholderData: (previous) => previous,
  });
}

/** GET /api/listings/{id} — public. */
export function useListingDetail(listingId: string | undefined) {
  const isValidId = Boolean(listingId && OBJECT_ID_PATTERN.test(listingId));

  return useQuery({
    queryKey: queryKeys.listings.detail(listingId ?? ""),
    queryFn: () => listingApi.getById(listingId as string),
    // A malformed id would fail ObjectId conversion server-side and surface as a
    // 500 rather than a clean 404, so we never send one.
    enabled: isValidId,
    staleTime: 2 * 60_000,
  });
}

/** GET /api/users/my/listings — every listing the caller owns, including SOLD. */
export function useMyListings() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.me.listings,
    queryFn: () => userApi.getMyListings(),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

/**
 * Invalidates the public feeds. Called after any write that changes what the
 * marketplace shows. Deliberately does not touch the wishlist or profile caches.
 */
function invalidatePublicFeeds(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.listings.latestAll });
  void queryClient.invalidateQueries({ queryKey: queryKeys.listings.searchAll });
}

export function useCreateListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ request, image }: { request: CreateListingRequest; image: File }) =>
      listingApi.create(request, image),

    onSuccess() {
      invalidatePublicFeeds(queryClient);
      void queryClient.invalidateQueries({ queryKey: queryKeys.me.listings });
      toast.success("Listing created");
    },
  });
}

export function useUpdateListing(listingId: ObjectIdString) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: UpdateListingRequest) => listingApi.update(listingId, request),

    onSuccess() {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.listings.detail(listingId),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.me.listings });
      invalidatePublicFeeds(queryClient);
      toast.success("Listing updated");
    },
  });
}

export function useMarkAsSold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (listingId: ObjectIdString) => listingApi.markAsSold(listingId),

    onSuccess(_data, listingId) {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.listings.detail(listingId),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.me.listings });
      // Sold listings drop out of /latest and /search, so those must refetch.
      invalidatePublicFeeds(queryClient);
      // The listing may also sit in someone's wishlist view.
      void queryClient.invalidateQueries({ queryKey: queryKeys.wishlist });
      toast.success("Listing marked as sold");
    },

    onError(error) {
      toast.error(errorMessage(error));
    },
  });
}

/**
 * GET /api/listings/contact/{id} — requires auth.
 * Called on demand from the confirmation dialog, not on page load.
 */
export function useContactSeller() {
  return useMutation({
    mutationFn: (listingId: ObjectIdString) => listingApi.getContactUrl(listingId),
  });
}
