"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md rounded-[28px] border border-[var(--line)] bg-[var(--surface-1)] p-8 text-center shadow-[0_18px_70px_rgba(24,21,17,0.06)]">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ink-3)]">
          Something went wrong
        </p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--ink-1)]">
          Unexpected error
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--ink-2)]">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="secondary" onClick={reset}>
            Try again
          </Button>
          <Link
            href="/"
            className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--on-accent)] transition hover:opacity-90"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
