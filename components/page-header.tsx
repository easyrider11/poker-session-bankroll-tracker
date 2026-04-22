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
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1.5">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--ink-3)]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-2xl font-bold tracking-tight text-[var(--ink-1)] sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-sm leading-6 text-[var(--ink-2)]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
