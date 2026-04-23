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
    <section className="overflow-hidden rounded-[22px] border border-[rgba(17,17,17,0.07)] bg-[var(--surface-1)] shadow-[0_8px_24px_rgba(0,0,0,0.07)]">
      <div className="flex items-start justify-between gap-4 border-b border-[rgba(17,17,17,0.06)] px-6 py-4">
        <div className="space-y-0.5">
          <h2 className="text-sm font-semibold tracking-tight text-[var(--ink-1)]">{title}</h2>
          {description ? (
            <p className="text-xs leading-5 text-[var(--ink-3)]">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}
