import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, Heart, LayoutList, LogOut, Plus, User } from "lucide-react";
import { cn } from "@/lib/cn";
import { initialsOf } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";
import { useWishlistedIds } from "@/hooks/useWishlist";
import { Button, ButtonLink } from "@/components/common/Button";
import { BrandMark } from "./BrandMark";

const NAV_LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/browse", label: "Browse", end: false },
];

export function Navbar() {
  const { isAuthenticated, user, signOut } = useAuth();
  const wishlistedIds = useWishlistedIds();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/85 backdrop-blur-md">
      <div className="page-shell flex h-16 items-center gap-3">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
          aria-label="VITBookMart — go to home"
        >
          <BrandMark className="h-8 w-8" />
          <span className="font-display text-[17px] font-extrabold tracking-tight text-ink">
            VITBookMart
          </span>
        </Link>

        <nav aria-label="Main" className="ml-4 hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-ink-muted hover:bg-surface-sunken hover:text-ink",
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {isAuthenticated && (
            <Link
              to="/wishlist"
              aria-label={
                wishlistedIds.size > 0
                  ? `Wishlist, ${wishlistedIds.size} saved`
                  : "Wishlist"
              }
              className="relative hidden rounded-xl p-2.5 text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink md:inline-flex"
            >
              <Heart className="h-5 w-5" aria-hidden />
              {wishlistedIds.size > 0 && (
                <span
                  aria-hidden
                  className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-600 px-1 text-[10px] font-bold text-white"
                >
                  {wishlistedIds.size > 99 ? "99+" : wishlistedIds.size}
                </span>
              )}
            </Link>
          )}

          <ButtonLink to="/sell" size="sm" className="hidden sm:inline-flex">
            <Plus className="h-4 w-4" aria-hidden />
            Sell
          </ButtonLink>

          {isAuthenticated ? (
            <ProfileMenu
              name={user?.name ?? null}
              email={user?.email ?? null}
              onSignOut={() => {
                signOut();
                navigate("/");
              }}
            />
          ) : (
            <Button size="sm" variant="outline" onClick={() => navigate("/login")}>
              Sign in
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

interface ProfileMenuProps {
  name: string | null;
  email: string | null;
  onSignOut: () => void;
}

/** Avatar dropdown: Profile, My listings, Log out. Nothing else. */
function ProfileMenu({ name, email, onSignOut }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();

  // Route changes should never leave the menu hanging open.
  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const items = [
    { to: "/profile", label: "Profile", icon: User },
    { to: "/my-listings", label: "My listings", icon: LayoutList },
    { to: "/wishlist", label: "Wishlist", icon: Heart },
  ];

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-1.5 rounded-xl p-1 transition-colors hover:bg-surface-sunken"
      >
        <span className="sr-only">Account menu</span>
        <span
          aria-hidden
          className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white"
        >
          {initialsOf(name)}
        </span>
        <ChevronDown
          aria-hidden
          className={cn(
            "hidden h-4 w-4 text-ink-soft transition-transform sm:block",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account"
          className="absolute right-0 top-full z-50 mt-2 w-60 animate-scale-in overflow-hidden rounded-2xl border border-line bg-white shadow-pop"
        >
          <div className="border-b border-line px-4 py-3">
            <p className="truncate text-sm font-semibold text-ink">{name ?? "Your account"}</p>
            {email && <p className="truncate text-xs text-ink-soft">{email}</p>}
          </div>

          <div className="p-1.5">
            {items.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                role="menuitem"
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface-sunken"
              >
                <Icon className="h-4 w-4 text-ink-soft" aria-hidden />
                {label}
              </Link>
            ))}
          </div>

          <div className="border-t border-line p-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={onSignOut}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-danger-600 transition-colors hover:bg-danger-50"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
