import { useState } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAuth } from "@/context/AuthContext";
import { useToggleWishlist, useWishlistedIds } from "@/hooks/useWishlist";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { SignInPrompt } from "@/components/auth/SignInPrompt";
import type { ObjectIdString } from "@/types";

interface WishlistButtonProps {
  listingId: ObjectIdString;
  listingTitle: string;
  /** "card" floats over the image; "inline" sits in a row of buttons. */
  variant?: "card" | "inline";
  className?: string;
}

export function WishlistButton({
  listingId,
  listingTitle,
  variant = "card",
  className,
}: WishlistButtonProps) {
  const { isAuthenticated } = useAuth();
  const wishlistedIds = useWishlistedIds();
  const toggle = useToggleWishlist();
  const reducedMotion = usePrefersReducedMotion();
  const [promptOpen, setPromptOpen] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const wishlisted = wishlistedIds.has(listingId);

  const handleClick = (event: React.MouseEvent) => {
    // Cards wrap the whole tile in a link — don't navigate when the heart is hit.
    event.preventDefault();
    event.stopPropagation();

    if (!isAuthenticated) {
      setPromptOpen(true);
      return;
    }

    if (!wishlisted) {
      setJustAdded(true);
      window.setTimeout(() => setJustAdded(false), 340);
    }

    toggle.mutate({ listingId, wishlisted });
  };

  const label = wishlisted
    ? `Remove ${listingTitle} from wishlist`
    : `Save ${listingTitle} to wishlist`;

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={toggle.isPending}
        aria-label={label}
        aria-pressed={wishlisted}
        title={wishlisted ? "Saved to wishlist" : "Save to wishlist"}
        className={cn(
          "inline-flex items-center justify-center rounded-full transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2",
          "disabled:opacity-60",
          variant === "card"
            ? "h-9 w-9 bg-white/95 shadow-sm backdrop-blur hover:scale-105 hover:bg-white"
            : "h-11 gap-2 border border-line-strong bg-white px-4 text-sm font-semibold hover:border-brand-300 hover:bg-brand-50",
          className,
        )}
      >
        <Heart
          aria-hidden
          className={cn(
            "h-[18px] w-[18px] transition-colors",
            wishlisted ? "fill-danger-600 text-danger-600" : "text-ink-muted",
            justAdded && !reducedMotion && "animate-heart-pop",
          )}
        />
        {variant === "inline" && <span>{wishlisted ? "Saved" : "Save"}</span>}
      </button>

      <SignInPrompt open={promptOpen} onClose={() => setPromptOpen(false)} />
    </>
  );
}
