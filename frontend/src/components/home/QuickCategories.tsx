import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { LISTING_CATEGORIES } from "@/types";
import { CATEGORY_DESCRIPTIONS, CATEGORY_LABELS } from "@/constants/labels";
import { CategoryIcon } from "@/components/listings/CategoryIcon";

/**
 * Built from LISTING_CATEGORIES, which mirrors the backend enum exactly, so no
 * invented category can appear here. The link sends the raw enum value.
 */
export function QuickCategories() {
  return (
    <section aria-labelledby="categories" className="page-shell py-12 sm:py-14">
      <h2 id="categories" className="sr-only">
        Browse by category
      </h2>

      <ul className="grid gap-3.5 sm:grid-cols-3">
        {LISTING_CATEGORIES.map((category) => (
          <li key={category}>
            <Link
              to={`/browse?category=${category}`}
              className="group flex h-full items-start gap-4 rounded-2xl border border-line bg-white p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover"
            >
              <span
                aria-hidden
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white"
              >
                <CategoryIcon category={category} className="h-5 w-5" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 font-display text-base font-bold text-ink">
                  {CATEGORY_LABELS[category]}
                  <ArrowUpRight
                    aria-hidden
                    className="h-4 w-4 text-ink-soft transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-600"
                  />
                </span>
                <span className="mt-1 block text-[13px] leading-relaxed text-ink-muted">
                  {CATEGORY_DESCRIPTIONS[category]}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
