"use client";

import { LayoutDashboard, Users, History, Plus, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/players", label: "Players", icon: Users },
  { href: "/sessions", label: "Session history", icon: History },
  { href: "/sessions/new", label: "New session", icon: Plus },
];

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5 px-3">
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
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-[var(--sidebar-item-active)] text-[var(--sidebar-text-active)]"
                : "text-[var(--sidebar-text)] hover:bg-[var(--sidebar-item-hover)] hover:text-[var(--sidebar-text-hover)]",
            )}
          >
            <Icon
              size={16}
              className={cn(
                "shrink-0 transition-colors",
                isActive
                  ? "text-[var(--sidebar-text-active)]"
                  : "text-[var(--sidebar-text)] group-hover:text-[var(--sidebar-text-hover)]",
              )}
            />
            {item.href === "/sessions/new" ? (
              <span className="flex flex-1 items-center justify-between">
                {item.label}
                <span className="rounded-md bg-[var(--sidebar-item-active)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--sidebar-text)]">
                  +
                </span>
              </span>
            ) : (
              item.label
            )}
          </Link>
        );
      })}
    </nav>
  );
}

const sidebarGradient = "linear-gradient(to bottom right, #0e241b, #163328, #1e4a39)";

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col" style={{ background: sidebarGradient }}>
      {/* Logo */}
      <div
        className="flex h-14 items-center gap-3 px-5"
        style={{ borderBottom: "1px solid var(--sidebar-border)" }}
      >
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-2.5 text-[var(--sidebar-text-active)]"
        >
          <span className="text-xl leading-none">🃏</span>
          <span className="text-sm font-bold tracking-tight">Poker Tracker</span>
        </Link>
      </div>

      {/* Nav */}
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto py-4 sidebar-scroll">
        <div>
          <p className="mb-1.5 px-6 text-[10px] font-semibold uppercase tracking-widest text-[var(--sidebar-text)] opacity-60">
            Navigation
          </p>
          <NavItems onNavigate={onNavigate} />
        </div>
      </div>

      {/* Footer — card suits */}
      <div
        className="px-4 py-3 text-center"
        style={{ borderTop: "1px solid var(--sidebar-border)" }}
      >
        <p className="text-sm tracking-[0.3em] text-[var(--sidebar-text)] opacity-60">
          ♠ ♣ ♥ ♦
        </p>
        <p className="mt-1 text-[10px] text-[var(--sidebar-text)] opacity-35">
          Texas Hold&apos;em tracker
        </p>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside
        className="fixed inset-y-0 left-0 z-40 hidden w-[240px] md:flex md:flex-col"
        style={{ background: sidebarGradient }}
      >
        <Sidebar />
      </aside>

      {/* Mobile: overlay + drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-[240px] shadow-2xl">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Content area */}
      <div className="flex flex-1 flex-col md:pl-[240px]">
        {/* Mobile top bar */}
        <header
          className="sticky top-0 z-30 flex h-14 items-center gap-4 px-4 md:hidden"
          style={{
            background: "var(--sidebar-bg)",
            borderBottom: "1px solid var(--sidebar-border)",
          }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--sidebar-text-active)] transition hover:bg-[var(--sidebar-item-hover)]"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <Link href="/" className="flex items-center gap-2 text-[var(--sidebar-text-active)]">
            <span className="text-lg leading-none">🃏</span>
            <span className="text-sm font-bold">Poker Tracker</span>
          </Link>
          <Link
            href="/sessions/new"
            className="ml-auto flex h-9 items-center gap-1.5 rounded-full bg-[var(--accent)] px-3 text-xs font-semibold text-[var(--on-accent)] transition hover:opacity-90"
          >
            <Plus size={14} />
            New
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10 pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
