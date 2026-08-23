import { useState } from "react";
import { Outlet } from "react-router-dom";
import { LogOut, Menu } from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { initialsOf } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { MobileSidebar, Sidebar } from "@/components/layout/Sidebar";

export function AdminLayout() {
  const { identity, signOut } = useAdminAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <a href="#main" className="skip-link">Skip to content</a>

      <Sidebar />
      <MobileSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-line bg-white/90 px-4 backdrop-blur sm:px-6">
          <button type="button" onClick={() => setMenuOpen(true)} aria-label="Open menu"
            className="-ml-1 rounded-lg p-2 text-ink-muted transition-colors hover:bg-canvas-sunken hover:text-ink lg:hidden">
            <Menu className="h-5 w-5" aria-hidden />
          </button>

          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <span aria-hidden
                className="flex h-8 w-8 items-center justify-center rounded-full bg-shell-900 text-xs font-bold text-key-400">
                {initialsOf(identity?.username)}
              </span>
              <div className="hidden leading-tight sm:block">
                <p className="text-[13px] font-semibold text-ink">{identity?.username || "Admin"}</p>
                <p className="text-[11px] text-ink-soft">Signed in</p>
              </div>
            </div>

            <Button variant="ghost" size="sm" onClick={() => signOut()}>
              <LogOut className="h-3.5 w-3.5" aria-hidden />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </header>

        <main id="main" className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <div className="mx-auto w-full max-w-6xl"><Outlet /></div>
        </main>
      </div>
    </div>
  );
}
