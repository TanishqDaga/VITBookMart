import type { ReactNode } from "react";
import { AlertTriangle, Loader2, RefreshCw, WifiOff } from "lucide-react";
import { toApiError } from "@/api/errors";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton rounded-md", className)} />;
}

export function PageSpinner({ label = "Loading" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
      <Loader2 className="h-5 w-5 animate-spin text-key-600" aria-hidden />
      <p className="text-sm text-ink-soft">{label}…</p>
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: {
  icon: ReactNode; title: string; description?: string; action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line-strong bg-white px-6 py-14 text-center">
      <div aria-hidden className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-canvas-sunken text-ink-soft">
        {icon}
      </div>
      <h3 className="text-sm font-bold text-ink">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-muted">{description}</p>}
      {action && <div className="mt-5 flex gap-2">{action}</div>}
    </div>
  );
}

/** Raw exceptions never reach the screen — toApiError maps them first. */
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const apiError = toApiError(error);
  const offline = apiError.kind === "network";

  return (
    <EmptyState
      icon={offline ? <WifiOff className="h-5 w-5" aria-hidden /> : <AlertTriangle className="h-5 w-5" aria-hidden />}
      title={offline ? "Can't reach the API" : "Request failed"}
      description={apiError.message}
      action={onRetry && (
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5" aria-hidden />
          Try again
        </Button>
      )}
    />
  );
}
