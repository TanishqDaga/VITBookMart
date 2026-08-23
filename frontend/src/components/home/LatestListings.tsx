import { Link } from "react-router-dom";
import { ArrowRight, PackageOpen } from "lucide-react";
import { HOME_LATEST_COUNT } from "@/constants/app";
import { useLatestListings } from "@/hooks/useListings";
import { ListingGrid, ListingGridSkeleton } from "@/components/listings/ListingGrid";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { ButtonLink } from "@/components/common/Button";

export function LatestListings() {
  // Ask the backend for exactly what we render — one page, eight items.
  const { data, isPending, isError, error, refetch } = useLatestListings(0, HOME_LATEST_COUNT);

  return (
    <section aria-labelledby="latest" className="page-shell py-12 sm:py-14">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 id="latest" className="text-display-sm font-extrabold">
            Latest listings
          </h2>
          <p className="mt-1.5 text-sm text-ink-muted">Freshly posted by students on campus.</p>
        </div>

        <Link
          to="/browse"
          className="hidden shrink-0 items-center gap-1.5 rounded-lg text-sm font-bold text-brand-600 transition-colors hover:text-brand-700 sm:inline-flex"
        >
          View all listings
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <div className="mt-6">
        {isPending && <ListingGridSkeleton count={HOME_LATEST_COUNT} label="Loading latest listings" />}

        {isError && <ErrorState error={error} onRetry={() => void refetch()} />}

        {data && data.content.length === 0 && (
          <EmptyState
            icon={<PackageOpen className="h-6 w-6" aria-hidden />}
            title="No listings yet"
            description="Nothing has been posted so far. Be the first to list a book or set of notes."
            action={<ButtonLink to="/sell">Sell something</ButtonLink>}
          />
        )}

        {data && data.content.length > 0 && (
          <ListingGrid listings={data.content} priorityCount={4} />
        )}
      </div>

      <div className="mt-8 sm:hidden">
        <ButtonLink to="/browse" variant="outline" fullWidth>
          View all listings
          <ArrowRight className="h-4 w-4" aria-hidden />
        </ButtonLink>
      </div>
    </section>
  );
}
