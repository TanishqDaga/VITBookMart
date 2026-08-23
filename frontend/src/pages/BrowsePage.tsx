import { useEffect, useState } from "react";
import { SearchX, SlidersHorizontal } from "lucide-react";
import { BROWSE_PAGE_SIZE } from "@/constants/app";
import { useBrowseParams } from "@/hooks/useBrowseParams";
import { useDebounce } from "@/hooks/useDebounce";
import { useSearchListings } from "@/hooks/useListings";
import { Button } from "@/components/common/Button";
import { Drawer } from "@/components/common/Drawer";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { PageHeader } from "@/components/common/PageHeader";
import { Pagination, ResultRange } from "@/components/common/Pagination";
import { SearchBar } from "@/components/common/SearchBar";
import { ActiveFilterChips, FilterPanel } from "@/components/listings/FilterPanel";
import { ListingGrid, ListingGridSkeleton } from "@/components/listings/ListingGrid";

export default function BrowsePage() {
  const { filters, setFilters, clearFilters, activeFilterCount, hasAnyFilter } =
    useBrowseParams();

  // Typing updates a local value; the URL and the request follow once it settles.
  const [draftQuery, setDraftQuery] = useState(filters.query);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const debouncedQuery = useDebounce(draftQuery, 400);

  // Keep the input in step when the URL changes from elsewhere (chips, back button).
  useEffect(() => {
    setDraftQuery(filters.query);
  }, [filters.query]);

  useEffect(() => {
    if (debouncedQuery.trim() === filters.query.trim()) return;
    // replace: true keeps every keystroke out of the browser history.
    setFilters({ query: debouncedQuery }, { replace: true });
  }, [debouncedQuery, filters.query, setFilters]);

  const { data, isPending, isFetching, isError, error, refetch } = useSearchListings({
    query: filters.query.trim() || undefined,
    type: filters.type ?? undefined,
    category: filters.category ?? undefined,
    sort: filters.sort,
    page: filters.page,
    size: BROWSE_PAGE_SIZE,
  });

  const listings = data?.content ?? [];

  return (
    <div className="page-shell py-8 sm:py-10">
      <PageHeader
        title="Browse listings"
        description="Search books, notes and study material posted by VIT students."
      />

      <div className="mt-6 flex gap-3">
        <SearchBar
          value={draftQuery}
          onChange={setDraftQuery}
          onSubmit={(value) => setFilters({ query: value })}
          className="flex-1"
        />

        <Button
          variant="outline"
          size="lg"
          className="shrink-0 lg:hidden"
          onClick={() => setDrawerOpen(true)}
          aria-expanded={drawerOpen}
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      <div className="mt-4">
        <ActiveFilterChips filters={filters} onChange={setFilters} onClear={clearFilters} />
      </div>

      <div className="mt-6 flex gap-8">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24 rounded-2xl border border-line bg-white p-5 shadow-card">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-base font-bold">Filters</h2>
              {hasAnyFilter && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-md text-[13px] font-semibold text-brand-600 transition-colors hover:text-brand-700"
                >
                  Clear
                </button>
              )}
            </div>
            <FilterPanel filters={filters} onChange={setFilters} />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {data && listings.length > 0 && (
            <div className="mb-4 flex items-center justify-between gap-3">
              <ResultRange
                page={data.page}
                size={data.size}
                totalElements={data.totalElements}
                count={listings.length}
              />
              {/* Paging keeps the old page visible; this shows work is happening. */}
              {isFetching && !isPending && (
                <span className="text-xs font-medium text-ink-soft" role="status">
                  Updating…
                </span>
              )}
            </div>
          )}

          {isPending && <ListingGridSkeleton count={BROWSE_PAGE_SIZE} label="Loading listings" />}

          {isError && <ErrorState error={error} onRetry={() => void refetch()} />}

          {data && listings.length === 0 && (
            <EmptyState
              icon={<SearchX className="h-6 w-6" aria-hidden />}
              title="No listings found"
              description={
                hasAnyFilter
                  ? "Try a different search term or clear your filters."
                  : "Nothing has been listed yet. Check back soon."
              }
              action={
                hasAnyFilter && (
                  <Button variant="outline" onClick={clearFilters}>
                    Clear filters
                  </Button>
                )
              }
            />
          )}

          {data && listings.length > 0 && (
            <>
              <ListingGrid listings={listings} priorityCount={4} />

              <div className="mt-10">
                <Pagination
                  page={data.page}
                  totalPages={data.totalPages}
                  first={data.first}
                  last={data.last}
                  onPageChange={(page) => {
                    setFilters({ page });
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Filters"
        footer={
          <>
            <Button
              variant="outline"
              fullWidth
              onClick={() => {
                clearFilters();
                setDrawerOpen(false);
              }}
            >
              Clear all
            </Button>
            <Button fullWidth onClick={() => setDrawerOpen(false)}>
              Show results
            </Button>
          </>
        }
      >
        <FilterPanel filters={filters} onChange={setFilters} />
      </Drawer>
    </div>
  );
}
