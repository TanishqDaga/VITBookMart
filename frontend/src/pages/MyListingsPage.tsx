import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Eye, PackagePlus, Pencil } from "lucide-react";
import {useMarkAsAvailable,useMarkAsSold,useMyListings,} from "@/hooks/useListings";
import { ButtonLink } from "@/components/common/Button";
import { ConfirmDialog } from "@/components/common/Modal";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { PageHeader } from "@/components/common/PageHeader";
import { ListingGrid, ListingGridSkeleton } from "@/components/listings/ListingGrid";
import type { ListingResponse } from "@/types";

const ACTION_CLASS =
  "inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-line " +
  "px-2.5 text-[13px] font-semibold text-ink transition-colors hover:border-brand-300 hover:bg-brand-50";

export default function MyListingsPage() {
  const { data, isPending, isError, error, refetch } = useMyListings();
const markAsSold = useMarkAsSold();
const markAsAvailable = useMarkAsAvailable();

const [pendingSold, setPendingSold] = useState<ListingResponse | null>(null);
const [pendingAvailable, setPendingAvailable] =useState<ListingResponse | null>(null);

  const available = data?.filter((listing) => listing.status === "AVAILABLE") ?? [];
  const sold = data?.filter((listing) => listing.status === "SOLD") ?? [];

  return (
    <div className="page-shell py-8 sm:py-10">
      <PageHeader
        title="My listings"
        description="Everything you've posted on VITBookMart."
        actions={
          <ButtonLink to="/sell">
            <PackagePlus className="h-4 w-4" aria-hidden />
            New listing
          </ButtonLink>
        }
      />

      <div className="mt-7 space-y-12">
        {isPending && <ListingGridSkeleton count={4} label="Loading your listings" />}

        {isError && <ErrorState error={error} onRetry={() => void refetch()} />}

        {data && data.length === 0 && (
          <EmptyState
            icon={<PackagePlus className="h-6 w-6" aria-hidden />}
            title="You haven't listed anything yet"
            description="Post a book or set of notes and another student can pick it up this week."
            action={<ButtonLink to="/sell">Sell something</ButtonLink>}
          />
        )}

        {available.length > 0 && (
          <section aria-labelledby="available">
            <h2 id="available" className="font-display text-lg font-bold">
              Available
              <span className="ml-2 text-sm font-medium text-ink-soft">{available.length}</span>
            </h2>
            <div className="mt-4">
              <ListingGrid
                listings={available}
                showWishlist={false}
                renderActions={(listing) => (
                  <>
                    <Link to={`/listing/${listing.id}`} className={ACTION_CLASS}>
                      <Eye className="h-3.5 w-3.5" aria-hidden />
                      View
                    </Link>
                    <Link to={`/edit-listing/${listing.id}`} className={ACTION_CLASS}>
                      <Pencil className="h-3.5 w-3.5" aria-hidden />
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => setPendingSold(listing)}
                      className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-positive-600 px-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-positive-700"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                      Mark as sold
                    </button>
                  </>
                )}
              />
            </div>
          </section>
        )}

        {sold.length > 0 && (
          <section aria-labelledby="sold">
            <h2 id="sold" className="font-display text-lg font-bold">
              Sold
              <span className="ml-2 text-sm font-medium text-ink-soft">{sold.length}</span>
            </h2>
            <div className="mt-4">
              <ListingGrid
                listings={sold}
                showWishlist={false}
                renderActions={(listing) => (
                    <>
                    <Link to={`/listing/${listing.id}`} className={ACTION_CLASS}>
                      <Eye className="h-3.5 w-3.5" aria-hidden />
                      View
                    </Link>

                    <button
                      type="button"
                      onClick={() => setPendingAvailable(listing)}
                      className={ACTION_CLASS}
                    >
                      <PackagePlus className="h-3.5 w-3.5" aria-hidden />
                      Make available
                    </button>
                  </>
                )}
              />
            </div>
          </section>
        )}
      </div>

      {/*
        There is no delete button because the backend exposes no delete endpoint
        for normal users — ListingService.deleteListing has no controller mapping.
      */}
      <ConfirmDialog
        open={pendingSold !== null}
        onClose={() => setPendingSold(null)}
        onConfirm={() => {
          if (!pendingSold) return;
          markAsSold.mutate(pendingSold.id, { onSettled: () => setPendingSold(null) });
        }}
        title="Mark this listing as sold?"
        description="This will remove it from the available marketplace."
        confirmLabel="Mark as sold"
        confirmVariant="success"
        isLoading={markAsSold.isPending}
      >
        {pendingSold && (
          <p className="pb-2 text-sm font-semibold text-ink">{pendingSold.title}</p>
        )}
      </ConfirmDialog>
      <ConfirmDialog
        open={pendingAvailable !== null}
        onClose={() => setPendingAvailable(null)}
        onConfirm={() => {
          if (!pendingAvailable) return;

          markAsAvailable.mutate(pendingAvailable.id, {
            onSettled: () => setPendingAvailable(null),
          });
        }}
        title="Make this listing available again?"
        description="This will put the listing back on the available marketplace."
        confirmLabel="Make available"
        isLoading={markAsAvailable.isPending}
      >
        {pendingAvailable && (
          <p className="pb-2 text-sm font-semibold text-ink">
            {pendingAvailable.title}
          </p>
        )}
      </ConfirmDialog>
    </div>
  );
}
