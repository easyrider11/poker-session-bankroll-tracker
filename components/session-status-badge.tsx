import { cn } from "@/lib/utils";

export function SessionStatusBadge({
  finalizedAt,
  className,
}: {
  finalizedAt: string | null;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
        finalizedAt
          ? "bg-[var(--accent-soft)] text-[var(--ink-1)]"
          : "bg-[var(--surface-2)] text-[var(--ink-2)]",
        className,
      )}
    >
      {finalizedAt ? "Finalized" : "Live draft"}
    </span>
  );
}
