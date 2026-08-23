import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

const CONTROL =
  "w-full rounded-lg border border-line-strong bg-white px-3 text-sm text-ink " +
  "placeholder:text-ink-soft/70 transition-colors focus:border-key-500 focus:outline-none " +
  "focus:ring-2 focus:ring-key-500/20 disabled:bg-canvas-sunken disabled:text-ink-soft " +
  "aria-[invalid=true]:border-bad-600 aria-[invalid=true]:ring-bad-600/20";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return <input ref={ref} className={cn(CONTROL, "h-10", className)} {...rest} />;
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, rows = 4, ...rest }, ref) {
    return <textarea ref={ref} rows={rows} className={cn(CONTROL, "py-2.5 leading-relaxed", className)} {...rest} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...rest }, ref) {
    return (
      <div className="relative">
        <select ref={ref} className={cn(CONTROL, "h-10 appearance-none pr-9", className)} {...rest}>
          {children}
        </select>
        <ChevronDown aria-hidden className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
      </div>
    );
  },
);

interface FieldProps {
  label: string;
  children: (props: { id: string; "aria-describedby": string | undefined; "aria-invalid": boolean | undefined }) => ReactNode;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

/** One wrapper so the label/hint/error aria wiring is written once. */
export function Field({ label, children, hint, error, required, className }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-[13px] font-semibold text-ink">
        {label}
        {required && <span className="ml-1 text-bad-600" aria-hidden>*</span>}
      </label>
      {hint && <p id={hintId} className="text-xs leading-relaxed text-ink-soft">{hint}</p>}
      {children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined })}
      {error && <p id={errorId} role="alert" className="text-xs font-medium text-bad-600">{error}</p>}
    </div>
  );
}
