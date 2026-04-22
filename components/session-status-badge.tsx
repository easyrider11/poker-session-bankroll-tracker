import { CheckCircle2, Radio } from "lucide-react";

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
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        finalizedAt
          ? "border-emerald-200 bg-emerald-50 text-[var(--positive)]"
          : "border-[var(--line)] bg-[var(--surface-2)] text-[var(--ink-2)]",
        className,
      )}
    >
      {finalizedAt ? (
        <CheckCircle2 size={11} />
      ) : (
        <Radio size={11} />
      )}
      {finalizedAt ? "Finalized" : "Live draft"}
    </span>
  );
}
