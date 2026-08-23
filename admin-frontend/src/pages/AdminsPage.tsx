import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Info, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useAdmins, useCreateAdmin, useDeleteAdmin, useUpdateAdminUsername } from "@/hooks/useAdminData";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { errorMessage } from "@/api/errors";
import { formatDateTime } from "@/lib/format";
import { rowKey, summariseIds, toHexId } from "@/lib/objectId";
import type { AdminRecord } from "@/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog, Modal } from "@/components/ui/Modal";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { IdCell } from "@/components/ui/IdCell";
import { IdWarningBanner } from "@/components/ui/IdWarningBanner";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { PageHeader } from "@/components/ui/PageHeader";
import { Field, Input } from "@/components/ui/Input";

/** CreateAdminRequest: username and password are both @NotBlank. No other rules server-side. */
const createSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  // The backend sets no minimum. Eight characters is a portal-side floor for a
  // credential that grants full data access; it never conflicts with the API.
  password: z.string().min(8, "Use at least 8 characters"),
});

const renameSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
});

function CreateAdminModal({ onClose }: { onClose: () => void }) {
  const createAdmin = useCreateAdmin();
  const [failure, setFailure] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof createSchema>>({
    resolver: zodResolver(createSchema),
    defaultValues: { username: "", password: "" },
  });

  const submit = handleSubmit((values) => {
    setFailure(null);
    createAdmin.mutate(values, {
      onSuccess: onClose,
      onError: (error) => setFailure(errorMessage(error)),
    });
  });

  return (
    <Modal
      open
      onClose={onClose}
      title="Add admin"
      description="The new account gets full access to every admin endpoint."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={createAdmin.isPending}>Cancel</Button>
          <Button onClick={submit} isLoading={createAdmin.isPending}>Create admin</Button>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-4 pb-1">
        {failure && (
          <div role="alert" className="rounded-lg bg-bad-50 px-3.5 py-2.5 text-[13px] font-medium text-bad-700">
            {failure}
          </div>
        )}

        <Field label="Username" required error={errors.username?.message}>
          {(props) => <Input {...props} {...register("username")} autoComplete="off" spellCheck={false} />}
        </Field>

        <Field label="Password" required error={errors.password?.message}
          hint="Share it through a secure channel — the API can't show it again or reset it.">
          {(props) => <Input {...props} {...register("password")} type="password" autoComplete="new-password" />}
        </Field>

        <div className="flex items-start gap-2 rounded-lg bg-canvas-sunken px-3.5 py-3">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-soft" aria-hidden />
          <p className="text-xs leading-relaxed text-ink-muted">
            There's no password reset or deactivation endpoint. If this password is lost, the
            account has to be deleted and recreated.
          </p>
        </div>
      </form>
    </Modal>
  );
}

function RenameAdminModal({ admin, adminId, onClose }: {
  admin: AdminRecord; adminId: string; onClose: () => void;
}) {
  const updateUsername = useUpdateAdminUsername();
  const [failure, setFailure] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof renameSchema>>({
    resolver: zodResolver(renameSchema),
    defaultValues: { username: admin.username ?? "" },
  });

  const submit = handleSubmit((values) => {
    setFailure(null);
    updateUsername.mutate(
      { adminId, username: values.username.trim() },
      { onSuccess: onClose, onError: (error) => setFailure(errorMessage(error)) },
    );
  });

  return (
    <Modal
      open
      onClose={onClose}
      title="Rename admin"
      description="Username is the only field this endpoint can change."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={updateUsername.isPending}>Cancel</Button>
          <Button onClick={submit} isLoading={updateUsername.isPending}>Save</Button>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-4 pb-1">
        {failure && (
          <div role="alert" className="rounded-lg bg-bad-50 px-3.5 py-2.5 text-[13px] font-medium text-bad-700">
            {failure}
          </div>
        )}
        <Field label="Username" required error={errors.username?.message}>
          {(props) => <Input {...props} {...register("username")} autoComplete="off" spellCheck={false} />}
        </Field>
      </form>
    </Modal>
  );
}

