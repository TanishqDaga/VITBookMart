import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Plus } from "lucide-react";
import { EXAM_SLOT_ROWS } from "@/types";
import { firstNameOf } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";
import { Button, ButtonLink } from "@/components/common/Button";
import { SearchBar } from "@/components/common/SearchBar";

/**
 * The slot board: the 7x2 exam-slot grid every VIT student already reads at a
 * glance, used here as the hero's visual anchor instead of stock photography.
 * Decorative only — the real, interactive version lives in the sell form.
 */
function SlotBoard() {
  return (
    <div
      aria-hidden
      className="relative rounded-2xl border border-white/15 bg-white/[0.06] p-5 backdrop-blur-sm"
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-200">
        Exam slots
      </p>
      <div className="mt-3.5 grid grid-cols-2 gap-2">
        {EXAM_SLOT_ROWS.flat().map((slot, index) => (
          <div
            key={slot}
            className={
              // A scattered handful read as "taken", which is what the picker encodes.
              [2, 5, 9, 10].includes(index)
                ? "rounded-lg bg-accent-500/25 px-3 py-2 text-center font-mono text-[13px] font-semibold text-white ring-1 ring-accent-400/40"
                : "rounded-lg bg-white/[0.07] px-3 py-2 text-center font-mono text-[13px] font-medium text-brand-100/70"
            }
          >
            {slot}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Hero() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState("");

  const search = (value: string) => {
    const trimmed = value.trim();
    // Search is real: it lands on Browse, which calls GET /api/listings/search.
    navigate(trimmed ? `/browse?query=${encodeURIComponent(trimmed)}` : "/browse");
  };

  const firstName = firstNameOf(user?.name);

  return (
    <section className="relative overflow-hidden bg-brand-950 text-white">
      <div aria-hidden className="slot-lattice absolute inset-0 opacity-70" />
      <div
        aria-hidden
        className="absolute -right-24 -top-32 h-[28rem] w-[28rem] rounded-full bg-accent-600/25 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl"
      />

      <div className="page-shell relative py-14 sm:py-18 lg:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-7">
            {firstName && (
              <p className="mb-3 text-sm font-semibold text-brand-200">
                Welcome back, {firstName}
              </p>
            )}

            <h1 className="text-display-lg font-extrabold text-white">
              Buy. Sell. Rent.
              <br />
              <span className="text-brand-300">All within VIT.</span>
            </h1>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-brand-100/85 sm:text-lg">
              Find books, notes and study material from fellow VIT students.
            </p>

            <div className="mt-7 max-w-xl">
              <SearchBar
                value={query}
                onChange={setQuery}
                onSubmit={search}
                size="lg"
                label="Search books, notes and subjects"
                trailing={
                  <Button type="submit" size="sm" className="h-10 shrink-0 px-4">
                    Search
                  </Button>
                }
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink
                to="/browse"
                size="lg"
                className="bg-white text-brand-950 hover:bg-brand-50"
              >
                Browse listings
                <ArrowRight className="h-4 w-4" aria-hidden />
              </ButtonLink>
              <ButtonLink
                to="/sell"
                size="lg"
                variant="ghost"
                className="border border-white/25 text-white hover:bg-white/10 hover:text-white"
              >
                <Plus className="h-4 w-4" aria-hidden />
                Sell something
              </ButtonLink>
            </div>
          </div>

          <div className="hidden lg:col-span-5 lg:block">
            <SlotBoard />
          </div>
        </div>
      </div>
    </section>
  );
}
