import { type LucideIcon, InboxIcon } from "lucide-react";
import { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
  icon: Icon = InboxIcon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-0)] px-6 py-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--surface-1)] text-[var(--ink-3)]">
        <Icon size={20} strokeWidth={1.5} />
      </div>
      <h3 className="text-sm font-semibold text-[var(--ink-1)]">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-xs text-sm text-[var(--ink-3)]">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
