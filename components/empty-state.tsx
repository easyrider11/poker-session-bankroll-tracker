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
    <div className="flex flex-col items-center rounded-[18px] bg-[var(--surface-2)] px-6 py-12 text-center ring-1 ring-[rgba(17,17,17,0.06)]">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[16px] bg-[var(--surface-1)] text-[var(--ink-3)] shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <Icon size={20} strokeWidth={1.5} />
      </div>
      <h3 className="text-sm font-semibold text-[var(--ink-1)]">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-xs text-sm leading-6 text-[var(--ink-3)]">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
