import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import type { UserResponse } from "@/types";

/** The exact checks UserService.isProfileComplete runs, surfaced one by one. */
function buildChecklist(user: UserResponse | null) {
  const filled = (value: string | null | undefined) =>
    typeof value === "string" && value.trim() !== "";

  return [
    { label: "Name", done: filled(user?.name) },
    { label: "Email", done: filled(user?.email) },
    { label: "WhatsApp number", done: filled(user?.whatsappNumber) },
    { label: "Hostel type", done: filled(user?.hostel?.type) },
    { label: "Block", done: filled(user?.hostel?.block) },
  ];
}

export function ProfileCompletion({ user }: { user: UserResponse | null }) {
  const checklist = buildChecklist(user);
  const done = checklist.filter((item) => item.done).length;
  const percent = Math.round((done / checklist.length) * 100);
  const complete = percent === 100;

  return (
    <section
      aria-labelledby="completion"
      className="rounded-2xl border border-line bg-white p-5 shadow-card"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="completion" className="font-display text-base font-bold">
          Profile completion
        </h2>
        <span
          className={cn(
            "text-sm font-bold",
            complete ? "text-positive-600" : "text-brand-600",
          )}
        >
          {percent}%
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Profile completion"
        className="mt-3 h-2 overflow-hidden rounded-full bg-surface-sunken"
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-500",
            complete ? "bg-positive-600" : "bg-brand-600",
          )}
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">
        {complete
          ? "Your profile is complete. You can post listings."
          : "Fill in everything below to start selling."}
      </p>

      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {checklist.map((item) => (
          <li key={item.label} className="flex items-center gap-2 text-[13px]">
            <span
              aria-hidden
              className={cn(
                "flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full",
                item.done ? "bg-positive-600 text-white" : "border border-line-strong bg-white",
              )}
            >
              {item.done && <Check className="h-3 w-3" strokeWidth={3} />}
            </span>
            <span className={item.done ? "text-ink-muted" : "font-medium text-ink"}>
              {item.label}
            </span>
            <span className="sr-only">{item.done ? "complete" : "missing"}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
