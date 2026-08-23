import { useCallback, useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}

export function Modal({ open, onClose, title, description, children, footer, size = "sm" }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previous = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (!open) return;
    previous.current = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panelRef.current)?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previous.current?.focus?.();
    };
  }, [open]);

  const onKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === "Escape") { onClose(); return; }
    if (event.key !== "Tab") return;

    const items = Array.from(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])
      .filter((el) => el.offsetParent !== null);
    if (items.length === 0) return;

    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }, [onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onKeyDown={onKeyDown}>
      <div className="absolute inset-0 animate-fade-in bg-shell-900/50" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          "relative w-full animate-scale-in rounded-xl bg-white shadow-pop outline-none",
          size === "sm" ? "max-w-md" : size === "md" ? "max-w-lg" : "max-w-2xl",
        )}
      >
        <div className="flex items-start justify-between gap-4 px-5 pt-5">
          <div className="space-y-1">
            <h2 id={titleId} className="text-base font-bold">{title}</h2>
            {description && <p id={descId} className="text-sm leading-relaxed text-ink-muted">{description}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close"
            className="-mr-1 -mt-1 rounded-md p-1.5 text-ink-soft transition-colors hover:bg-canvas-sunken hover:text-ink">
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        {children && <div className="max-h-[65vh] overflow-y-auto px-5 pt-4">{children}</div>}

        {footer && <div className="flex justify-end gap-2 px-5 pb-5 pt-5">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel: string;
  confirmVariant?: "primary" | "danger";
  isLoading?: boolean;
  children?: ReactNode;
}

export function ConfirmDialog({
  open, onClose, onConfirm, title, description, confirmLabel,
  confirmVariant = "primary", isLoading, children,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} description={description}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button variant={confirmVariant} onClick={onConfirm} isLoading={isLoading}>{confirmLabel}</Button>
        </>
      }>
      {children}
    </Modal>
  );
}
