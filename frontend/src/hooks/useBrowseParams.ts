import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  isListingCategory,
  isListingType,
  isSortValue,
  type ListingCategory,
  type ListingType,
  type SortValue,
} from "@/types";

export interface BrowseFilters {
  query: string;
  type: ListingType | null;
  category: ListingCategory | null;
  sort: SortValue;
  /** Zero-based, matching Spring's Pageable. */
  page: number;
}

const DEFAULTS: BrowseFilters = {
  query: "",
  type: null,
  category: null,
  sort: "latest",
  page: 0,
};

/**
 * Browse state lives in the URL, using the backend's own parameter names
 * (query / type / category / sort / page), so a filtered view can be shared,
 * bookmarked, and navigated with the back button.
 */
export function useBrowseParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo<BrowseFilters>(() => {
    const rawType = searchParams.get("type");
    const rawCategory = searchParams.get("category");
    const rawSort = searchParams.get("sort");
    const rawPage = Number(searchParams.get("page"));

    return {
      query: searchParams.get("query") ?? "",
      // Unknown values are dropped rather than forwarded — the backend would
      // reject an invalid enum with a 400.
      type: isListingType(rawType) ? rawType : null,
      category: isListingCategory(rawCategory) ? rawCategory : null,
      sort: isSortValue(rawSort) ? rawSort : "latest",
      page: Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 0,
    };
  }, [searchParams]);

  const write = useCallback(
    (next: BrowseFilters, options?: { replace?: boolean }) => {
      const params = new URLSearchParams();
      if (next.query.trim()) params.set("query", next.query.trim());
      if (next.type) params.set("type", next.type);
      if (next.category) params.set("category", next.category);
      if (next.sort !== DEFAULTS.sort) params.set("sort", next.sort);
      if (next.page > 0) params.set("page", String(next.page));

      setSearchParams(params, { replace: options?.replace ?? false });
    },
    [setSearchParams],
  );

  /** Changing any filter resets to the first page; changing the page does not. */
  const setFilters = useCallback(
    (patch: Partial<BrowseFilters>, options?: { replace?: boolean }) => {
      const resetsPage = "page" in patch === false;
      write({ ...filters, ...patch, ...(resetsPage ? { page: 0 } : {}) }, options);
    },
    [filters, write],
  );

  const clearFilters = useCallback(() => {
    write(DEFAULTS);
  }, [write]);

  const activeFilterCount =
    (filters.type ? 1 : 0) + (filters.category ? 1 : 0) + (filters.sort !== "latest" ? 1 : 0);

  const hasAnyFilter = activeFilterCount > 0 || filters.query.trim() !== "";

  return { filters, setFilters, clearFilters, activeFilterCount, hasAnyFilter };
}
