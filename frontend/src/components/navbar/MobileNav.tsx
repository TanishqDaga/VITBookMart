import { NavLink } from "react-router-dom";
import { Heart, Home, Search, User } from "lucide-react";
import { cn } from "@/lib/cn";

const TABS = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/browse", label: "Browse", icon: Search, end: false },
  { to: "/wishlist", label: "Wishlist", icon: Heart, end: false },
  { to: "/profile", label: "Profile", icon: User, end: false },
];

/**
 * Bottom tab bar for small screens. Sell is deliberately absent here — it lives
 * in the floating action button directly above, where it reads as the primary action.
 */
export function MobileNav() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur-md md:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch pb-[env(safe-area-inset-bottom)]">
        {TABS.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors",
                  isActive ? "text-brand-600" : "text-ink-soft hover:text-ink",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn("h-5 w-5", isActive && "stroke-[2.4]")}
                    aria-hidden
                  />
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
