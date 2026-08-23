import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

export class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled admin UI error", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <span aria-hidden className="flex h-12 w-12 items-center justify-center rounded-xl bg-bad-50 text-bad-600">
          <AlertTriangle className="h-5 w-5" />
        </span>
        <h1 className="mt-4 text-lg font-bold">Something went wrong</h1>
        <p className="mt-2 max-w-sm text-sm text-ink-muted">
          The console hit an unexpected error. Reloading usually clears it.
        </p>
        <button type="button" onClick={() => window.location.assign("/")}
          className="mt-5 inline-flex h-10 items-center rounded-lg bg-shell-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-shell-800">
          Back to overview
        </button>
      </div>
    );
  }
}