export default function AdminsPage() {
  const { data, isPending, isError, error, refetch } = useAdmins();
  const { identity } = useAdminAuth();
  const deleteAdmin = useDeleteAdmin();

  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState<{ admin: AdminRecord; id: string } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ admin: AdminRecord; id: string } | null>(null);

  const rows = data ?? [];
  const idSummary = summariseIds(rows, (admin) => admin.id);

  const columns: ReadonlyArray<Column<AdminRecord>> = [
    {
      key: "username",
      header: "Username",
      sortValue: (admin) => admin.username ?? "",
      render: (admin) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-ink">{admin.username || "—"}</span>
          {identity?.username === admin.username && <Badge tone="key">You</Badge>}
        </div>
      ),
    },
    {
      key: "active",
      header: "State",
      sortValue: (admin) => (admin.active ? 1 : 0),
      render: (admin) =>
        admin.active ? <Badge tone="ok">active</Badge> : <Badge tone="bad">inactive</Badge>,
    },
    {
      key: "role",
      header: "Role",
      secondary: true,
      render: (admin) => <span className="font-mono text-xs text-ink-muted">{admin.role ?? "—"}</span>,
    },
    {
      key: "created",
      header: "Created",
      secondary: true,
      sortValue: (admin) => admin.createdAt ?? "",
      render: (admin) => <span className="whitespace-nowrap text-xs text-ink-muted">{formatDateTime(admin.createdAt)}</span>,
    },
    {
      key: "id",
      header: "ID",
      secondary: true,
      render: (admin) => <IdCell value={admin.id} />,
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      className: "text-right",
      render: (admin) => {
        const id = toHexId(admin.id);
        if (!id) {
          return <span className="text-xs text-ink-soft" title="No usable id was returned for this record">unavailable</span>;
        }
        const isSelf = identity?.username === admin.username;

        return (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="xs" onClick={() => setRenaming({ admin, id })}
              aria-label={`Rename ${admin.username ?? "admin"}`}>
              <Pencil className="h-3.5 w-3.5" aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="xs"
              className="text-bad-600 hover:bg-bad-50"
              disabled={isSelf}
              title={isSelf ? "You can't delete the account you're signed in with" : undefined}
              onClick={() => setPendingDelete({ admin, id })}
              aria-label={`Delete ${admin.username ?? "admin"}`}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
            </Button>
          </div>
        );
      },
    },
  ];

  if (isError && !data) {
    return (
      <>
        <PageHeader title="Admins" />
        <ErrorState error={error} onRetry={() => void refetch()} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Admins"
        description="Staff accounts with access to this console."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Add admin
          </Button>
        }
      />

      {idSummary.total > 0 && (
        <div className="mb-4">
          <IdWarningBanner resource="admins" usable={idSummary.usable} total={idSummary.total} />
        </div>
      )}

      <DataTable
        caption="Admin accounts"
        rows={rows}
        columns={columns}
        rowKey={(admin, index) => rowKey(admin.id, index)}
        isLoading={isPending}
        searchText={(admin) => admin.username ?? ""}
        searchPlaceholder="Search username…"
        pageSize={15}
        empty={
          <EmptyState
            icon={<ShieldCheck className="h-5 w-5" aria-hidden />}
            title="No admin accounts"
            description="Creating an admin itself requires an admin token, so the first account has to be seeded directly in MongoDB."
          />
        }
      />

      {creating && <CreateAdminModal onClose={() => setCreating(false)} />}
      {renaming && (
        <RenameAdminModal admin={renaming.admin} adminId={renaming.id} onClose={() => setRenaming(null)} />
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          deleteAdmin.mutate(pendingDelete.id, { onSettled: () => setPendingDelete(null) });
        }}
        title="Delete this admin?"
        description="They lose access as soon as their current access token expires, and immediately on their next refresh."
        confirmLabel="Delete admin"
        confirmVariant="danger"
        isLoading={deleteAdmin.isPending}
      >
        {pendingDelete && (
          <p className="pb-1 text-sm font-semibold text-ink">{pendingDelete.admin.username}</p>
        )}
      </ConfirmDialog>
    </>
  );
}
