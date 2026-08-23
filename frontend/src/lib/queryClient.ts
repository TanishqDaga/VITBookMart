import { QueryClient } from "@tanstack/react-query";
import { toApiError } from "@/api/errors";

/**
 * Cache policy, tuned to how the backend actually behaves.
 *
 * The backend already caches listings in Redis (2h for latest/search, 12h for a
 * single listing) and busts those caches on every write, so the client can hold
 * data for a couple of minutes without going stale in a way users would notice.
 * Authenticated data (profile, wishlist, my listings) is kept short and is
 * dropped entirely on sign-out so nothing leaks between accounts.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60_000,
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: false,
      retry(failureCount, error) {
        const { kind } = toApiError(error);
        // Retrying these can never succeed, and retrying a 401 fights the
        // refresh interceptor.
        if (
          kind === "notFound" ||
          kind === "unauthorized" ||
          kind === "forbidden" ||
          kind === "terminated" ||
          kind === "validation" ||
          kind === "profileIncomplete" ||
          kind === "notOwner"
        ) {
          return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
