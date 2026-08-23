import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/navbar/Navbar";
import { MobileNav } from "@/components/navbar/MobileNav";
import { Footer } from "@/components/footer/Footer";
import { FloatingSellButton } from "@/components/common/FloatingSellButton";

export function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <Navbar />

      {/* Bottom padding clears the mobile tab bar. */}
      <main id="main" className="flex-1 pb-24 md:pb-0">
        <Outlet />
      </main>

      <Footer />
      <FloatingSellButton />
      <MobileNav />
    </div>
  );
}
