"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", shortLabel: "Home" },
  { href: "/players", label: "Players", shortLabel: "Players" },
  { href: "/sessions", label: "Sessions", shortLabel: "History" },
  { href: "/sessions/new", label: "New Session", shortLabel: "New" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--surface-1)]/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-start justify-between gap-3 md:flex-row md:items-center">
            <div>
              <Link href="/" className="text-lg font-extrabold tracking-tight text-[var(--ink-1)]">
                Poker Session Bankroll Tracker
              </Link>
              <p className="mt-1 max-w-2xl text-sm text-[var(--ink-2)]">
                Practical cash-game tracking for Texas Hold&apos;em sessions.
              </p>
            </div>

            <Link
              href="/sessions/new"
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--on-accent)] transition hover:opacity-90 md:hidden"
            >
              New session
            </Link>

            <nav className="hidden flex-wrap gap-2 md:flex">
              {navItems.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === item.href
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-semibold transition",
                      isActive
                        ? "bg-[var(--accent)] text-[var(--on-accent)]"
                        : "border border-[var(--line)] text-[var(--ink-2)] hover:border-[var(--ink-1)] hover:text-[var(--ink-1)]",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 pb-28 sm:px-6 sm:py-8 md:pb-8 lg:px-8">
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--line)] bg-[var(--surface-1)]/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-7xl grid-cols-4 gap-2">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-h-[52px] flex-col items-center justify-center rounded-2xl px-2 text-center text-xs font-semibold transition",
                  isActive
                    ? "bg-[var(--accent)] text-[var(--on-accent)]"
                    : "text-[var(--ink-2)] hover:bg-[var(--surface-2)] hover:text-[var(--ink-1)]",
                )}
              >
                {item.shortLabel}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
