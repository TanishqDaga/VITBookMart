import { Link } from "react-router-dom";
import { CheckCircle2, Tag } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatPrice, formatRelativeDate, toIsoString } from "@/lib/format";
import { TYPE_LABELS } from "@/constants/labels";
import { Badge } from "@/components/common/Badge";
import { Skeleton } from "@/components/common/Skeleton";
import { WishlistButton } from "@/components/wishlist/WishlistButton";
import { ListingImage } from "./ListingImage";
import type { ListingResponse } from "@/types";

interface ListingCardProps {
  listing: ListingResponse;
  /** Hidden on the wishlist page, where every card is already saved. */
  showWishlist?: boolean;
  /** Slot for owner actions on the My listings page. */
  actions?: React.ReactNode;
  priority?: boolean;
}

/**
 * Renders only what ListingResponse actually carries: title, subject, price,
 * type, image, status and timestamps. That DTO has no category and no
 * description, so neither appears here.
 */
export function ListingCard({
  listing,
  showWishlist = true,
  actions,
  priority,
}: ListingCardProps) {
  const isSold = listing.status === "SOLD";
  const isRent = listing.type === "RENT";

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-white",
        "shadow-card transition-[box-shadow,transform,border-color] duration-200",
        "hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover",
        "focus-within:border-brand-300 focus-within:shadow-card-hover",
      )}
    >
      <div className="relative">
        <ListingImage
          src={listing.imageUrl}
          alt={listing.title}
          priority={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
          className={cn("aspect-[4/5] w-full", isSold && "opacity-60 saturate-[0.35]")}
        />

        {/* Type sits on the image; status only appears when it isn't the default. */}
        <div className="pointer-events-none absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
          <Badge tone={isRent ? "accent" : "brand"}className={isRent ? "bg-yellow-400 text-yellow-950 ring-1 ring-yellow-500/30" : undefined}icon={<Tag className="h-3 w-3" aria-hidden />}>
            {TYPE_LABELS[listing.type]}
          </Badge>
          {isSold && (
            <Badge tone="muted" icon={<CheckCircle2 className="h-3 w-3" aria-hidden />}>
              Sold
            </Badge>
          )}
        </div>

        {showWishlist && (
          <div className="absolute right-2.5 top-2.5">
            <WishlistButton listingId={listing.id} listingTitle={listing.title} />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-ink">
          {/* Stretched link: the whole card is clickable, the heart still isn't. */}
          <Link
            to={`/listing/${listing.id}`}
            className="after:absolute after:inset-0 after:content-[''] focus:outline-none"
          >
            {listing.title}
          </Link>
        </h3>

        {listing.subject && (
         <p className="mt-1 line-clamp-1 text-[13px] text-ink-muted">
                {listing.subject}
        </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div>
            <p className="text-lg font-bold tracking-tight text-ink">
              {formatPrice(listing.price)}
            </p>
            {listing.createdAt && (
              <time
                dateTime={toIsoString(listing.createdAt)}
                className="text-[11px] text-ink-soft"
              >
                {formatRelativeDate(listing.createdAt)}
              </time>
            )}
          </div>
        </div>

        {actions && (
          // Sits above the stretched link so its buttons stay clickable.
          <div className="relative z-10 mt-3.5 flex flex-wrap gap-2 border-t border-line pt-3.5">
            {actions}
          </div>
        )}
      </div>
    </article>
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
      <Skeleton className="aspect-[4/5] w-full rounded-none" />
      <div className="space-y-2 p-3.5">
        <Skeleton className="h-4 w-[85%]" />
        <Skeleton className="h-3 w-1/2" />
        <div className="pt-2">
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
    </div>
  );
}
