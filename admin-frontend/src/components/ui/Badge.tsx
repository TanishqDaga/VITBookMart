import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { ListingStatus, ListingType, UserStatus } from "@/types";

type Tone = "neutral" | "key" | "ok" | "warn" | "bad" | "info";

const TONES: Record<Tone, string> = {
  neutral: "bg-canvas-sunken text-ink-muted ring-line",
  key: "bg-key-50 text-key-700 ring-key-200",
  ok: "bg-ok-50 text-ok-700 ring-ok-100",
  warn: "bg-warn-50 text-warn-700 ring-warn-600/20",
  bad: "bg-bad-50 text-bad-700 ring-bad-100",
  info: "bg-info-50 text-info-700 ring-info-100",
};

export function Badge({ tone = "neutral", children, className }: {
  tone?: Tone; children: ReactNode; className?: string;
}) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1",
      TONES[tone], className,
    )}>
      {children}
    </span>
  );
}

const USER_TONES: Record<UserStatus, Tone> = { FREE: "neutral", PAID: "ok", TERMINATED: "bad" };
const LISTING_TONES: Record<ListingStatus, Tone> = { AVAILABLE: "ok", SOLD: "neutral" };
const TYPE_TONES: Record<ListingType, Tone> = { SALE: "info", RENT: "key" };

/** Status is never signalled by colour alone — the label always carries the meaning. */
export function UserStatusBadge({ status }: { status: UserStatus | null }) {
  if (!status) return <span className="text-xs text-ink-soft">—</span>;
  return <Badge tone={USER_TONES[status]}>{status.toLowerCase()}</Badge>;
}

export function ListingStatusBadge({ status }: { status: ListingStatus | null }) {
  if (!status) return <span className="text-xs text-ink-soft">—</span>;
  return <Badge tone={LISTING_TONES[status]}>{status.toLowerCase()}</Badge>;
}

export function ListingTypeBadge({ type }: { type: ListingType | null }) {
  if (!type) return <span className="text-xs text-ink-soft">—</span>;
  return <Badge tone={TYPE_TONES[type]}>{type.toLowerCase()}</Badge>;
}
