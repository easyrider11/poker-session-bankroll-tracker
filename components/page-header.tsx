import { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-2">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--ink-3)]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--ink-1)] sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="max-w-3xl text-sm leading-6 text-[var(--ink-2)] sm:text-base">
            {description}
          </p>
        ) : null}
      </div>

      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </section>
  );
}
