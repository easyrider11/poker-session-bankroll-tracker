import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md rounded-2xl border border-[var(--line)] bg-[var(--surface-1)] p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ink-3)]">
          Not found
        </p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--ink-1)]">
          That page does not exist.
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--ink-2)]">
          The player or session you requested could not be found.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/"
            className="rounded-lg border border-[var(--line)] px-4 py-2 text-sm font-medium text-[var(--ink-1)] transition hover:border-[var(--ink-1)]"
          >
            Dashboard
          </Link>
          <Link
            href="/players"
            className="rounded-[14px] bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--on-accent)] shadow-[0_2px_8px_rgba(30,74,57,0.25)] transition-all hover:opacity-90 active:scale-[0.98]"
          >
            Players
          </Link>
        </div>
      </div>
    </div>
  );
}
