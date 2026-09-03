import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ListOrdered, Pencil, Trash2 } from "lucide-react";
import { useDeleteListing, useListings, useUpdateListing } from "@/hooks/useAdminData";
import { formatDateTime, formatPrice } from "@/lib/format";
import { rowKey, summariseIds, toHexId } from "@/lib/objectId";
import { cn } from "@/lib/cn";
import {
  EXAM_SLOT_ROWS, LISTING_CATEGORIES, LISTING_STATUSES, LISTING_TYPES,
  type ExamSlot, type ListingRecord,
} from "@/types";
import {
  LISTING_CATEGORY_LABELS, LISTING_STATUS_LABELS, LISTING_TYPE_LABELS,
} from "@/constants/labels";
import { Button } from "@/components/ui/Button";
import { ListingStatusBadge, ListingTypeBadge } from "@/components/ui/Badge";
import { ConfirmDialog, Modal } from "@/components/ui/Modal";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { IdCell } from "@/components/ui/IdCell";
import { IdWarningBanner } from "@/components/ui/IdWarningBanner";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { PageHeader } from "@/components/ui/PageHeader";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";

type Scope = "all" | "available" | "sold";

/**
 * AdminService.updateListing copies these eight fields off the body with no null
 * checks, so all eight must be present or the record gets nulled out.
 */
const schema = z
  .object({
    title: z.string().trim().min(1, "Title is required"),
    subject: z.string(),
    description: z.string().trim().min(1, "Description is required"),
    category: z.enum(LISTING_CATEGORIES),
    type: z.enum(LISTING_TYPES),
    status: z.enum(LISTING_STATUSES),
    price: z
      .string()
      .trim()
      .min(1, "Price is required")
      .refine(
        (value) => !Number.isNaN(Number(value)),
        "Enter a number",
      )
      .refine(
        (value) => Number(value) >= 0,
        "Price cannot be negative",
      ),
  })
  .superRefine((values, ctx) => {
    if (values.category !== "CALCULATOR" && !values.subject.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["subject"],
        message: "Subject is required",
      });
    }
  });

type FormValues = z.infer<typeof schema>;

function EditListingModal({ listing, listingId, onClose }: {
  listing: ListingRecord; listingId: string; onClose: () => void;
}) {
  const updateListing = useUpdateListing();
  const [slots, setSlots] = useState<ExamSlot[]>(listing.unavailableExamSlots ?? []);

  const {
  register,
  handleSubmit,
  watch,
  reset,
  setValue,
  formState: { errors },
} = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: listing.title ?? "",
      subject: listing.subject ?? "",
      description: listing.description ?? "",
      category: listing.category ?? "BOOK",
      type: listing.type ?? "SALE",
      status: listing.status ?? "AVAILABLE",
      price: listing.price !== null && listing.price !== undefined ? String(listing.price) : "",
    },
  });

  useEffect(() => {
    reset({
      title: listing.title ?? "",
      subject: listing.subject ?? "",
      description: listing.description ?? "",
      category: listing.category ?? "BOOK",
      type: listing.type ?? "SALE",
      status: listing.status ?? "AVAILABLE",
      price: listing.price !== null && listing.price !== undefined ? String(listing.price) : "",
    });
    setSlots(listing.unavailableExamSlots ?? []);
  }, [listing, reset]);

const selectedType = watch("type");
const selectedCategory = watch("category");

