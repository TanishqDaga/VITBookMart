import { useMemo, useState } from "react";
import { CircleSlash, MoreHorizontal, Trash2, UserCheck, UserMinus, Users } from "lucide-react";
import { useDeleteUser, useSetUserStatus, useUsers } from "@/hooks/useAdminData";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { formatDateTime } from "@/lib/format";
import { rowKey, summariseIds, toHexId } from "@/lib/objectId";
import { USER_STATUSES, type UserRecord, type UserStatus } from "@/types";
import { USER_STATUS_LABELS } from "@/constants/labels";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { UserStatusBadge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/Modal";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { IdCell } from "@/components/ui/IdCell";
import { IdWarningBanner } from "@/components/ui/IdWarningBanner";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { PageHeader } from "@/components/ui/PageHeader";

type StatusFilter = "ALL" | UserStatus;

interface PendingAction {
  user: UserRecord;
  userId: string;
  kind: "status" | "delete";
  status?: UserStatus;
}

function hostelOf(user: UserRecord): string {
  const parts = [user.hostel?.type, user.hostel?.block, user.hostel?.room]
    .filter((part): part is string => Boolean(part?.trim()));
  return parts.length ? parts.join(" · ") : "—";
}

export default function UsersPage() {
  const { data, isPending, isError, error, refetch } = useUsers();
  const { identity } = useAdminAuth();
  const setStatus = useSetUserStatus();
  const deleteUser = useDeleteUser();

  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const rows = useMemo(() => {
    const all = data ?? [];
    return filter === "ALL" ? all : all.filter((user) => user.status === filter);
  }, [data, filter]);

  const idSummary = summariseIds(data, (user) => user.id);

  const columns: ReadonlyArray<Column<UserRecord>> = [
    {
      key: "name",
      header: "User",
      sortValue: (user) => user.name ?? "",
      render: (user) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{user.name || "—"}</p>
          <p className="truncate text-xs text-ink-soft">{user.email || "no email"}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (user) => user.status ?? "",
      render: (user) => <UserStatusBadge status={user.status} />,
    },
    {
      key: "whatsapp",
      header: "WhatsApp",
      secondary: true,
      render: (user) =>
        user.whatsappNumber ? (
          <span className="font-mono text-xs text-ink-muted">+91 {user.whatsappNumber}</span>
        ) : (
          <span className="text-xs text-ink-soft">not set</span>
        ),
    },
    {
      key: "hostel",
      header: "Hostel",
      secondary: true,
      render: (user) => <span className="text-xs text-ink-muted">{hostelOf(user)}</span>,
    },
    {
      key: "created",
      header: "Joined",
      secondary: true,
      sortValue: (user) => user.createdAt ?? "",
      render: (user) => <span className="whitespace-nowrap text-xs text-ink-muted">{formatDateTime(user.createdAt)}</span>,
    },
    {
      key: "id",
      header: "ID",
      secondary: true,
      render: (user) => <IdCell value={user.id} />,
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      className: "text-right",
      render: (user) => {
        const userId = toHexId(user.id);
        const key = rowKey(user.id, 0);

        if (!userId) {
          return (
            <span className="text-xs text-ink-soft" title="No usable id was returned for this record">
              unavailable
            </span>
          );
        }

        return (
          <div className="relative inline-block text-left">
            <Button
              variant="ghost"
              size="xs"
              aria-label={`Actions for ${user.name || user.email || "user"}`}
              aria-expanded={openMenu === key}
              onClick={() => setOpenMenu(openMenu === key ? null : key)}
            >
              <MoreHorizontal className="h-4 w-4" aria-hidden />
            </Button>

            {openMenu === key && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} aria-hidden />
                <div role="menu" className="absolute right-0 z-20 mt-1 w-52 animate-scale-in overflow-hidden rounded-lg border border-line bg-white py-1 shadow-pop">
                  {USER_STATUSES.filter((status) => status !== user.status).map((status) => (
                    <button
                      key={status}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setOpenMenu(null);
                        setPending({ user, userId, kind: "status", status });
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-medium transition-colors hover:bg-canvas-sunken",
                        status === "TERMINATED" ? "text-bad-600" : "text-ink",
                      )}
                    >
                      {status === "PAID" && <UserCheck className="h-3.5 w-3.5" aria-hidden />}
                      {status === "FREE" && <UserMinus className="h-3.5 w-3.5" aria-hidden />}
                      {status === "TERMINATED" && <CircleSlash className="h-3.5 w-3.5" aria-hidden />}
                      Set to {USER_STATUS_LABELS[status].toLowerCase()}
                    </button>
                  ))}

                  <div className="my-1 h-px bg-line" />

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpenMenu(null);
                      setPending({ user, userId, kind: "delete" });
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-medium text-bad-600 transition-colors hover:bg-bad-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    Delete user
                  </button>
                </div>
              </>
            )}
          </div>
        );
      },
    },
  ];

  if (isError && !data) {
    return (
      <>
        <PageHeader title="Users" />
        <ErrorState error={error} onRetry={() => void refetch()} />
      </>
    );
  }

  const isDeleting = pending?.kind === "delete";

  return (
    <>
      <PageHeader
        title="Users"
        description="Every registered student account. Status controls marketplace access."
      />

      {idSummary.total > 0 && (
        <div className="mb-4">
          <IdWarningBanner resource="users" usable={idSummary.usable} total={idSummary.total} />
        </div>
      )}

      <DataTable
        caption="Registered users"
        rows={rows}
        columns={columns}
        rowKey={(user, index) => rowKey(user.id, index)}
        isLoading={isPending}
        searchText={(user) =>
          [user.name, user.email, user.whatsappNumber, user.hostel?.block].filter(Boolean).join(" ")
        }
        searchPlaceholder="Search name, email or number…"
        toolbar={
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
            {(["ALL", ...USER_STATUSES] as StatusFilter[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                aria-pressed={filter === value}
                className={cn(
                  "rounded-lg border px-2.5 py-1.5 text-[13px] font-semibold transition-colors",
                  filter === value
                    ? "border-shell-900 bg-shell-900 text-white"
                    : "border-line-strong bg-white text-ink-muted hover:bg-canvas-sunken",
                )}
              >
                {value === "ALL" ? "All" : USER_STATUS_LABELS[value]}
                {data && (
                  <span className="ml-1.5 tabular-nums opacity-70">
                    {value === "ALL" ? data.length : data.filter((user) => user.status === value).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        }
        empty={
          <EmptyState
            icon={<Users className="h-5 w-5" aria-hidden />}
            title={filter === "ALL" ? "No users yet" : `No ${USER_STATUS_LABELS[filter as UserStatus].toLowerCase()} users`}
            description={filter === "ALL" ? "Accounts appear here after a student signs in with Google." : undefined}
          />
        }
      />

      <ConfirmDialog
        open={pending !== null}
        onClose={() => setPending(null)}
        onConfirm={() => {
          if (!pending) return;
          if (pending.kind === "delete") {
            deleteUser.mutate(pending.userId, { onSettled: () => setPending(null) });
          } else if (pending.status) {
            setStatus.mutate(
              { userId: pending.userId, status: pending.status },
              { onSettled: () => setPending(null) },
            );
          }
        }}
        title={isDeleting ? "Delete this user?" : `Set status to ${pending?.status ? USER_STATUS_LABELS[pending.status].toLowerCase() : ""}?`}
        description={
          isDeleting
            ? "This also deletes all of their listings and removes those listings from every wishlist. It cannot be undone."
            : pending?.status === "TERMINATED"
              ? "A terminated user is blocked from signing in and from refreshing an existing session."
              : undefined
        }
        confirmLabel={isDeleting ? "Delete user" : "Confirm"}
        confirmVariant={isDeleting || pending?.status === "TERMINATED" ? "danger" : "primary"}
        isLoading={deleteUser.isPending || setStatus.isPending}
      >
        {pending && (
          <div className="space-y-1 pb-1">
            <p className="text-sm font-semibold text-ink">{pending.user.name || "Unnamed user"}</p>
            <p className="text-xs text-ink-muted">{pending.user.email}</p>
            {identity && pending.kind === "delete" && (
              <p className="pt-2 text-xs text-ink-soft">
                Signed in as {identity.username}. This action is logged against the backend, not this portal.
              </p>
            )}
          </div>
        )}
      </ConfirmDialog>
    </>
  );
}
