import { CloudAlert, Loader2 } from "lucide-react";
import { useSyncStatus } from "../state/sync";

/**
 * Once data is real, a silent save failure is the worst outcome — so failures
 * are always visible. "Saving" is intentionally quiet: it flickers on every edit.
 */
export function SyncIndicator() {
  const status = useSyncStatus();
  if (status === "idle") return null;

  const failed = status === "error";

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        "pointer-events-none fixed right-4 bottom-4 flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium shadow-lg",
        failed ? "bg-overdue/15 text-overdue ring-overdue/40 ring-1" : "bg-surface-raised text-ink-muted",
      ].join(" ")}
    >
      {failed ? (
        <>
          <CloudAlert size={14} />
          Couldn&rsquo;t save — retrying
        </>
      ) : (
        <>
          <Loader2 size={14} className="animate-spin" />
          Saving
        </>
      )}
    </div>
  );
}
