import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "outline" | "ghost" | "danger" | "subtle";
type Size = "xs" | "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold " +
  "transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-key-500 " +
  "focus-visible:ring-offset-2 select-none whitespace-nowrap";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-shell-900 text-white hover:bg-shell-800",
  outline: "border border-line-strong bg-white text-ink hover:bg-canvas-sunken",
  subtle: "bg-canvas-sunken text-ink hover:bg-line",
  ghost: "text-ink-muted hover:bg-canvas-sunken hover:text-ink",
  danger: "bg-bad-600 text-white hover:bg-bad-700",
};

const SIZES: Record<Size, string> = {
  xs: "h-7 px-2 text-xs",
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-sm",
};

interface Common {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
  children?: ReactNode;
}

export interface ButtonProps
  extends Common, Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> {
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", fullWidth, isLoading, className, children, disabled, type = "button", ...rest },
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
      {isLoading && <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" />}
      {children}
    </button>
  );
});

export function ButtonLink({
  variant = "primary", size = "md", fullWidth, className, children, ...rest
}: Common & Omit<LinkProps, "className" | "children">) {
  return (
    <Link className={cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && "w-full", className)} {...rest}>
      {children}
    </Link>
  );
}
