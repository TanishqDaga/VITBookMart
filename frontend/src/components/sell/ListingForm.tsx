import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Info } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  LISTING_CATEGORIES,
  LISTING_TYPES,
  type CreateListingRequest,
  type ExamSlot,
  type ListingCategory,
  type ListingType,
} from "@/types";
import { CATEGORY_DESCRIPTIONS, CATEGORY_LABELS, TYPE_LABELS } from "@/constants/labels";
import { Button } from "@/components/common/Button";
import { Field } from "@/components/common/Field";
import { Input, Textarea } from "@/components/common/Input";
import { CategoryIcon } from "@/components/listings/CategoryIcon";
import { ExamSlotPicker } from "./ExamSlotPicker";
import { ImageUploader } from "./ImageUploader";

/**
 * Validation mirrors the backend, no stricter.
 *
 * CreateListingRequest: title/description/subject are @NotBlank, category/type/price
 * are @NotNull, price is @DecimalMin("0.0"). The backend sets no maximum lengths,
 * so neither do we — the maxLength attributes below are input guardrails only.
 */
const schema = z
  .object({
    title: z.string().trim().min(1, "Title is required"),
    subject: z.string(),
    description: z.string().trim().min(1, "Description is required"),
    category: z.enum(LISTING_CATEGORIES, {
      required_error: "Category is required",
    }),
    type: z.enum(LISTING_TYPES, {
      required_error: "Listing type is required",
    }),
    price: z
      .string()
      .trim()
      .min(1, "Price is required")
      .refine((value) => !Number.isNaN(Number(value)), "Enter a number")
      .refine((value) => Number(value) >= 0, "Price cannot be negative"),
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

export interface ListingFormSubmit {
  request: CreateListingRequest;
  image: File | null;
}

interface ListingFormProps {
  mode: "create" | "edit";
  defaultValues?: Partial<Omit<FormValues, "subject">> & {
    subject?: string | null;
    unavailableExamSlots?: ExamSlot[];
  };
  existingImageUrl?: string | null;
  onSubmit: (payload: ListingFormSubmit) => void;
  isSubmitting: boolean;
  submitLabel: string;
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: React.ReactNode;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6">
      <h2 className="font-display text-base font-bold">{title}</h2>
      {description && <p className="mt-1 text-[13px] text-ink-muted">{description}</p>}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

export function ListingForm({
  mode,
  defaultValues,
  existingImageUrl,
  onSubmit,
  isSubmitting,
  submitLabel,
}: ListingFormProps) {
  const [image, setImage] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | undefined>();
  const [slots, setSlots] = useState<ExamSlot[]>(defaultValues?.unavailableExamSlots ?? []);

const {
  register,
  handleSubmit,
  control,
  watch,
  setValue,
  formState: { errors },
} = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      subject: defaultValues?.subject ?? "",
      description: defaultValues?.description ?? "",
      category: defaultValues?.category,
      type: defaultValues?.type ?? "SALE",
      price: defaultValues?.price ?? "",
    },
  });

const selectedType = watch("type");
const selectedCategory = watch("category");

useEffect(() => {
  if (selectedCategory === "CALCULATOR") {
    setValue("subject", "");
  }
}, [selectedCategory, setValue]);

  const submit = handleSubmit((values) => {
    if (mode === "create" && !image) {
      setImageError("A photo is required.");
      return;
    }
    setImageError(undefined);

      onSubmit({
        request: {
          title: values.title.trim(),
          description: values.description.trim(),
          subject:
            values.category === "CALCULATOR"
              ? null
              : values.subject.trim(),
          category: values.category,
          type: values.type,
          price: Number(values.price),
          unavailableExamSlots: values.type === "RENT" ? slots : [],
        },
        image,
      });
  });

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <SectionCard
        title="Basic information"
        description="What are you listing, and for which subject?"
      >
        <Field label="Title" required error={errors.title?.message}>
          {(props) => (
            <Input
              {...props}
              {...register("title")}
              maxLength={200}
              placeholder="e.g. Engineering Chemistry textbook, 2nd edition"
              autoComplete="off"
            />
          )}
        </Field>

       {selectedCategory !== "CALCULATOR" && (
          <Field
            label="Subject"
            required
            hint="Searches match the title and the subject, so use the name students would type."
            error={errors.subject?.message}
          >
            {(props) => (
              <Input
                {...props}
                {...register("subject")}
                maxLength={120}
                placeholder="e.g. Engineering Chemistry"
                autoComplete="off"
              />
            )}
          </Field>
        )}

        <Field
          label="Description"
          required
          hint="Mention the condition, edition and anything a buyer should know."
          error={errors.description?.message}
        >
          {(props) => (
            <Textarea
              {...props}
              {...register("description")}
              rows={5}
              maxLength={3000}
              placeholder="Lightly used, no markings. Includes the solutions booklet."
            />
          )}
        </Field>
      </SectionCard>

      <SectionCard title="Category">
        <Controller
          control={control}
          name="category"
          render={({ field }) => (
            <fieldset>
              <legend className="sr-only">Category</legend>
              <div className="grid gap-3 sm:grid-cols-3">
                {LISTING_CATEGORIES.map((category) => {
                  const selected = field.value === category;
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => field.onChange(category)}
                      aria-pressed={selected}
                      className={cn(
                        "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors",
                        selected
                          ? "border-brand-600 bg-brand-50 ring-1 ring-brand-600"
                          : "border-line bg-white hover:border-brand-300",
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-lg",
                          selected ? "bg-brand-600 text-white" : "bg-surface-sunken text-ink-muted",
                        )}
                      >
                        <CategoryIcon category={category as ListingCategory} className="h-4 w-4" />
                      </span>
                      <span className="text-sm font-bold text-ink">
                        {CATEGORY_LABELS[category]}
                      </span>
                      <span className="text-xs leading-relaxed text-ink-muted">
                        {CATEGORY_DESCRIPTIONS[category]}
                      </span>
                    </button>
                  );
                })}
              </div>
              {errors.category && (
                <p role="alert" className="mt-2 text-xs font-medium text-danger-600">
                  {errors.category.message}
                </p>
              )}
            </fieldset>
          )}
        />
      </SectionCard>

      <SectionCard title="Listing type and price">
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <fieldset>
              <legend className="text-sm font-semibold text-ink">Listing type</legend>
              <div className="mt-2.5 flex gap-3">
                {LISTING_TYPES.map((type) => {
                  const selected = field.value === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => field.onChange(type as ListingType)}
                      aria-pressed={selected}
                      className={cn(
                        "flex-1 rounded-xl border px-4 py-3 text-sm font-bold transition-colors",
                        selected
                          ? "border-brand-600 bg-brand-600 text-white"
                          : "border-line bg-white text-ink-muted hover:border-brand-300 hover:text-ink",
                      )}
                    >
                      {TYPE_LABELS[type]}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}
        />

        <Field
          label="Price"
          required
          hint="In rupees. Enter 0 if you're giving it away."
          error={errors.price?.message}
        >
          {(props) => (
            <div className="relative max-w-[14rem]">
              <span
                aria-hidden
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-soft"
              >
                ₹
              </span>
              <Input
                {...props}
                {...register("price")}
                type="number"
                inputMode="decimal"
                min={0}
                step="1"
                placeholder="450"
                className="pl-8"
              />
            </div>
          )}
        </Field>
      </SectionCard>

      {/* Exam slots only apply to RENT — ListingMapper discards them for SALE. */}
      {selectedType === "RENT" && (
       <SectionCard
  title={
    <>
      <span className="text-red-600">Unavailable</span> exam slots
    </>
  }
  description="Select the slots when this item isn't available to rent."
>
          <ExamSlotPicker value={slots} onChange={setSlots} />
        </SectionCard>
      )}

      <SectionCard
        title="Photo"
        description={
          mode === "create"
            ? "One clear photo helps your listing sell faster."
            : "The photo can't be changed after posting."
        }
      >
        {mode === "create" ? (
          <ImageUploader file={image} onChange={setImage} error={imageError} />
        ) : (
          <div className="space-y-3">
            {existingImageUrl ? (
              <img
                src={existingImageUrl}
                alt="Current listing photo"
                className="h-40 w-32 rounded-xl border border-line object-cover"
              />
            ) : (
              <p className="text-sm text-ink-soft">No photo on this listing.</p>
            )}
            <div className="flex items-start gap-2 rounded-xl bg-surface-muted px-3.5 py-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-ink-soft" aria-hidden />
              <p className="text-xs leading-relaxed text-ink-muted">
                VITBookMart can't replace a listing photo yet — the update endpoint
                doesn't accept an image. To change it, post the item as a new listing.
              </p>
            </div>
          </div>
        )}
      </SectionCard>

      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 -mx-4 border-t border-line bg-white/95 px-4 py-3.5 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none">
        <Button type="submit" size="lg" isLoading={isSubmitting} fullWidth className="md:w-auto">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
