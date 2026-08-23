import { Compass } from "lucide-react";
import { ButtonLink } from "@/components/common/Button";

export default function NotFoundPage() {
  return (
    <div className="page-shell flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <span
        aria-hidden
        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600"
      >
        <Compass className="h-7 w-7" />
      </span>

      <p className="mt-6 font-mono text-sm font-bold tracking-widest text-ink-soft">404</p>
      <h1 className="mt-2 text-display-md font-extrabold">Lost on campus?</h1>
      <p className="mt-3 max-w-sm text-base text-ink-muted">This page doesn't exist.</p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink to="/" size="lg">
          Back to VITBookMart
        </ButtonLink>
        <ButtonLink to="/browse" variant="outline" size="lg">
          Browse listings
        </ButtonLink>
      </div>
    </div>
  );
}
