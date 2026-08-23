import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...rest }, ref) {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            "h-11 w-full appearance-none rounded-xl border border-line bg-white pl-3.5 pr-10",
            "text-sm text-ink transition-colors focus:border-brand-500 focus:outline-none",
            "focus:ring-2 focus:ring-brand-600/20 disabled:bg-surface-sunken",
            "aria-[invalid=true]:border-danger-600",
            className,
          )}
          {...rest}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft"
        />
      </div>
    );
  },
);
