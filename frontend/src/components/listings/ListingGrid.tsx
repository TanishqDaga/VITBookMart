import { cn } from "@/lib/cn";
import { LoadingRegion } from "@/components/common/Skeleton";
import { ListingCard, ListingCardSkeleton } from "./ListingCard";
import type { ListingResponse } from "@/types";

interface ListingGridProps {
  listings: ListingResponse[];
  showWishlist?: boolean;
  renderActions?: (listing: ListingResponse) => React.ReactNode;
  className?: string;
  /** Eagerly load the first row's images; the rest stay lazy. */
  priorityCount?: number;
}

const GRID = "grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4";

export function ListingGrid({
  listings,
  showWishlist = true,
  renderActions,
  className,
  priorityCount = 4,
}: ListingGridProps) {
  return (
    <ul className={cn(GRID, className)}>
      {listings.map((listing, index) => (
        <li key={listing.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(index, 7) * 30}ms` }}>
          <ListingCard
            listing={listing}
            showWishlist={showWishlist}
            actions={renderActions?.(listing)}
            priority={index < priorityCount}
          />
        </li>
      ))}
    </ul>
  );
}

export function ListingGridSkeleton({
  count = 8,
  className,
  label = "Loading listings",
}: {
  count?: number;
  className?: string;
  label?: string;
}) {
  return (
    <LoadingRegion label={label}>
      <div className={cn(GRID, className)}>
        {Array.from({ length: count }, (_, index) => (
          <ListingCardSkeleton key={index} />
        ))}
      </div>
    </LoadingRegion>
  );
}
