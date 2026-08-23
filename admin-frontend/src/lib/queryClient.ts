import { QueryClient } from "@tanstack/react-query";
import { toApiError } from "@/api/errors";

/**
 * Admin data is operational: staleness is worse here than an extra request, so
 * windows are short and a refocus refetches.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: true,
      retry(failureCount, error) {
        const { kind } = toApiError(error);
        if (["unauthorized", "forbidden", "notFound", "validation", "conflict"].includes(kind)) {
          return false;
        }
        return failureCount < 2;
      },
    },
    mutations: { retry: false },
  },
});
