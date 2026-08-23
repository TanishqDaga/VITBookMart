import { cn } from "@/lib/cn";

/**
 * Two book spines standing together — a shelf, and a handover between students.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("shrink-0", className)} aria-hidden focusable="false">
      <rect width="32" height="32" rx="8" className="fill-brand-950" />
      <path d="M8 9.5A1.5 1.5 0 0 1 9.5 8H15v16H9.5A1.5 1.5 0 0 1 8 22.5v-13Z" className="fill-brand-500" />
      <path d="M17 8h5.5A1.5 1.5 0 0 1 24 9.5v13a1.5 1.5 0 0 1-1.5 1.5H17V8Z" className="fill-accent-500" />
    </svg>
  );
}
