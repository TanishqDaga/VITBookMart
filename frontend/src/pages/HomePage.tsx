import { Hero } from "@/components/home/Hero";
import { QuickCategories } from "@/components/home/QuickCategories";
import { WelcomeSection } from "@/components/home/WelcomeSection";
import { UserGuide } from "@/components/home/UserGuide";
import { LatestListings } from "@/components/home/LatestListings";
import { SellCta } from "@/components/home/SellCta";

/**
 * Fully public. Nothing here requires a session — the personalised greeting in
 * the hero is additive and simply doesn't render when signed out.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <QuickCategories />
      <WelcomeSection />
      <UserGuide />
      <LatestListings />
      <SellCta />
    </>
  );
}
