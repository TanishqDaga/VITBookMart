import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/cn";
import { shortId, toHexId } from "@/lib/objectId";
import type { RawObjectId } from "@/types";

/**
 * Renders a record id, or says plainly that the API didn't send one.
 * Never invents or approximates an id.
 */
export function IdCell({ value, className }: { value: RawObjectId | undefined; className?: string }) {
  const [copied, setCopied] = useState(false);
  const hex = toHexId(value);

  if (!hex) {
    return (
      <span className={cn("font-mono text-xs text-ink-soft", className)} title="The API did not return a usable id for this record">
        unavailable
      </span>
    );
  }

  const copy = () => {
    void navigator.clipboard?.writeText(hex).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    });
  };

  return (
    <button
      type="button"
      onClick={copy}
      title={hex}
      aria-label={`Copy id ${hex}`}
      className={cn(
        "group inline-flex items-center gap-1.5 rounded font-mono text-xs text-ink-muted transition-colors hover:text-ink",
        className,
      )}
    >
      {shortId(value)}
      {copied ? (
        <Check className="h-3 w-3 text-ok-600" aria-hidden />
      ) : (
        <Copy className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
      )}
    </button>
  );
}
