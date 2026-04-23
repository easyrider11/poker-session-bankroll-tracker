import { type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const valueToneClasses = {
  neutral: "text-[var(--ink-1)]",
  positive: "text-[var(--positive)]",
  negative: "text-[var(--negative)]",
};

const iconBgClasses = {
  neutral: "bg-[var(--surface-2)] text-[var(--ink-3)]",
  positive: "bg-[var(--positive-subtle)] text-[var(--positive)]",
  negative: "bg-[var(--negative-subtle)] text-[var(--negative)]",
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
  tone?: "neutral" | "positive" | "negative";
  icon?: LucideIcon;
}) {
  return (
    <div className="rounded-[22px] border border-[rgba(17,17,17,0.07)] bg-[var(--surface-1)] p-5 shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(0,0,0,0.11)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--ink-3)]">
            {label}
          </p>
          <p className={cn("mt-3 font-numeric text-[28px] font-bold leading-none", valueToneClasses[tone])}>
            {value}
          </p>
          {helper ? (
            <p className="mt-2 text-xs leading-5 text-[var(--ink-3)]">{helper}</p>
          ) : null}
        </div>
        {Icon ? (
          <div className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px]", iconBgClasses[tone])}>
            <Icon size={17} strokeWidth={1.75} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
