"use client";

import { LayoutDashboard, Users, History, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", shortLabel: "Home", icon: LayoutDashboard },
  { href: "/players", label: "Players", shortLabel: "Players", icon: Users },
  { href: "/sessions", label: "Sessions", shortLabel: "History", icon: History },
  { href: "/sessions/new", label: "New Session", shortLabel: "New", icon: Plus },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--surface-1)]/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-start justify-between gap-3 md:flex-row md:items-center">
            <div>
              <Link href="/" className="inline-flex items-center gap-2 text-lg font-extrabold tracking-tight text-[var(--ink-1)]">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--on-accent)]">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                    <circle cx="8" cy="8" r="3" fill="currentColor"/>
                    <circle cx="4" cy="4" r="1" fill="currentColor"/>
                    <circle cx="12" cy="4" r="1" fill="currentColor"/>
                    <circle cx="4" cy="12" r="1" fill="currentColor"/>
                    <circle cx="12" cy="12" r="1" fill="currentColor"/>
                  </svg>
                </span>
                Poker Tracker
              </Link>
              <p className="mt-1 max-w-2xl text-sm text-[var(--ink-2)]">
                Practical cash-game tracking for Texas Hold&apos;em sessions.
              </p>
            </div>

            <Link
              href="/sessions/new"
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--on-accent)] transition hover:opacity-90 md:hidden"
            >
              <Plus size={16} />
              New session
            </Link>

            <nav className="hidden flex-wrap gap-2 md:flex">
              {navItems.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === item.href
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition",
                      isActive
                        ? "bg-[var(--accent)] text-[var(--on-accent)]"
                        : "border border-[var(--line)] text-[var(--ink-2)] hover:border-[var(--ink-1)] hover:text-[var(--ink-1)]",
                    )}
                  >
                    <Icon size={15} />
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
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-2xl px-2 text-center text-xs font-semibold transition",
                  isActive
                    ? "bg-[var(--accent)] text-[var(--on-accent)]"
                    : "text-[var(--ink-2)] hover:bg-[var(--surface-2)] hover:text-[var(--ink-1)]",
                )}
              >
                <Icon size={18} />
                {item.shortLabel}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
