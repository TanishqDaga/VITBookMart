import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, BadgeCheck, BookOpen, CircleSlash, IndianRupee, ListOrdered, ShieldCheck, Users,
} from "lucide-react";
import { useAdmins, useListings, useUsers } from "@/hooks/useAdminData";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/ui/PageHeader";
import { ErrorState, Skeleton } from "@/components/ui/States";
import { LISTING_CATEGORY_LABELS } from "@/constants/labels";
import { LISTING_CATEGORIES } from "@/types";

/**
 * The backend exposes no statistics endpoint, so every number here is derived
 * client-side from the three list endpoints the portal already loads. Nothing is
 * estimated — each figure is a count over data actually received.
 */
function StatCard({ label, value, icon, hint, tone = "neutral", isLoading }: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  hint?: string;
  tone?: "neutral" | "ok" | "bad" | "key";
  isLoading?: boolean;
}) {
  const tones = {
    neutral: "bg-canvas-sunken text-ink-muted",
    ok: "bg-ok-50 text-ok-700",
    bad: "bg-bad-50 text-bad-700",
    key: "bg-key-50 text-key-700",
  } as const;

  return (
    <div className="rounded-xl border border-line bg-white p-4 shadow-panel">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-ink-muted">{label}</p>
        <span aria-hidden className={cn("flex h-8 w-8 items-center justify-center rounded-lg", tones[tone])}>
          {icon}
        </span>
      </div>
      {isLoading ? (
        <Skeleton className="mt-3 h-7 w-20" />
      ) : (
        <p className="mt-2 text-2xl font-bold tracking-tight tabular-nums">{value}</p>
      )}
      {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const users = useUsers();
  const listings = useListings("all");
  const admins = useAdmins();

  const stats = useMemo(() => {
    const userRows = users.data ?? [];
    const listingRows = listings.data ?? [];

    const byUserStatus = {
      FREE: userRows.filter((row) => row.status === "FREE").length,
      PAID: userRows.filter((row) => row.status === "PAID").length,
      TERMINATED: userRows.filter((row) => row.status === "TERMINATED").length,
    };

    const available = listingRows.filter((row) => row.status === "AVAILABLE");
    const sold = listingRows.filter((row) => row.status === "SOLD");

    const prices = available.map((row) => row.price).filter((price): price is number => typeof price === "number");
    const medianPrice = prices.length
      ? [...prices].sort((a, b) => a - b)[Math.floor(prices.length / 2)]
      : null;

    const byCategory = LISTING_CATEGORIES.map((category) => ({
      category,
      count: listingRows.filter((row) => row.category === category).length,
    }));

    const incompleteProfiles = userRows.filter(
      (row) => !row.whatsappNumber?.trim() || !row.hostel?.type?.trim() || !row.hostel?.block?.trim() || !row.hostel?.room?.trim(),
    ).length;

    return {
      users: userRows.length,
      byUserStatus,
      listings: listingRows.length,
      available: available.length,
      sold: sold.length,
      medianPrice,
      byCategory,
      maxCategory: Math.max(1, ...byCategory.map((item) => item.count)),
      incompleteProfiles,
      admins: admins.data?.length ?? 0,
    };
  }, [users.data, listings.data, admins.data]);

  const anyError = users.error ?? listings.error ?? admins.error;
  const loading = users.isPending || listings.isPending;

  if (anyError && !users.data && !listings.data) {
    return (
      <>
        <PageHeader title="Overview" />
        <ErrorState
          error={anyError}
          onRetry={() => {
            void users.refetch();
            void listings.refetch();
            void admins.refetch();
          }}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Overview" description="Live counts across users, listings and staff accounts." />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Users" value={stats.users.toLocaleString("en-IN")} icon={<Users className="h-4 w-4" />}
          hint={`${stats.byUserStatus.PAID} paid · ${stats.byUserStatus.FREE} free`} isLoading={loading} />
        <StatCard label="Terminated users" value={stats.byUserStatus.TERMINATED} tone={stats.byUserStatus.TERMINATED > 0 ? "bad" : "neutral"}
          icon={<CircleSlash className="h-4 w-4" />} hint="Blocked from signing in" isLoading={loading} />
        <StatCard label="Listings" value={stats.listings.toLocaleString("en-IN")} icon={<ListOrdered className="h-4 w-4" />}
          hint={`${stats.available} available · ${stats.sold} sold`} isLoading={loading} />
        <StatCard label="Admins" value={stats.admins} tone="key" icon={<ShieldCheck className="h-4 w-4" />}
          hint="Accounts with full access" isLoading={admins.isPending} />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <div className="rounded-xl border border-line bg-white p-5 shadow-panel lg:col-span-2">
          <h2 className="text-sm font-bold">Listings by category</h2>
          <p className="mt-1 text-xs text-ink-soft">Across every listing, sold and available.</p>

          <ul className="mt-4 space-y-3">
            {stats.byCategory.map(({ category, count }) => (
              <li key={category}>
                <div className="flex items-baseline justify-between gap-3 text-[13px]">
                  <span className="font-medium text-ink">{LISTING_CATEGORY_LABELS[category]}</span>
                  <span className="tabular-nums font-semibold text-ink-muted">{count}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-canvas-sunken">
                  <div
                    className="h-full rounded-full bg-shell-700 transition-[width] duration-500"
                    style={{ width: `${(count / stats.maxCategory) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <StatCard label="Median available price" value={stats.medianPrice === null ? "—" : formatPrice(stats.medianPrice)}
            icon={<IndianRupee className="h-4 w-4" />} hint="Across available listings" isLoading={loading} />
          <StatCard label="Incomplete profiles" value={stats.incompleteProfiles}
            tone={stats.incompleteProfiles > 0 ? "key" : "ok"} icon={<BadgeCheck className="h-4 w-4" />}
            hint="Can't post listings yet" isLoading={loading} />
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {[
          { to: "/users", label: "Manage users", icon: Users, body: "Change plan status, terminate or delete accounts." },
          { to: "/listings", label: "Manage listings", icon: BookOpen, body: "Edit or remove any listing on the marketplace." },
          { to: "/admins", label: "Manage admins", icon: ShieldCheck, body: "Add staff accounts and rename existing ones." },
        ].map(({ to, label, icon: Icon, body }) => (
          <Link key={to} to={to}
            className="group rounded-xl border border-line bg-white p-4 shadow-panel transition-colors hover:border-line-strong hover:bg-canvas-muted">
            <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-lg bg-canvas-sunken text-ink-muted">
              <Icon className="h-4 w-4" />
            </span>
            <p className="mt-3 flex items-center gap-1.5 text-sm font-bold text-ink">
              {label}
              <ArrowRight aria-hidden className="h-3.5 w-3.5 text-ink-soft transition-transform group-hover:translate-x-0.5" />
            </p>
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">{body}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
