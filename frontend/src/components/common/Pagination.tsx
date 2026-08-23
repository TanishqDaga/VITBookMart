import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

interface PaginationProps {
  /** Zero-based, straight from PaginatedResponse.page. */
  page: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  onPageChange: (page: number) => void;
}

/**
 * Builds a compact page list: always the first and last page, the current page
 * and its neighbours, with gaps collapsed to an ellipsis.
 * Page numbers shown to the user are 1-based; the values passed back are not.
 */
function buildPageList(current: number, total: number): Array<number | "gap"> {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index);

  const pages = new Set<number>([0, total - 1, current]);
  if (current - 1 > 0) pages.add(current - 1);
  if (current + 1 < total - 1) pages.add(current + 1);

  // Keep the row a stable width when the current page sits at either end.
  if (current <= 2) [1, 2, 3].forEach((page) => page < total - 1 && pages.add(page));
  if (current >= total - 3) {
    [total - 4, total - 3, total - 2].forEach((page) => page > 0 && pages.add(page));
  }

  const sorted = [...pages].filter((page) => page >= 0 && page < total).sort((a, b) => a - b);

  const result: Array<number | "gap"> = [];
  let previous = -1;
  for (const page of sorted) {
    if (previous !== -1 && page - previous > 1) result.push("gap");
    result.push(page);
    previous = page;
  }
  return result;
}

export function Pagination({ page, totalPages, first, last, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = buildPageList(page, totalPages);

  return (
    <nav aria-label="Listing pages" className="flex items-center justify-center gap-1.5">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={first}
        className={cn(
          "inline-flex h-10 items-center gap-1 rounded-xl border border-line bg-white px-3",
          "text-sm font-semibold text-ink transition-colors",
          "hover:border-brand-300 hover:bg-brand-50 disabled:pointer-events-none disabled:opacity-45",
        )}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">Previous</span>
      </button>

      <ul className="flex items-center gap-1">
        {pages.map((item, index) =>
          item === "gap" ? (
            <li
              key={`gap-${index}`}
              aria-hidden
              className="px-1 text-sm font-medium text-ink-soft"
            >
              …
            </li>
          ) : (
            <li key={item}>
              <button
                type="button"
                onClick={() => onPageChange(item)}
                aria-current={item === page ? "page" : undefined}
                aria-label={`Page ${item + 1}`}
                className={cn(
                  "h-10 min-w-10 rounded-xl px-2.5 text-sm font-semibold transition-colors",
                  item === page
                    ? "bg-brand-600 text-white shadow-sm"
                    : "border border-line bg-white text-ink hover:border-brand-300 hover:bg-brand-50",
                )}
              >
                {item + 1}
              </button>
            </li>
          ),
        )}
      </ul>

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={last}
        className={cn(
          "inline-flex h-10 items-center gap-1 rounded-xl border border-line bg-white px-3",
          "text-sm font-semibold text-ink transition-colors",
          "hover:border-brand-300 hover:bg-brand-50 disabled:pointer-events-none disabled:opacity-45",
        )}
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="h-4 w-4" aria-hidden />
      </button>
    </nav>
  );
}

/** "Showing 21–40 of 87 listings" — derived only from fields the backend returns. */
export function ResultRange({
  page,
  size,
  totalElements,
  count,
}: {
  page: number;
  size: number;
  totalElements: number;
  count: number;
}) {
  if (totalElements === 0) return null;

  const from = page * size + 1;
  const to = page * size + count;

  return (
    <p className="text-sm text-ink-muted" aria-live="polite">
      Showing <span className="font-semibold text-ink">{from.toLocaleString("en-IN")}</span>
      {to > from && (
        <>
          –<span className="font-semibold text-ink">{to.toLocaleString("en-IN")}</span>
        </>
      )}{" "}
      of <span className="font-semibold text-ink">{totalElements.toLocaleString("en-IN")}</span>{" "}
      {totalElements === 1 ? "listing" : "listings"}
    </p>
  );
}
