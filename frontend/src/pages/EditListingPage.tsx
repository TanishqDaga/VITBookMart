import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { errorMessage, toApiError } from "@/api/errors";
import { useListingDetail, useMyListings, useUpdateListing } from "@/hooks/useListings";
import { ButtonLink } from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { PageHeader } from "@/components/common/PageHeader";
import { PageSpinner } from "@/components/common/PageSpinner";
import { ListingForm } from "@/components/sell/ListingForm";

export default function EditListingPage() {
  const { listingId } = useParams<{ listingId: string }>();
  const navigate = useNavigate();

  const listingQuery = useListingDetail(listingId);
  // ListingDetailResponse carries no sellerId, so ownership is checked against
  // the caller's own listings. The backend enforces it regardless.
  const myListingsQuery = useMyListings();
  const updateListing = useUpdateListing(listingId ?? "");

  if (listingQuery.isPending || myListingsQuery.isPending) {
    return <PageSpinner label="Loading listing" />;
  }

  if (listingQuery.isError) {
    return (
      <div className="page-shell py-16">
        <ErrorState error={listingQuery.error} onRetry={() => void listingQuery.refetch()} />
      </div>
    );
  }

  const listing = listingQuery.data;
  const owned = myListingsQuery.data?.some((item) => item.id === listingId);

  if (!listing) return null;

  if (!owned) {
    return (
      <div className="page-shell py-16">
        <EmptyState
          icon={<Lock className="h-6 w-6" aria-hidden />}
          title="You can only edit listings you posted"
          description="This listing belongs to another student."
          action={
            <>
              <ButtonLink to={`/listing/${listingId}`} variant="outline">
                View listing
              </ButtonLink>
              <ButtonLink to="/my-listings">My listings</ButtonLink>
            </>
          }
        />
      </div>
    );
  }

  return (
    <div className="page-shell max-w-3xl py-8 sm:py-10">
      <PageHeader title="Edit listing" description="Update the details of your listing." />

      <div className="mt-7">
        <ListingForm
          mode="edit"
          existingImageUrl={listing.imageUrl}
          isSubmitting={updateListing.isPending}
          submitLabel="Save changes"
          defaultValues={{
            title: listing.title,
            subject: listing.subject,
            description: listing.description ?? "",
            category: listing.category ?? undefined,
            type: listing.type,
            price: listing.price !== null ? String(listing.price) : "",
            unavailableExamSlots: listing.unavailableExamSlots ?? [],
          }}
          onSubmit={({ request }) => {
            updateListing.mutate(request, {
              onSuccess() {
                navigate(`/listing/${listingId}`);
              },
              onError(error) {
                if (toApiError(error).kind === "notOwner") {
                  toast.error("You can only edit listings you posted.");
                  navigate("/my-listings");
                  return;
                }
                toast.error(errorMessage(error));
              },
            });
          }}
        />
      </div>
    </div>
  );
}
