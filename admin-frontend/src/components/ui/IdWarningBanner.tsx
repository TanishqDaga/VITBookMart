import { AlertTriangle } from "lucide-react";

/**
 * Shown when the API returned records whose ids can't be used.
 *
 * Rather than letting every row's actions fail one at a time, the portal says
 * once, at the top, exactly what is broken and exactly how to fix it.
 */
export function IdWarningBanner({ resource, usable, total }: {
  resource: string; usable: number; total: number;
}) {
  if (total === 0 || usable === total) return null;

  return (
    <div role="alert" className="flex items-start gap-3 rounded-xl border border-warn-600/25 bg-warn-50 px-4 py-3.5">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warn-600" aria-hidden />
      <div className="min-w-0 text-[13px] leading-relaxed text-warn-700">
        <p className="font-semibold">
          {usable === 0
            ? `The API didn't return usable ids for these ${resource}.`
            : `${total - usable} of ${total} ${resource} came back without a usable id.`}
        </p>
        <p className="mt-1">
          Actions that target a single record are disabled for those rows. The admin endpoints
          return raw entities, and <code className="font-mono">org.bson.types.ObjectId</code> has no
          JSON serializer configured, so the id arrives as{" "}
          <code className="font-mono">{"{ timestamp, date }"}</code> instead of a hex string.
          Adding <code className="font-mono">@JsonSerialize(using = ToStringSerializer.class)</code>{" "}
          to the entity id fields fixes it — this portal needs no changes once that's done.
        </p>
      </div>
    </div>
  );
}
