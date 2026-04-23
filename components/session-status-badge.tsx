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
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-wide",
        isFinalized
          ? "bg-[rgba(114,195,141,0.13)] text-[var(--positive)] ring-1 ring-[rgba(114,195,141,0.22)]"
          : "bg-[rgba(201,168,77,0.12)] text-[var(--warning)] ring-1 ring-[rgba(201,168,77,0.2)]",
        className,
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        {!isFinalized && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--warning)] opacity-60" />
        )}
        <span
          className={cn(
            "relative inline-flex h-1.5 w-1.5 rounded-full",
            isFinalized ? "bg-[var(--positive)]" : "bg-[var(--warning)]",
          )}
        />
      </span>
      {isFinalized ? "Finalized" : "Live draft"}
    </span>
  );
}
