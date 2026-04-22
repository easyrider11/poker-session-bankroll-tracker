import { cn } from "@/lib/utils";

export function SessionStatusBadge({
  finalizedAt,
  className,
}: {
  finalizedAt: string | null;
  className?: string;
}) {
  const isFinalized = !!finalizedAt;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        isFinalized
          ? "border-emerald-200 bg-emerald-50 text-[var(--positive)]"
          : "border-[var(--line)] bg-[var(--surface-2)] text-[var(--ink-2)]",
        className,
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        {!isFinalized && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--ink-3)] opacity-60" />
        )}
        <span
          className={cn(
            "relative inline-flex h-1.5 w-1.5 rounded-full",
            isFinalized ? "bg-[var(--positive)]" : "bg-[var(--ink-2)]",
          )}
        />
      </span>
      {isFinalized ? "Finalized" : "Live draft"}
    </span>
  );
}
