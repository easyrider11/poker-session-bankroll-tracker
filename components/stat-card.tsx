import { type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const toneClasses = {
  neutral: "border-[var(--line)]",
  positive: "border-[var(--line)] border-l-[var(--positive)]",
  negative: "border-[var(--line)] border-l-[var(--negative)]",
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
  const borderThickness = tone === "neutral" ? "border" : "border border-l-4";

  return (
    <div
      className={cn(
        "group relative rounded-2xl bg-[var(--surface-1)] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(14,31,22,0.06)]",
        borderThickness,
        toneClasses[tone],
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-3)]">
            {label}
          </p>
          <p
            className={cn(
              "mt-3 font-numeric text-[26px] font-bold leading-none sm:text-[30px]",
              valueToneClasses[tone],
            )}
          >
            {value}
          </p>
          {helper ? (
            <p className="mt-2 text-xs leading-5 text-[var(--ink-3)]">{helper}</p>
          ) : null}
        </div>
        {Icon ? (
          <div
            className={cn(
              "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
              iconBgClasses[tone],
            )}
          >
            <Icon size={17} strokeWidth={1.75} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
