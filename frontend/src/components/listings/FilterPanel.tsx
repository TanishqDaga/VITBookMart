import { LISTING_CATEGORIES, LISTING_TYPES, SORT_VALUES } from "@/types";
import type { ListingCategory, ListingType, SortValue } from "@/types";
import { CATEGORY_LABELS, SORT_LABELS, TYPE_FILTER_LABELS } from "@/constants/labels";
import { cn } from "@/lib/cn";
import type { BrowseFilters } from "@/hooks/useBrowseParams";

interface FilterPanelProps {
  filters: BrowseFilters;
  onChange: (patch: Partial<BrowseFilters>) => void;
}

function OptionRow<T extends string>({
  legend,
  options,
  value,
  onSelect,
}: {
  legend: string;
  options: Array<{ value: T | null; label: string }>;
  value: T | null;
  onSelect: (value: T | null) => void;
}) {
  return (
    <fieldset>
      <legend className="text-[13px] font-bold uppercase tracking-wider text-ink-soft">
        {legend}
      </legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.label}
              type="button"
              onClick={() => onSelect(option.value)}
              aria-pressed={selected}
              className={cn(
                "rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors",
                selected
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-line bg-white text-ink-muted hover:border-brand-300 hover:text-ink",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/**
 * Only exposes filters the backend's search endpoint accepts: type, category
 * and sort. There is no price range, no condition and no seller filter, because
 * ListingRepositoryCustomImpl doesn't support them.
 */
export function FilterPanel({ filters, onChange }: FilterPanelProps) {
  return (
    <div className="space-y-7">
      <OptionRow<ListingType>
        legend="Listing type"
        value={filters.type}
        onSelect={(type) => onChange({ type })}
        options={[
          { value: null, label: "All" },
          ...LISTING_TYPES.map((type) => ({ value: type, label: TYPE_FILTER_LABELS[type] })),
        ]}
      />

      <OptionRow<ListingCategory>
        legend="Category"
        value={filters.category}
        onSelect={(category) => onChange({ category })}
        options={[
          { value: null, label: "All" },
          ...LISTING_CATEGORIES.map((category) => ({
            value: category,
            label: CATEGORY_LABELS[category],
          })),
        ]}
      />

      <fieldset>
        <legend className="text-[13px] font-bold uppercase tracking-wider text-ink-soft">
          Sort by
        </legend>
        <div className="mt-3 space-y-1.5">
          {SORT_VALUES.map((sort) => (
            <label
              key={sort}
              className={cn(
                "flex cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-colors",
                filters.sort === sort
                  ? "border-brand-300 bg-brand-50 text-brand-700"
                  : "border-line bg-white text-ink-muted hover:border-line-strong",
              )}
            >
              <input
                type="radio"
                name="sort"
                value={sort}
                checked={filters.sort === sort}
                onChange={() => onChange({ sort: sort as SortValue })}
                className="h-4 w-4 accent-brand-600"
              />
              {SORT_LABELS[sort]}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

interface ActiveChipsProps {
  filters: BrowseFilters;
  onChange: (patch: Partial<BrowseFilters>) => void;
  onClear: () => void;
}

export function ActiveFilterChips({ filters, onChange, onClear }: ActiveChipsProps) {
  const chips: Array<{ label: string; clear: () => void }> = [];

  if (filters.query.trim()) {
    chips.push({ label: `"${filters.query.trim()}"`, clear: () => onChange({ query: "" }) });
  }
  if (filters.category) {
    chips.push({
      label: CATEGORY_LABELS[filters.category],
      clear: () => onChange({ category: null }),
    });
  }
  if (filters.type) {
    chips.push({
      label: TYPE_FILTER_LABELS[filters.type],
      clear: () => onChange({ type: null }),
    });
  }
  if (filters.sort !== "latest") {
    chips.push({
      label: SORT_LABELS[filters.sort],
      clear: () => onChange({ sort: "latest" }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.label}
          type="button"
          onClick={chip.clear}
          className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 py-1.5 pl-3 pr-2.5 text-[13px] font-semibold text-brand-700 transition-colors hover:border-brand-300 hover:bg-brand-100"
        >
          {chip.label}
          <span aria-hidden className="text-base leading-none">
            ×
          </span>
          <span className="sr-only">Remove filter</span>
        </button>
      ))}

      <button
        type="button"
        onClick={onClear}
        className="rounded-lg px-2 py-1.5 text-[13px] font-semibold text-ink-soft underline-offset-2 transition-colors hover:text-ink hover:underline"
      >
        Clear filters
      </button>
    </div>
  );
}
