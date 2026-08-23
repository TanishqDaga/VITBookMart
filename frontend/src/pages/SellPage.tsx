import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { toApiError } from "@/api/errors";
import { useAuth } from "@/context/AuthContext";
import { useCreateListing } from "@/hooks/useListings";
import { useProfile } from "@/hooks/useProfile";
import { PageHeader } from "@/components/common/PageHeader";
import { PageSpinner } from "@/components/common/PageSpinner";
import { ListingForm } from "@/components/sell/ListingForm";
import { ProfileGate } from "@/components/profile/ProfileGate";

export default function SellPage() {
  const navigate = useNavigate();
  const { isProfileComplete } = useAuth();
  // Re-check against the server rather than trusting the cached user object.
  const { isPending: profileLoading } = useProfile();
  const createListing = useCreateListing();

  if (profileLoading) return <PageSpinner label="Loading your profile" />;

  return (
    <div className="page-shell max-w-3xl py-8 sm:py-10">
      <PageHeader
        title="Sell an item"
        description="List a book, set of notes or study material for another VIT student."
      />

      <div className="mt-7">
        {!isProfileComplete ? (
          <ProfileGate />
        ) : (
          <ListingForm
            mode="create"
            isSubmitting={createListing.isPending}
            submitLabel="Post listing"
            onSubmit={({ request, image }) => {
              if (!image) return;

              createListing.mutate(
                { request, image },
                {
                  onSuccess(listing) {
                    navigate(`/listing/${listing.id}`, { replace: true });
                  },
                  onError(error) {
                    const apiError = toApiError(error);
                    // The backend re-checks the profile; honour its verdict.
                    if (apiError.kind === "profileIncomplete") {
                      toast.error(apiError.message);
                      navigate("/profile");
                      return;
                    }
                    toast.error(apiError.message);
                  },
                },
              );
            }}
          />
        )}
      </div>
    </div>
  );
}
