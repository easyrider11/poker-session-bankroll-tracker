import { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-dashed border-[var(--line)] bg-[var(--surface-0)] px-6 py-10 text-center">
      <h3 className="text-lg font-bold text-[var(--ink-1)]">{title}</h3>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[var(--ink-2)]">
        {description}
      </p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
