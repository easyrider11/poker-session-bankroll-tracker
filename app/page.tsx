import { Users, CalendarDays, ArrowDownLeft, TrendingUp, Zap, History, Plus, ArrowRight } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { SessionStatusBadge } from "@/components/session-status-badge";
import { StatCard } from "@/components/stat-card";
import { formatCurrency, formatSignedCurrency } from "@/lib/amounts";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [playerCount, sessionCount, finalizedCount, lifetimeTotals, recentSessions] =
    await Promise.all([
      prisma.player.count(),
      prisma.pokerSession.count(),
      prisma.pokerSession.count({
        where: { finalizedAt: { not: null } },
      }),
      prisma.player.aggregate({
        _sum: { lifetimeBuyin: true, lifetimeCashout: true, lifetimeProfit: true },
      }),
      prisma.pokerSession.findMany({
        include: {
          _count: { select: { sessionPlayers: true } },
          sessionPlayers: { select: { totalBuyin: true, totalCashout: true, profit: true } },
        },
        orderBy: [{ sessionDate: "desc" }, { id: "desc" }],
        take: 6,
      }),
    ]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="♠ ♣ ♥ ♦"
        title="Dashboard"
        description="Track player bankrolls, settle the felt, and keep every cash game auditable."
        actions={
          <Link
            href="/sessions/new"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--on-accent)] transition hover:opacity-90"
          >
            <span className="text-base leading-none">🃏</span>
            Deal new session
          </Link>
        }
      />

      {/* Stats */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Players" value={playerCount.toString()} helper="Registered at the table" icon={Users} />
        <StatCard label="Sessions" value={sessionCount.toString()} helper={`${finalizedCount} finalized`} icon={CalendarDays} />
        <StatCard
          label="Lifetime Buy-ins"
          value={formatCurrency(lifetimeTotals._sum.lifetimeBuyin ?? 0)}
          helper="Chips in — finalized sessions"
          icon={ArrowDownLeft}
        />
        <StatCard
          label="Lifetime Profit"
          value={formatSignedCurrency(lifetimeTotals._sum.lifetimeProfit ?? 0)}
          helper="Should net near zero across all players"
          icon={TrendingUp}
          tone={
            (lifetimeTotals._sum.lifetimeProfit ?? 0) > 0
              ? "positive"
              : (lifetimeTotals._sum.lifetimeProfit ?? 0) < 0
                ? "negative"
                : "neutral"
          }
        />
      </section>

      {/* Quick actions */}
      <section className="grid gap-3 lg:grid-cols-3">
        <Link
          href="/sessions/new"
          className="group flex items-start gap-4 rounded-2xl border border-[var(--line)] bg-[var(--surface-1)] p-5 transition hover:border-[var(--ink-3)] hover:shadow-sm"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--on-accent)]">
            <Zap size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-[var(--ink-1)]">🃏 Deal a new session</h2>
            <p className="mt-1 text-sm leading-5 text-[var(--ink-3)]">
              Seat players, set buy-ins, and go straight to the live felt.
            </p>
          </div>
          <ArrowRight size={16} className="mt-1 shrink-0 text-[var(--ink-3)] transition group-hover:translate-x-0.5" />
        </Link>

        <Link
          href="/players"
          className="group flex items-start gap-4 rounded-2xl border border-[var(--line)] bg-[var(--surface-1)] p-5 transition hover:border-[var(--ink-3)] hover:shadow-sm"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--ink-2)]">
            <Users size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-[var(--ink-1)]">🪙 Manage players</h2>
            <p className="mt-1 text-sm leading-5 text-[var(--ink-3)]">
              Build your roster, set nicknames, and track lifetime chip flow.
            </p>
          </div>
          <ArrowRight size={16} className="mt-1 shrink-0 text-[var(--ink-3)] transition group-hover:translate-x-0.5" />
        </Link>

        <Link
          href="/sessions"
          className="group flex items-start gap-4 rounded-2xl border border-[var(--line)] bg-[var(--surface-1)] p-5 transition hover:border-[var(--ink-3)] hover:shadow-sm"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--ink-2)]">
            <History size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-[var(--ink-1)]">♠ Session history</h2>
            <p className="mt-1 text-sm leading-5 text-[var(--ink-3)]">
              Review every hand history, inspect open drafts, and reopen any settlement table.
            </p>
          </div>
          <ArrowRight size={16} className="mt-1 shrink-0 text-[var(--ink-3)] transition group-hover:translate-x-0.5" />
        </Link>
      </section>

      {/* Recent sessions */}
      <SectionCard
        title="Recent sessions"
        description="Newest sessions first."
        action={
          recentSessions.length > 0 ? (
            <Link
              href="/sessions"
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--ink-2)] transition hover:text-[var(--ink-1)]"
            >
              View all <ArrowRight size={13} />
            </Link>
          ) : undefined
        }
      >
        {recentSessions.length === 0 ? (
          <EmptyState
            title="No sessions yet"
            description="Create your first poker session to start tracking buy-ins and cash-outs."
            icon={CalendarDays}
            action={
              <Link
                href="/sessions/new"
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--on-accent)] transition hover:opacity-90"
              >
                <Plus size={14} />
                Create session
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {/* Mobile cards */}
            <div className="space-y-2 md:hidden">
              {recentSessions.map((session) => {
                const totalBuyin = session.sessionPlayers.reduce((s, p) => s + p.totalBuyin, 0);
                const totalCashout = session.sessionPlayers.reduce((s, p) => s + p.totalCashout, 0);
                const totalProfit = session.sessionPlayers.reduce((s, p) => s + p.profit, 0);
                return (
                  <Link
                    key={session.id}
                    href={`/sessions/${session.id}`}
                    className="block rounded-xl border border-[var(--line)] bg-white p-4 transition hover:border-[var(--ink-3)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-[var(--ink-1)]">{session.title}</h3>
                        <p className="mt-0.5 text-xs text-[var(--ink-3)]">{formatDate(session.sessionDate)}</p>
                      </div>
                      <SessionStatusBadge finalizedAt={session.finalizedAt?.toISOString() ?? null} />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {[
                        { label: "Players", value: String(session._count.sessionPlayers) },
                        { label: "Net", value: formatSignedCurrency(totalProfit), profit: totalProfit },
                        { label: "Buy-in", value: formatCurrency(totalBuyin) },
                        { label: "Cash-out", value: formatCurrency(totalCashout) },
                      ].map(({ label, value, profit }) => (
                        <div key={label} className="rounded-lg bg-[var(--surface-0)] px-3 py-2">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-3)]">{label}</p>
                          <p className={`mt-1 font-numeric text-sm font-semibold ${profit !== undefined ? (profit > 0 ? "text-[var(--positive)]" : profit < 0 ? "text-[var(--negative)]" : "text-[var(--ink-2)]") : "text-[var(--ink-1)]"}`}>
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--line)] text-xs uppercase tracking-wider text-[var(--ink-3)]">
                    <th className="pb-3 pr-4 font-medium">Session</th>
                    <th className="pb-3 pr-4 font-medium">Date</th>
                    <th className="pb-3 pr-4 font-medium">Players</th>
                    <th className="pb-3 pr-4 font-medium">Buy-in</th>
                    <th className="pb-3 pr-4 font-medium">Cash-out</th>
                    <th className="pb-3 font-medium">Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]/60">
                  {recentSessions.map((session) => {
                    const totalBuyin = session.sessionPlayers.reduce((s, p) => s + p.totalBuyin, 0);
                    const totalCashout = session.sessionPlayers.reduce((s, p) => s + p.totalCashout, 0);
                    const totalProfit = session.sessionPlayers.reduce((s, p) => s + p.profit, 0);
                    return (
                      <tr key={session.id} className="group">
                        <td className="py-3.5 pr-4">
                          <Link
                            href={`/sessions/${session.id}`}
                            className="font-medium text-[var(--ink-1)] transition hover:text-[var(--accent)]"
                          >
                            {session.title}
                          </Link>
                          <div className="mt-1">
                            <SessionStatusBadge finalizedAt={session.finalizedAt?.toISOString() ?? null} />
                          </div>
                        </td>
                        <td className="py-3.5 pr-4 text-[var(--ink-3)]">{formatDate(session.sessionDate)}</td>
                        <td className="py-3.5 pr-4 font-numeric text-[var(--ink-2)]">{session._count.sessionPlayers}</td>
                        <td className="py-3.5 pr-4 font-numeric font-medium">{formatCurrency(totalBuyin)}</td>
                        <td className="py-3.5 pr-4 font-numeric font-medium">{formatCurrency(totalCashout)}</td>
                        <td className={`py-3.5 font-numeric font-semibold ${totalProfit > 0 ? "text-[var(--positive)]" : totalProfit < 0 ? "text-[var(--negative)]" : "text-[var(--ink-2)]"}`}>
                          {formatSignedCurrency(totalProfit)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
