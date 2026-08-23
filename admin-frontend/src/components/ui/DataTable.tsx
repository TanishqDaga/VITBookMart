import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { Skeleton } from "./States";

export interface Column<T> {
  key: string;
  header: string;
  /** Cell contents. */
  render: (row: T) => ReactNode;
  /** Return a comparable value to make the column sortable. */
  sortValue?: (row: T) => string | number | null;
  className?: string;
  headerClassName?: string;
  /** Hidden below `lg` so narrow screens stay readable. */
  secondary?: boolean;
}

interface DataTableProps<T> {
  rows: readonly T[];
  columns: ReadonlyArray<Column<T>>;
  rowKey: (row: T, index: number) => string;
  /** Free-text haystack per row. Omit to disable searching. */
  searchText?: (row: T) => string;
  searchPlaceholder?: string;
  pageSize?: number;
  isLoading?: boolean;
  empty?: ReactNode;
  /** Rendered above the table, next to the search box. */
  toolbar?: ReactNode;
  caption: string;
}

type SortDirection = "asc" | "desc";

/**
 * The admin API returns whole collections with no server-side search, sort or
 * pagination — so all three happen here, over data that has already arrived. That
 * is a deliberate consequence of the backend shape, not a design preference; see
 * the README note about it not scaling past a few thousand rows.
 */
export function DataTable<T>({
  rows,
  columns,
  rowKey,
  searchText,
  searchPlaceholder = "Search…",
  pageSize = 25,
  isLoading,
  empty,
  toolbar,
  caption,
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [direction, setDirection] = useState<SortDirection>("asc");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (!searchText || !query.trim()) return rows;
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => searchText(row).toLowerCase().includes(needle));
  }, [rows, query, searchText]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const column = columns.find((item) => item.key === sortKey);
    if (!column?.sortValue) return filtered;

    return [...filtered].sort((a, b) => {
      const left = column.sortValue!(a);
      const right = column.sortValue!(b);

      // Missing values sink to the bottom regardless of direction.
      if (left === null || left === undefined) return 1;
      if (right === null || right === undefined) return -1;

      const result =
        typeof left === "number" && typeof right === "number"
          ? left - right
          : String(left).localeCompare(String(right), undefined, { numeric: true });

      return direction === "asc" ? result : -result;
    });
  }, [filtered, sortKey, direction, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const visible = sorted.slice(safePage * pageSize, safePage * pageSize + pageSize);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setDirection((value) => (value === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setDirection("asc");
    }
    setPage(0);
  };

  return (
    <div className="space-y-3">
      {(searchText || toolbar) && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {searchText && (
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(0);
              }}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="h-9 w-full rounded-lg border border-line-strong bg-white px-3 text-sm placeholder:text-ink-soft/70 focus:border-key-500 focus:outline-none focus:ring-2 focus:ring-key-500/20 sm:max-w-xs"
            />
          )}
          {toolbar && <div className="flex flex-wrap items-center gap-2">{toolbar}</div>}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-line bg-white shadow-panel">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">{caption}</caption>
            <thead>
              <tr className="border-b border-line bg-canvas-muted">
                {columns.map((column) => {
                  const active = sortKey === column.key;
                  const SortIcon = !active ? ChevronsUpDown : direction === "asc" ? ArrowUp : ArrowDown;

                  return (
                    <th
                      key={column.key}
                      scope="col"
                      aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : undefined}
                      className={cn(
                        "px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-ink-soft",
                        column.secondary && "hidden lg:table-cell",
                        column.headerClassName,
                      )}
                    >
                      {column.sortValue ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(column.key)}
                          className="inline-flex items-center gap-1 rounded transition-colors hover:text-ink"
                        >
                          {column.header}
                          <SortIcon className={cn("h-3 w-3", active ? "text-key-600" : "text-ink-soft/60")} aria-hidden />
                        </button>
                      ) : (
                        column.header
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {isLoading &&
                Array.from({ length: 6 }, (_, rowIndex) => (
                  <tr key={rowIndex} className="border-b border-line last:border-0">
                    {columns.map((column) => (
                      <td key={column.key} className={cn("px-3 py-3", column.secondary && "hidden lg:table-cell")}>
                        <Skeleton className="h-4 w-full max-w-[10rem]" />
                      </td>
                    ))}
                  </tr>
                ))}

              {!isLoading &&
                visible.map((row, index) => (
                  <tr
                    key={rowKey(row, safePage * pageSize + index)}
                    className="border-b border-line transition-colors last:border-0 hover:bg-canvas-muted"
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={cn("px-3 py-2.5 align-middle", column.secondary && "hidden lg:table-cell", column.className)}
                      >
                        {column.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {!isLoading && visible.length === 0 && (
          <div className="px-4 py-12 text-center">
            {empty ?? (
              <p className="text-sm text-ink-muted">
                {query.trim() ? "No rows match that search." : "Nothing to show."}
              </p>
            )}
          </div>
        )}
      </div>

      {!isLoading && sorted.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-ink-muted" aria-live="polite">
            Showing <span className="font-semibold text-ink">{safePage * pageSize + 1}</span>–
            <span className="font-semibold text-ink">{safePage * pageSize + visible.length}</span> of{" "}
            <span className="font-semibold text-ink">{sorted.length.toLocaleString("en-IN")}</span>
            {query.trim() && rows.length !== sorted.length && (
              <span className="text-ink-soft"> (filtered from {rows.length.toLocaleString("en-IN")})</span>
            )}
          </p>

          {totalPages > 1 && (
            <nav aria-label="Table pages" className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage(safePage - 1)}
                disabled={safePage === 0}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-line-strong bg-white px-2.5 text-[13px] font-semibold transition-colors hover:bg-canvas-sunken disabled:pointer-events-none disabled:opacity-45"
              >
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
                Previous
              </button>
              <span className="px-2 text-[13px] font-medium text-ink-muted">
                Page {safePage + 1} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage(safePage + 1)}
                disabled={safePage >= totalPages - 1}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-line-strong bg-white px-2.5 text-[13px] font-semibold transition-colors hover:bg-canvas-sunken disabled:pointer-events-none disabled:opacity-45"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              </button>
            </nav>
          )}
        </div>
      )}
    </div>
  );
}
