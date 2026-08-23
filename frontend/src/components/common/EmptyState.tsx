import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  /** Softer treatment when the empty state sits inside a card. */
  inset?: boolean;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  inset,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl px-6 text-center",
        inset ? "py-10" : "border border-dashed border-line-strong bg-white py-14",
        className,
      )}
    >
      <div
        aria-hidden
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600"
      >
        {icon}
      </div>
      <h3 className="text-base font-bold text-ink">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-muted">{description}</p>
      )}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}
