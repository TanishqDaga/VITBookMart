import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface FieldProps {
  label: string;
  /** Rendered inside the control via the render prop, wired to label/description/error. */
  children: (props: {
    id: string;
    "aria-describedby": string | undefined;
    "aria-invalid": boolean | undefined;
  }) => ReactNode;
  hint?: string;
  error?: string;
  required?: boolean;
  optionalLabel?: boolean;
  className?: string;
}

/**
 * One label/hint/error wrapper for every form control, so the aria wiring is
 * written once instead of per field.
 */
export function Field({
  label,
  children,
  hint,
  error,
  required,
  optionalLabel,
  className,
}: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="flex items-baseline gap-2 text-sm font-semibold text-ink">
        {label}
        {required && (
          <span className="text-danger-600" aria-hidden>
            *
          </span>
        )}
        {optionalLabel && <span className="text-xs font-normal text-ink-soft">Optional</span>}
      </label>

      {hint && (
        <p id={hintId} className="text-xs leading-relaxed text-ink-soft">
          {hint}
        </p>
      )}

      {children({
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
      })}

      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-danger-600">
          {error}
        </p>
      )}
    </div>
  );
}
