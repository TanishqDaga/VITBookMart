import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success" | "outline";
type Size = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold " +
  "transition-[background-color,color,box-shadow,transform] duration-150 " +
  "disabled:cursor-not-allowed disabled:opacity-55 active:translate-y-px " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 " +
  "focus-visible:ring-offset-2 select-none";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand-600 text-white shadow-sm hover:bg-brand-700",
  secondary: "bg-brand-50 text-brand-700 hover:bg-brand-100",
  outline: "border border-line-strong bg-white text-ink hover:border-brand-300 hover:bg-brand-50",
  ghost: "text-ink-muted hover:bg-surface-sunken hover:text-ink",
  danger: "bg-danger-600 text-white hover:bg-danger-700",
  success: "bg-positive-600 text-white hover:bg-positive-700",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
  children?: ReactNode;
}

export interface ButtonProps
  extends CommonProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> {
  isLoading?: boolean;
  /** Announced to screen readers while `isLoading`. */
  loadingLabel?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    fullWidth,
    isLoading,
    loadingLabel = "Working…",
    className,
    children,
    disabled,
    type = "button",
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && "w-full", className)}
      {...rest}
    >
      {isLoading && <Loader2 aria-hidden className="h-4 w-4 animate-spin" />}
      {isLoading ? <span className="sr-only">{loadingLabel}</span> : null}
      {children}
    </button>
  );
});

export interface ButtonLinkProps extends CommonProps, Omit<LinkProps, "className" | "children"> {}

/** Same visual language as Button, but renders a router link. */
export function ButtonLink({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && "w-full", className)}
      {...rest}
    >
      {children}
    </Link>
  );
}