useEffect(() => {
  if (selectedCategory === "CALCULATOR") {
    setValue("subject", "");
  }
}, [selectedCategory, setValue]);



  const submit = handleSubmit((values) => {
    updateListing.mutate(
      {
        listingId,
        listing: {
          title: values.title.trim(),
          subject:
            values.category === "CALCULATOR"
            ? null
            : values.subject.trim(),
          description: values.description.trim(),
          category: values.category,
          type: values.type,
          status: values.status,
          price: Number(values.price),
          // The public flow clears slots for SALE; mirror that here.
          unavailableExamSlots: values.type === "RENT" ? slots : [],
        },
      },
      { onSuccess: onClose },
    );
  });

  const toggleSlot = (slot: ExamSlot) => {
    const next = new Set(slots);
    if (next.has(slot)) next.delete(slot);
    else next.add(slot);
    setSlots(EXAM_SLOT_ROWS.flat().filter((item) => next.has(item)));
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Edit listing"
      description="Changes apply immediately to the student marketplace."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={updateListing.isPending}>Cancel</Button>
          <Button onClick={submit} isLoading={updateListing.isPending}>Save changes</Button>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-4 pb-1">
        <Field label="Title" required error={errors.title?.message}>
          {(props) => <Input {...props} {...register("title")} maxLength={200} />}
        </Field>

     <div className="grid gap-4 sm:grid-cols-2">
  {selectedCategory !== "CALCULATOR" && (
    <Field
      label="Subject"
      required
      error={errors.subject?.message}
    >
      {(props) => (
        <Input
          {...props}
          {...register("subject")}
          maxLength={120}
        />
      )}
    </Field>
  )}

  <Field label="Price (INR)" required error={errors.price?.message}>
    {(props) => (
      <Input
        {...props}
        {...register("price")}
        type="number"
        min={0}
        step="1"
        inputMode="decimal"
      />
    )}
  </Field>
</div>

        <Field label="Description" required error={errors.description?.message}>
          {(props) => <Textarea {...props} {...register("description")} rows={4} maxLength={3000} />}
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Category" required error={errors.category?.message}>
            {(props) => (
              <Select {...props} {...register("category")}>
                {LISTING_CATEGORIES.map((value) => (
                  <option key={value} value={value}>{LISTING_CATEGORY_LABELS[value]}</option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Type" required error={errors.type?.message}>
            {(props) => (
              <Select {...props} {...register("type")}>
                {LISTING_TYPES.map((value) => (
                  <option key={value} value={value}>{LISTING_TYPE_LABELS[value]}</option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Status" required error={errors.status?.message}
            hint="Admins can move a listing back to available.">
            {(props) => (
              <Select {...props} {...register("status")}>
                {LISTING_STATUSES.map((value) => (
                  <option key={value} value={value}>{LISTING_STATUS_LABELS[value]}</option>
                ))}
              </Select>
            )}
          </Field>
        </div>

        {selectedType === "RENT" && (
          <div>
            <p className="mb-2 text-[13px] font-semibold text-ink">Unavailable exam slots</p>
            <div role="group" aria-label="Unavailable exam slots" className="flex flex-wrap gap-1.5">
              {EXAM_SLOT_ROWS.flat().map((slot) => {
                const selected = slots.includes(slot);
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => toggleSlot(slot)}
                    aria-pressed={selected}
                    className={cn(
                      "rounded-md border px-2.5 py-1.5 font-mono text-xs font-semibold transition-colors",
                      selected
                        ? "border-shell-900 bg-shell-900 text-white"
                        : "border-line-strong bg-white text-ink-muted hover:bg-canvas-sunken",
                    )}
                  >
                    {slot}
                    <span className="sr-only">{selected ? " selected" : " not selected"}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="rounded-lg bg-canvas-sunken px-3.5 py-3 text-xs leading-relaxed text-ink-muted">
          The photo, seller and creation date can't be changed here — the update endpoint
          doesn't accept them and leaves them untouched.
        </div>
      </form>
    </Modal>
  );
}

export default function ListingsPage() {
  const [scope, setScope] = useState<Scope>("all");
  const { data, isPending, isError, error, refetch } = useListings(scope);
  const deleteListing = useDeleteListing();

  const [editing, setEditing] = useState<{ listing: ListingRecord; id: string } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ listing: ListingRecord; id: string } | null>(null);

  const rows = useMemo(() => data ?? [], [data]);
  const idSummary = summariseIds(rows, (listing) => listing.id);

  const columns: ReadonlyArray<Column<ListingRecord>> = [
    {
      key: "title",
      header: "Listing",
      sortValue: (listing) => listing.title ?? "",
      render: (listing) => (
        <div className="flex min-w-0 items-center gap-2.5">
          {listing.imageUrl ? (
            <img src={listing.imageUrl} alt="" loading="lazy"
              className="h-10 w-8 shrink-0 rounded object-cover ring-1 ring-line" />
          ) : (
            <div aria-hidden className="h-10 w-8 shrink-0 rounded bg-canvas-sunken ring-1 ring-line" />
          )}
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{listing.title || "—"}</p>
            <p className="truncate text-xs text-ink-soft">{listing.subject || "no subject"}</p>
          </div>
        </div>
      ),
    },
    {
      key: "price",
      header: "Price",
      sortValue: (listing) => listing.price ?? null,
      render: (listing) => <span className="whitespace-nowrap tabular-nums font-medium">{formatPrice(listing.price)}</span>,
    },
    {
      key: "type",
      header: "Type",
      sortValue: (listing) => listing.type ?? "",
      render: (listing) => <ListingTypeBadge type={listing.type} />,
    },
    {
      key: "status",
      header: "Status",
      sortValue: (listing) => listing.status ?? "",
      render: (listing) => <ListingStatusBadge status={listing.status} />,
    },
    {
      key: "category",
      header: "Category",
      secondary: true,
      sortValue: (listing) => listing.category ?? "",
      render: (listing) => (
        <span className="text-xs text-ink-muted">
          {listing.category ? LISTING_CATEGORY_LABELS[listing.category] : "—"}
        </span>
      ),
    },
    {
      key: "created",
      header: "Created",
      secondary: true,
      sortValue: (listing) => listing.createdAt ?? "",
      render: (listing) => <span className="whitespace-nowrap text-xs text-ink-muted">{formatDateTime(listing.createdAt)}</span>,
    },
    {
      key: "id",
      header: "ID",
      secondary: true,
      render: (listing) => <IdCell value={listing.id} />,
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      className: "text-right",
      render: (listing) => {
        const id = toHexId(listing.id);
        if (!id) {
          return <span className="text-xs text-ink-soft" title="No usable id was returned for this record">unavailable</span>;
        }
        return (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="xs" onClick={() => setEditing({ listing, id })}
              aria-label={`Edit ${listing.title ?? "listing"}`}>
              <Pencil className="h-3.5 w-3.5" aria-hidden />
            </Button>
            <Button variant="ghost" size="xs" className="text-bad-600 hover:bg-bad-50"
              onClick={() => setPendingDelete({ listing, id })}
              aria-label={`Delete ${listing.title ?? "listing"}`}>
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
        <PageHeader title="Listings" />
        <ErrorState error={error} onRetry={() => void refetch()} />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Listings" description="Every listing on the marketplace, whatever its status." />

      {idSummary.total > 0 && (
        <div className="mb-4">
          <IdWarningBanner resource="listings" usable={idSummary.usable} total={idSummary.total} />
        </div>
      )}

      <DataTable
        caption="Marketplace listings"
        rows={rows}
        columns={columns}
        rowKey={(listing, index) => rowKey(listing.id, index)}
        isLoading={isPending}
        searchText={(listing) => [listing.title, listing.subject, listing.description].filter(Boolean).join(" ")}
        searchPlaceholder="Search title, subject or description…"
        toolbar={
          <div className="flex gap-1.5" role="group" aria-label="Filter by status">
            {([
              { value: "all", label: "All" },
              { value: "available", label: "Available" },
              { value: "sold", label: "Sold" },
            ] as const).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setScope(option.value)}
                aria-pressed={scope === option.value}
                className={cn(
                  "rounded-lg border px-2.5 py-1.5 text-[13px] font-semibold transition-colors",
                  scope === option.value
                    ? "border-shell-900 bg-shell-900 text-white"
                    : "border-line-strong bg-white text-ink-muted hover:bg-canvas-sunken",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        }
        empty={
          <EmptyState
            icon={<ListOrdered className="h-5 w-5" aria-hidden />}
            title={scope === "all" ? "No listings yet" : `No ${scope} listings`}
          />
        }
      />

      {editing && (
        <EditListingModal listing={editing.listing} listingId={editing.id} onClose={() => setEditing(null)} />
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          deleteListing.mutate(pendingDelete.id, { onSettled: () => setPendingDelete(null) });
        }}
        title="Delete this listing?"
        description="It will also be removed from every student's wishlist. This cannot be undone."
        confirmLabel="Delete listing"
        confirmVariant="danger"
        isLoading={deleteListing.isPending}
      >
        {pendingDelete && (
          <p className="pb-1 text-sm font-semibold text-ink">{pendingDelete.listing.title}</p>
        )}
      </ConfirmDialog>
    </>
  );
}
