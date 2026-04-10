import { type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const toneClasses = {
  neutral: "border-[var(--line)] bg-[var(--surface-1)] text-[var(--ink-1)]",
  positive: "border-emerald-200 bg-emerald-50 text-[var(--positive)]",
  negative: "border-rose-200 bg-rose-50 text-[var(--negative)]",
};

const iconToneClasses = {
  neutral: "bg-[var(--surface-2)] text-[var(--ink-3)]",
  positive: "bg-emerald-100 text-[var(--positive)]",
  negative: "bg-rose-100 text-[var(--negative)]",
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
        "rounded-[24px] border p-5 shadow-[0_10px_40px_rgba(24,21,17,0.04)]",
        toneClasses[tone],
      )}
    >
      {Icon ? (
        <div className={cn("mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl", iconToneClasses[tone])}>
          <Icon size={18} />
        </div>
      ) : null}
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ink-3)]">
        {label}
      </p>
      <p className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">{value}</p>
      {helper ? <p className="mt-2 text-sm text-[var(--ink-2)]">{helper}</p> : null}
    </div>
  );
}
