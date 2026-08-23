import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Last line of defence: a render crash shows a recoverable screen rather than a
 * blank page. API failures are handled far earlier, by ErrorState.
 */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled UI error", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <span
          aria-hidden
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-50 text-danger-600"
        >
          <AlertTriangle className="h-6 w-6" />
        </span>
        <h1 className="mt-5 text-display-sm font-extrabold">Something went wrong</h1>
        <p className="mt-2 max-w-sm text-sm text-ink-muted">
          VITBookMart hit an unexpected error. Reloading usually fixes it.
        </p>
        <button
          type="button"
          onClick={() => window.location.assign("/")}
          className="mt-6 inline-flex h-11 items-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Back to VITBookMart
        </button>
      </div>
    );
  }
}
