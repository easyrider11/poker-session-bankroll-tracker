import { ReactNode } from "react";

export function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-1)] p-6 shadow-[0_18px_70px_rgba(24,21,17,0.06)]">
      <div className="mb-5 space-y-1">
        <h2 className="text-xl font-bold tracking-tight text-[var(--ink-1)]">{title}</h2>
        {description ? <p className="text-sm text-[var(--ink-2)]">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
