import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const CONTROL =
  "w-full rounded-xl border border-line bg-white px-3.5 text-sm text-ink " +
  "placeholder:text-ink-soft/70 transition-colors " +
  "focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600/20 " +
  "disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:text-ink-soft " +
  "aria-[invalid=true]:border-danger-600 aria-[invalid=true]:ring-danger-600/20";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return <input ref={ref} className={cn(CONTROL, "h-11", className)} {...rest} />;
  },
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, rows = 4, ...rest }, ref) {
  return (
    <textarea ref={ref} rows={rows} className={cn(CONTROL, "py-2.5 leading-relaxed", className)} {...rest} />
  );
});

/** Input with a fixed prefix, e.g. the +91 on a WhatsApp number. */
export const PrefixedInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { prefix: string }
>(function PrefixedInput({ className, prefix, ...rest }, ref) {
  return (
    <div
      className={cn(
        "flex h-11 w-full items-center rounded-xl border border-line bg-white",
        "transition-colors focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-600/20",
        rest["aria-invalid"] && "border-danger-600 ring-danger-600/20",
      )}
    >
      <span className="pl-3.5 pr-2 text-sm font-medium text-ink-soft" aria-hidden>
        {prefix}
      </span>
      <div className="h-5 w-px bg-line" aria-hidden />
      <input
        ref={ref}
        className={cn(
          "h-full min-w-0 flex-1 rounded-r-xl bg-transparent px-3 text-sm text-ink",
          "placeholder:text-ink-soft/70 focus:outline-none",
          className,
        )}
        {...rest}
      />
    </div>
  );
});
