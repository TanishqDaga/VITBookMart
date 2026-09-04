import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock } from "lucide-react";
import { WHATSAPP_PATTERN } from "@/constants/app";
import { HOSTEL_BLOCK_SUGGESTIONS, HOSTEL_TYPES } from "@/constants/hostel";
import { Button } from "@/components/common/Button";
import { Field } from "@/components/common/Field";
import { Input, PrefixedInput } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import type { UpdateUserProfileRequest, UserResponse } from "@/types";

/**
 * Matches UpdateUserProfileRequest. The only backend constraint is the WhatsApp
 * pattern ^[6-9][0-9]{9}$ — everything else is @NotNull-free and optional, but a
 * listing can't be created until UserService.isProfileComplete passes, so the form
 * asks for all of it.
 */
const schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  whatsappNumber: z
    .string()
    .trim()
    .min(1, "WhatsApp number is required")
    .regex(WHATSAPP_PATTERN, "Enter a 10 digit Indian mobile number, without +91"),
  hostelType: z.string().trim().min(1, "Hostel type is required"),
  hostelBlock: z.string().trim().min(1, "Block is required"),
  hostelRoom: z.string().trim(),
});

type FormValues = z.infer<typeof schema>;

interface ProfileFormProps {
  user: UserResponse;
  onSubmit: (payload: UpdateUserProfileRequest) => void;
  isSubmitting: boolean;
}

export function ProfileForm({ user, onSubmit, isSubmitting }: ProfileFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user.name ?? "",
      whatsappNumber: user.whatsappNumber ?? "",
      hostelType: user.hostel?.type ?? "",
      hostelBlock: user.hostel?.block ?? "",
      hostelRoom: user.hostel?.room ?? "",
    },
  });

  const submit = handleSubmit((values) =>
    onSubmit({
      name: values.name.trim(),
      whatsappNumber: values.whatsappNumber.trim(),
      // Hostel is a plain object of three strings on the backend, not an enum.
      hostel: {
        type: values.hostelType.trim(),
        block: values.hostelBlock.trim(),
        room: values.hostelRoom.trim(),
      },
    }),
  );

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <section className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6">
        <h2 className="font-display text-base font-bold">Account</h2>

        <div className="mt-5 space-y-5">
          <Field label="Name" required error={errors.name?.message}>
            {(props) => (
              <Input {...props} {...register("name")} autoComplete="name" maxLength={120} />
            )}
          </Field>

          <div className="space-y-1.5">
            <label
              htmlFor="profile-email"
              className="flex items-center gap-2 text-sm font-semibold text-ink"
            >
              Email
              <span className="inline-flex items-center gap-1 text-xs font-normal text-ink-soft">
                <Lock className="h-3 w-3" aria-hidden />
                From your Google account
              </span>
            </label>
            {/* UpdateUserProfileRequest has no email field — it cannot be changed. */}
            <Input
              id="profile-email"
              value={user.email ?? ""}
              readOnly
              disabled
              autoComplete="email"
            />
          </div>

          <Field
            label="WhatsApp number"
            required
            hint="Buyers reach you here. Ten digits, no country code."
            error={errors.whatsappNumber?.message}
          >
            {(props) => (
              <PrefixedInput
                {...props}
                {...register("whatsappNumber")}
                prefix="+91"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="9876543210"
                autoComplete="tel-national"
                className="max-w-[16rem]"
              />
            )}
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6">
        <h2 className="font-display text-base font-bold">Hostel information</h2>
        <p className="mt-1 text-[13px] text-ink-muted">
          Shown on your listings so buyers know where to meet you.
        </p>

        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          <Field label="Hostel type" required error={errors.hostelType?.message}>
            {(props) => (
              <Select {...props} {...register("hostelType")}>
                <option value="">Select</option>
                {HOSTEL_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field label="Block" required error={errors.hostelBlock?.message}>
            {(props) => (
              <>
                {/* Free text with suggestions — the backend accepts any string. */}
                <Input
                  {...props}
                  {...register("hostelBlock")}
                  list="hostel-blocks"
                  maxLength={20}
                  placeholder="e.g. B"
                  autoComplete="off"
                />
                <datalist id="hostel-blocks">
                  {HOSTEL_BLOCK_SUGGESTIONS.map((block) => (
                    <option key={block} value={block} />
                  ))}
                </datalist>
              </>
            )}
          </Field>

        <Field label="Room" error={errors.hostelRoom?.message}>
          {(props) => (
            <Input
              {...props}
              {...register("hostelRoom")}
              maxLength={20}
              placeholder="e.g. 412 (optional)"
              autoComplete="off"
            />
          )}
        </Field>
        </div>
      </section>

      <Button
        type="submit"
        size="lg"
        isLoading={isSubmitting}
        disabled={!isDirty && !isSubmitting}
        fullWidth
        className="sm:w-auto"
      >
        Save changes
      </Button>
    </form>
  );
}
