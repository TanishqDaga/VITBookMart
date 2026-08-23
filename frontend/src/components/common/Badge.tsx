import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "brand" | "accent" | "positive" | "danger" | "muted";

const TONES: Record<Tone, string> = {
  neutral: "bg-white/90 text-ink ring-1 ring-line",
  brand: "bg-brand-50 text-brand-700 ring-1 ring-brand-100",
  accent: "bg-accent-500/10 text-accent-600 ring-1 ring-accent-500/20",
  positive: "bg-positive-50 text-positive-700 ring-1 ring-positive-600/20",
  danger: "bg-danger-50 text-danger-700 ring-1 ring-danger-600/20",
  muted: "bg-ink/80 text-white",
};

interface BadgeProps {
  tone?: Tone;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}

export function Badge({ tone = "neutral", children, className, icon }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1",
        "text-[11px] font-semibold uppercase tracking-wide",
        TONES[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
