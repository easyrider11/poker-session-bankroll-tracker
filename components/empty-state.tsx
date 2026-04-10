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
    <div className="rounded-[24px] border border-dashed border-[var(--line)] bg-[var(--surface-0)] px-6 py-10 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-2)] text-[var(--ink-3)]">
        <Icon size={22} />
      </div>
      <h3 className="text-lg font-bold text-[var(--ink-1)]">{title}</h3>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[var(--ink-2)]">
        {description}
      </p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
