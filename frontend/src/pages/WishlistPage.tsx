import { useState } from "react";
import { Heart, Trash2 } from "lucide-react";
import { useClearWishlist, useWishlist } from "@/hooks/useWishlist";
import { Button, ButtonLink } from "@/components/common/Button";
import { ConfirmDialog } from "@/components/common/Modal";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { PageHeader } from "@/components/common/PageHeader";
import { ListingGrid, ListingGridSkeleton } from "@/components/listings/ListingGrid";

export default function WishlistPage() {
  const { data, isPending, isError, error, refetch } = useWishlist();
  const clearWishlist = useClearWishlist();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const listings = data?.listings ?? [];

  return (
    <div className="page-shell py-8 sm:py-10">
      <PageHeader
        title="My wishlist"
        description="Books and notes you've saved to check later."
        actions={
          listings.length > 0 && (
            // Destructive, so it's secondary and always behind a confirmation.
            <Button variant="ghost" onClick={() => setConfirmOpen(true)}>
              <Trash2 className="h-4 w-4" aria-hidden />
              Clear wishlist
            </Button>
          )
        }
      />

      <div className="mt-7">
        {isPending && <ListingGridSkeleton count={4} label="Loading your wishlist" />}

        {isError && <ErrorState error={error} onRetry={() => void refetch()} />}

        {data && listings.length === 0 && (
          <EmptyState
            icon={<Heart className="h-6 w-6" aria-hidden />}
            title="Your wishlist is empty."
            description="Save books and notes you want to check later."
            action={<ButtonLink to="/browse">Browse listings</ButtonLink>}
          />
        )}

        {listings.length > 0 && <ListingGrid listings={listings} />}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() =>
          clearWishlist.mutate(undefined, { onSettled: () => setConfirmOpen(false) })
        }
        title="Clear wishlist?"
        description="Every saved listing will be removed. This can't be undone."
        confirmLabel="Clear wishlist"
        confirmVariant="danger"
        isLoading={clearWishlist.isPending}
      />
    </div>
  );
}
