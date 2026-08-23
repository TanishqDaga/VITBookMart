import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { wishlistApi } from "@/api/wishlistApi";
import { errorMessage } from "@/api/errors";
import { useAuth } from "@/context/AuthContext";
import { queryKeys } from "@/lib/queryKeys";
import type { ObjectIdString, WishlistResponse } from "@/types";

/**
 * GET /api/wishlist/my once per session, then derive everything from it.
 *
 * The backend also exposes GET /api/wishlist/isWishlisted/{id}, but calling that
 * per card would be one request per listing on every grid. The full wishlist is a
 * single request and gives us both the wishlist page and the heart state.
 */
export function useWishlist() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.wishlist,
    queryFn: () => wishlistApi.getMine(),
    // Never fetch protected data for a signed-out visitor.
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

/** The set of listing ids currently wishlisted. Empty when signed out. */
export function useWishlistedIds(): Set<ObjectIdString> {
  const { data } = useWishlist();

  return useMemo(() => {
    const ids = new Set<ObjectIdString>();
    data?.listings?.forEach((listing) => ids.add(listing.id));
    return ids;
  }, [data]);
}

interface ToggleArgs {
  listingId: ObjectIdString;
  /** Current state, so the mutation knows which endpoint to call. */
  wishlisted: boolean;
}

/**
 * Adds or removes a listing, updating the cache optimistically and rolling back
 * if the request fails.
 */
export function useToggleWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listingId, wishlisted }: ToggleArgs) => {
      if (wishlisted) {
        await wishlistApi.remove(listingId);
      } else {
        await wishlistApi.add(listingId);
      }
      return !wishlisted;
    },

    async onMutate({ listingId, wishlisted }) {
      await queryClient.cancelQueries({ queryKey: queryKeys.wishlist });
      const previous = queryClient.getQueryData<WishlistResponse>(queryKeys.wishlist);

      if (previous) {
        queryClient.setQueryData<WishlistResponse>(queryKeys.wishlist, {
          listings: wishlisted
            ? previous.listings.filter((listing) => listing.id !== listingId)
            : previous.listings,
        });
      }

      return { previous };
    },

    onError(error, _variables, context) {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.wishlist, context.previous);
      }
      toast.error(errorMessage(error));
    },

    onSuccess(nowWishlisted) {
      toast.success(nowWishlisted ? "Added to wishlist" : "Removed from wishlist");
    },

    onSettled() {
      // Adding needs the server round-trip to learn the full listing payload,
      // so refetch rather than guessing it locally.
      void queryClient.invalidateQueries({ queryKey: queryKeys.wishlist });
    },
  });
}

export function useClearWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => wishlistApi.clear(),
    onSuccess(response) {
      queryClient.setQueryData(queryKeys.wishlist, response);
      toast.success("Wishlist cleared");
    },
    onError(error) {
      toast.error(errorMessage(error));
    },
  });
}
