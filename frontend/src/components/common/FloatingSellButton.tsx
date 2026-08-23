import { Link, useLocation } from "react-router-dom";
import { Plus } from "lucide-react";
import { cn } from "@/lib/cn";

/** Routes where a floating Sell button would be noise or would overlap the form. */
const HIDDEN_ON = ["/sell", "/login", "/auth/callback"];

/**
 * The marketplace's primary action, always one tap away.
 * On mobile it clears the bottom tab bar; on desktop it sits in the corner.
 */
export function FloatingSellButton() {
  const location = useLocation();

  const hidden =
    HIDDEN_ON.some((path) => location.pathname.startsWith(path)) ||
    location.pathname.startsWith("/edit-listing");

  if (hidden) return null;

  return (
    <Link
      to="/sell"
      aria-label="Sell an item"
      className={cn(
        "group fixed right-4 z-40 flex items-center gap-2 rounded-full bg-brand-600 text-white",
        "shadow-float transition-[transform,background-color] duration-200",
        "hover:-translate-y-0.5 hover:bg-brand-700 active:translate-y-0",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2",
        // Above the mobile tab bar, then back to a normal corner offset on desktop.
        "bottom-[calc(4.75rem+env(safe-area-inset-bottom))] h-14 w-14 justify-center md:bottom-8 md:right-8 md:h-auto md:w-auto md:px-5 md:py-3.5",
      )}
    >
      <Plus className="h-6 w-6 md:h-5 md:w-5" aria-hidden />
      <span className="hidden text-sm font-bold md:inline">Sell</span>
    </Link>
  );
}
