import { type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const toneClasses = {
  neutral: "border-[var(--line)] bg-[var(--surface-1)]",
  positive: "border-l-[var(--positive)] bg-[var(--surface-1)]",
  negative: "border-l-[var(--negative)] bg-[var(--surface-1)]",
};

const valueToneClasses = {
  neutral: "text-[var(--ink-1)]",
  positive: "text-[var(--positive)]",
  negative: "text-[var(--negative)]",
};

const iconBgClasses = {
  neutral: "bg-[var(--surface-2)] text-[var(--ink-3)]",
  positive: "bg-emerald-50 text-[var(--positive)]",
  negative: "bg-rose-50 text-[var(--negative)]",
};

export function StatCard({
  label,
  value,
  helper,
  tone = "neutral",
  icon: Icon,
}: {
  label: string;
  value: string;
  helper?: string;
  tone?: keyof typeof toneClasses;
  icon?: LucideIcon;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-l-4 p-5",
        toneClasses[tone],
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-3)]">
            {label}
          </p>
          <p className={cn("mt-2.5 text-2xl font-bold tracking-tight sm:text-3xl", valueToneClasses[tone])}>
            {value}
          </p>
          {helper ? (
            <p className="mt-1.5 text-xs text-[var(--ink-3)]">{helper}</p>
          ) : null}
        </div>
        {Icon ? (
          <div className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", iconBgClasses[tone])}>
            <Icon size={17} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
