import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  MapPin,
  MessageCircle,
  PackageX,
  Pencil,
  Tag,
  User,
} from "lucide-react";
import { toApiError } from "@/api/errors";
import { CATEGORY_LABELS, TYPE_LABELS } from "@/constants/labels";
import { formatDate, formatPrice, formatRelativeDate, toIsoString } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";
import { useContactSeller, useListingDetail, useMyListings } from "@/hooks/useListings";
import { Badge } from "@/components/common/Badge";
import { Button, ButtonLink } from "@/components/common/Button";
import { ConfirmDialog } from "@/components/common/Modal";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { SignInPrompt } from "@/components/auth/SignInPrompt";
import { ListingImage } from "@/components/listings/ListingImage";
import { WishlistButton } from "@/components/wishlist/WishlistButton";
import { Skeleton } from "@/components/common/Skeleton";
import type { Hostel } from "@/types";

function formatHostel(hostel: Hostel | null | undefined): string | null {
  if (!hostel) return null;
  const parts = [hostel.type, hostel.block && `${hostel.block} block`, hostel.room && `Room ${hostel.room}`]
    .filter((part): part is string => Boolean(part && part.trim()));
  return parts.length > 0 ? parts.join(" · ") : null;
}

export default function ListingDetailsPage() {
  const { listingId } = useParams<{ listingId: string }>();
  const { isAuthenticated } = useAuth();

  const { data: listing, isPending, isError, error, refetch } = useListingDetail(listingId);

  // The detail response exposes only the seller's name and hostel — no seller id —
  // so ownership is inferred from the caller's own listings instead.
  const { data: myListings } = useMyListings();
  const isOwner = Boolean(myListings?.some((item) => item.id === listingId));

  const contact = useContactSeller();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);

  if (isPending) return <DetailSkeleton />;

  if (isError) {
    const apiError = toApiError(error);
    if (apiError.kind === "notFound") {
      return (
        <div className="page-shell py-16">
          <EmptyState
            icon={<PackageX className="h-6 w-6" aria-hidden />}
            title="This listing is no longer available."
            description="It may have been removed by the seller."
            action={<ButtonLink to="/browse">Browse listings</ButtonLink>}
          />
        </div>
      );
    }
    return (
      <div className="page-shell py-16">
        <ErrorState error={error} onRetry={() => void refetch()} />
      </div>
    );
  }

  if (!listing) return null;

  const isSold = listing.status === "SOLD";
  const hostel = formatHostel(listing.seller?.hostel);
  const slots = listing.unavailableExamSlots ?? [];

  const startContact = () => {
    // GET /api/listings/contact/{id} requires a bearer token.
    if (!isAuthenticated) {
      setSignInOpen(true);
      return;
    }
    setConfirmOpen(true);
  };

  const openWhatsApp = () => {
    contact.mutate(listingId as string, {
      onSuccess(response) {
        setConfirmOpen(false);
        // The backend builds the wa.me URL itself; we open exactly what it returns.
        window.open(response.whatsappUrl, "_blank", "noopener,noreferrer");
      },
    });
  };

  return (
    <div className="page-shell py-6 sm:py-8">
      <Link
        to="/browse"
        className="inline-flex items-center gap-1.5 rounded-lg text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        Back to browse
      </Link>

      <div className="mt-5 grid gap-8 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5">
          <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
            <ListingImage
              src={listing.imageUrl}
              alt={listing.title}
              priority
              className="aspect-[4/5] w-full"
            />
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              tone={listing.type === "RENT" ? "accent" : "brand"}
              icon={<Tag className="h-3 w-3" aria-hidden />}
            >
              {TYPE_LABELS[listing.type]}
            </Badge>

            {listing.category && <Badge tone="neutral">{CATEGORY_LABELS[listing.category]}</Badge>}

            {isSold ? (
              <Badge tone="muted" icon={<CheckCircle2 className="h-3 w-3" aria-hidden />}>
                Sold
              </Badge>
            ) : (
              <Badge tone="positive">Available</Badge>
            )}
          </div>

          <h1 className="mt-3.5 text-display-sm font-extrabold">{listing.title}</h1>
          {listing.subject && (
          <p className="mt-1.5 text-sm font-medium text-ink-muted">
            {listing.subject}
          </p>
          )}

          <p className="mt-5 text-3xl font-extrabold tracking-tight text-ink">
            {formatPrice(listing.price)}
          </p>

          {isSold && (
            <p className="mt-3 rounded-xl bg-surface-sunken px-4 py-3 text-sm font-medium text-ink-muted">
              This listing has been marked as sold and is no longer available.
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              size="lg"
              onClick={startContact}
              disabled={isSold || isOwner}
              className="flex-1 sm:flex-none"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              Contact seller
            </Button>

            <WishlistButton
              listingId={listing.id}
              listingTitle={listing.title}
              variant="inline"
              className="h-12"
            />

            {isOwner && (
              <ButtonLink to={`/edit-listing/${listing.id}`} variant="outline" size="lg">
                <Pencil className="h-4 w-4" aria-hidden />
                Edit
              </ButtonLink>
            )}
          </div>

          {isOwner && !isSold && (
            <p className="mt-2.5 text-xs text-ink-soft">
              This is your listing. Manage it from{" "}
              <Link to="/my-listings" className="font-semibold text-brand-600 hover:underline">
                My listings
              </Link>
              .
            </p>
          )}

          {listing.description && (
            <section className="mt-8">
              <h2 className="font-display text-base font-bold">Description</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-muted">
                {listing.description}
              </p>
            </section>
          )}

          {/* Only RENT listings carry exam slots — the mapper omits them for SALE. */}
          {listing.type === "RENT" && slots.length > 0 && (
            <section className="mt-8">
             <h2 className="flex items-center gap-2 font-display text-base font-bold">
              <CalendarClock className="h-4 w-4 text-ink-soft" aria-hidden />
              <span>
                <span className="text-red-600">Unavailable</span> exam slots
              </span>
            </h2>
              <p className="mt-1.5 text-sm text-ink-muted">
                The seller has marked these slots as unavailable for this item.
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {slots.map((slot) => (
                  <li
                    key={slot}
                    className="rounded-lg border border-line bg-surface-muted px-3 py-1.5 font-mono text-[13px] font-semibold text-ink"
                  >
                    {slot}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-8 rounded-2xl border border-line bg-white p-5 shadow-card">
            <h2 className="font-display text-base font-bold">Seller</h2>

            <div className="mt-3.5 flex items-start gap-3.5">
              <span
                aria-hidden
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600"
              >
                <User className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-ink">
                  {listing.seller?.name ?? "VIT student"}
                </p>
                {hostel ? (
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-muted">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-soft" aria-hidden />
                    {hostel}
                  </p>
                ) : (
                  <p className="mt-0.5 text-sm text-ink-soft">Hostel details not shared</p>
                )}
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-ink-soft">
              Choosing "Contact seller" opens WhatsApp with
              the number the seller registered.
            </p>
          </section>

          <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-[13px]">
            {listing.createdAt && (
              <div className="flex gap-1.5">
                <dt className="text-ink-soft">Listed</dt>
                <dd>
                  <time dateTime={toIsoString(listing.createdAt)} className="font-medium text-ink">
                    {formatRelativeDate(listing.createdAt)}
                  </time>
                </dd>
              </div>
            )}
            {listing.updatedAt && listing.updatedAt !== listing.createdAt && (
              <div className="flex gap-1.5">
                <dt className="text-ink-soft">Updated</dt>
                <dd className="font-medium text-ink">{formatDate(listing.updatedAt)}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={openWhatsApp}
        title="Contact this seller on WhatsApp?"
        description="You'll be redirected to WhatsApp to contact the seller."
        confirmLabel="Continue to WhatsApp"
        isLoading={contact.isPending}
      />

      <SignInPrompt
        open={signInOpen}
        onClose={() => setSignInOpen(false)}
        title="Sign in to contact the seller"
        description="VITBookMart shares seller contact details with signed-in students only."
      />
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="page-shell py-8" role="status" aria-busy="true">
      <span className="sr-only">Loading listing</span>
      <Skeleton className="h-5 w-32" />
      <div className="mt-5 grid gap-8 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5">
          <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
        </div>
        <div className="space-y-4 lg:col-span-7">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-9 w-[85%]" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-12 w-full max-w-sm" />
          <div className="space-y-2 pt-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[92%]" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
