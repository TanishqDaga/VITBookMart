import { forwardRef, type FormEvent } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/cn";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  /** Larger treatment for the home hero. */
  size?: "md" | "lg";
  className?: string;
  autoFocus?: boolean;
  label?: string;
  /** Rendered inside the bar on the right, e.g. a Filters button. */
  trailing?: React.ReactNode;
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(function SearchBar(
  {
    value,
    onChange,
    onSubmit,
    placeholder = "Find books, notes, subjects…",
    size = "md",
    className,
    autoFocus,
    label = "Search listings",
    trailing,
  },
  ref,
) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit?.(value);
  };

  const large = size === "lg";

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={cn(
        "flex w-full items-center gap-2 rounded-2xl border border-line bg-white",
        "shadow-card transition-shadow focus-within:border-brand-400 focus-within:shadow-card-hover",
        large ? "h-14 pl-4 pr-2" : "h-12 pl-3.5 pr-2",
        className,
      )}
    >
      <Search
        aria-hidden
        className={cn("shrink-0 text-ink-soft", large ? "h-5 w-5" : "h-4.5 w-4.5")}
      />

      <input
        ref={ref}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        autoFocus={autoFocus}
        // The browser's own clear button would sit on top of ours.
        className={cn(
          "min-w-0 flex-1 bg-transparent text-ink placeholder:text-ink-soft/80 focus:outline-none",
          "[&::-webkit-search-cancel-button]:appearance-none",
          large ? "text-base" : "text-sm",
        )}
      />

      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="rounded-lg p-1.5 text-ink-soft transition-colors hover:bg-surface-sunken hover:text-ink"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      )}

      {trailing}
    </form>
  );
});
