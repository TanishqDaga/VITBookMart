import { NavLink } from "react-router-dom";
import { LayoutDashboard, ListOrdered, ShieldCheck, Users, X } from "lucide-react";
import { cn } from "@/lib/cn";

const LINKS = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/users", label: "Users", icon: Users, end: false },
  { to: "/listings", label: "Listings", icon: ListOrdered, end: false },
  { to: "/admins", label: "Admins", icon: ShieldCheck, end: false },
];

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Admin sections" className="on-dark flex-1 space-y-0.5 p-3">
      {LINKS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive ? "bg-shell-700 text-white" : "text-stone-400 hover:bg-shell-800 hover:text-white",
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon className={cn("h-4 w-4", isActive && "text-key-400")} aria-hidden />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5 border-b border-shell-700 px-4 py-4">
      <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-lg bg-key-500 text-shell-900">
        <ShieldCheck className="h-4.5 w-4.5" strokeWidth={2.5} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold leading-tight text-white">VITBookMart</p>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-key-500">Admin</p>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col bg-shell-900 lg:flex">
      <Brand />
      <Nav />
      <p className="border-t border-shell-700 px-4 py-3 text-[11px] leading-relaxed text-stone-500">
        Staff console. Actions here affect live student data.
      </p>
    </aside>
  );
}

export function MobileSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] lg:hidden">
      <div className="absolute inset-0 animate-fade-in bg-shell-900/60" onClick={onClose} aria-hidden />
      <div role="dialog" aria-modal="true" aria-label="Admin sections"
        className="relative flex h-full w-64 animate-fade-in flex-col bg-shell-900">
        <div className="flex items-center justify-between border-b border-shell-700 pr-2">
          <div className="flex-1"><Brand /></div>
          <button type="button" onClick={onClose} aria-label="Close menu"
            className="on-dark rounded-md p-2 text-stone-400 transition-colors hover:bg-shell-800 hover:text-white">
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <Nav onNavigate={onClose} />
      </div>
    </div>
  );
}
