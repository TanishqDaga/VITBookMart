import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/common/Button";

export function SellCta() {
  return (
    <section className="page-shell py-12 sm:py-14">
      <div className="relative overflow-hidden rounded-3xl bg-brand-950 px-6 py-12 text-center sm:px-12 sm:py-14">
        <div aria-hidden className="slot-lattice absolute inset-0 opacity-60" />
        <div
          aria-hidden
          className="absolute -right-16 -top-20 h-72 w-72 rounded-full bg-accent-600/25 blur-3xl"
        />

        <div className="relative mx-auto max-w-xl">
          <h2 className="text-display-md font-extrabold text-white">
            Have books or notes you no longer need?
          </h2>
          <p className="mt-3 text-base leading-relaxed text-brand-100/85">
            Sell them to another VIT student. It takes a couple of minutes.
          </p>
          <ButtonLink
            to="/sell"
            size="lg"
            className="mt-7 bg-white text-brand-950 hover:bg-brand-50"
          >
            Start selling
            <ArrowRight className="h-4 w-4" aria-hidden />
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
