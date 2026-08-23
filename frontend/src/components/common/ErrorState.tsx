import { AlertTriangle, RefreshCw, WifiOff } from "lucide-react";
import { toApiError } from "@/api/errors";
import { Button } from "./Button";
import { EmptyState } from "./EmptyState";

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  /** Overrides the derived message when the caller has better context. */
  title?: string;
}

/**
 * Turns any thrown error into a recoverable screen.
 * Raw backend exceptions never reach the user — toApiError maps them first.
 */
export function ErrorState({ error, onRetry, title }: ErrorStateProps) {
  const apiError = toApiError(error);
  const offline = apiError.kind === "network";

  return (
    <EmptyState
      icon={
        offline ? (
          <WifiOff className="h-6 w-6" aria-hidden />
        ) : (
          <AlertTriangle className="h-6 w-6" aria-hidden />
        )
      }
      title={title ?? (offline ? "We couldn't connect to VITBookMart." : "Something went wrong")}
      description={apiError.message}
      action={
        onRetry && (
          <Button onClick={onRetry} variant="outline">
            <RefreshCw className="h-4 w-4" aria-hidden />
            Try again
          </Button>
        )
      }
    />
  );
}
