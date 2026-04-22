import { ReactNode } from "react";

export function SectionCard({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface-1)] overflow-hidden">
      <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] px-6 py-4">
        <div className="space-y-0.5">
          <h2 className="text-base font-semibold tracking-tight text-[var(--ink-1)]">{title}</h2>
          {description ? (
            <p className="text-sm text-[var(--ink-3)]">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}
