import { Users, CalendarDays, ArrowDownLeft, TrendingUp, Zap, History, Plus } from "lucide-react";
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
        where: {
          finalizedAt: {
            not: null,
          },
        },
      }),
      prisma.player.aggregate({
        _sum: {
          lifetimeBuyin: true,
          lifetimeCashout: true,
          lifetimeProfit: true,
        },
      }),
      prisma.pokerSession.findMany({
        include: {
          _count: {
            select: {
              sessionPlayers: true,
            },
          },
          sessionPlayers: {
            select: {
              totalBuyin: true,
              totalCashout: true,
              profit: true,
            },
          },
        },
        orderBy: [{ sessionDate: "desc" }, { id: "desc" }],
        take: 6,
      }),
    ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Bankroll dashboard"
        description="Track player lifetimes, settle cash games quickly, and keep every session auditable."
        actions={
          <div className="flex flex-wrap gap-3">
            <Link
              href="/players"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--ink-1)] transition hover:border-[var(--ink-1)]"
            >
              <Users size={15} />
              Manage players
            </Link>
            <Link
              href="/sessions"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--ink-1)] transition hover:border-[var(--ink-1)]"
            >
              <History size={15} />
              View history
            </Link>
            <Link
              href="/sessions/new"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--on-accent)] transition hover:opacity-90"
            >
              <Plus size={15} />
              Start new session
            </Link>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Players"
          value={playerCount.toString()}
          helper="Persistent roster"
          icon={Users}
        />
        <StatCard
          label="Sessions"
          value={sessionCount.toString()}
          helper={`${finalizedCount} finalized`}
          icon={CalendarDays}
        />
        <StatCard
          label="Lifetime Buy-ins"
          value={formatCurrency(lifetimeTotals._sum.lifetimeBuyin ?? 0)}
          helper="Tracked across finalized sessions"
          icon={ArrowDownLeft}
        />
        <StatCard
          label="Lifetime Profit"
          value={formatSignedCurrency(lifetimeTotals._sum.lifetimeProfit ?? 0)}
          helper="System-wide net should balance near zero"
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

      <section className="grid gap-4 lg:grid-cols-3">
        <Link
          href="/sessions/new"
          className="group rounded-[28px] border border-[var(--line)] bg-[var(--surface-1)] p-5 shadow-[0_10px_40px_rgba(24,21,17,0.04)] transition hover:border-[var(--ink-1)]"
        >
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--on-accent)]">
            <Zap size={18} />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--ink-1)]">
            Start a session
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--ink-2)]">
            Pick historical players, set the initial buy-in structure, and move straight into live
            tracking.
          </p>
        </Link>

        <Link
          href="/players"
          className="group rounded-[28px] border border-[var(--line)] bg-[var(--surface-1)] p-5 shadow-[0_10px_40px_rgba(24,21,17,0.04)] transition hover:border-[var(--ink-1)]"
        >
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--ink-2)]">
            <Users size={18} />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--ink-1)]">
            Manage players
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--ink-2)]">
            Keep the roster clean, add new players, and check long-term bankroll history.
          </p>
        </Link>

        <Link
          href="/sessions"
          className="group rounded-[28px] border border-[var(--line)] bg-[var(--surface-1)] p-5 shadow-[0_10px_40px_rgba(24,21,17,0.04)] transition hover:border-[var(--ink-1)]"
        >
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--ink-2)]">
            <History size={18} />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--ink-1)]">
            Open history
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--ink-2)]">
            Review old sessions, inspect draft games, and jump back into any table view.
          </p>
        </Link>
      </section>

      <SectionCard
        title="Recent sessions"
        description="Newest sessions first, with participant count and bankroll totals."
      >
        {recentSessions.length === 0 ? (
          <EmptyState
            title="No sessions yet"
            description="Create your first poker session to start tracking buy-ins, cash-outs, and settlement results."
            icon={CalendarDays}
            action={
              <Link
                href="/sessions/new"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--on-accent)] transition hover:opacity-90"
              >
                <Plus size={15} />
                Create session
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            <div className="space-y-3 md:hidden">
              {recentSessions.map((session) => {
                const totalBuyin = session.sessionPlayers.reduce(
                  (sum, player) => sum + player.totalBuyin,
                  0,
                );
                const totalCashout = session.sessionPlayers.reduce(
                  (sum, player) => sum + player.totalCashout,
                  0,
                );
                const totalProfit = session.sessionPlayers.reduce(
                  (sum, player) => sum + player.profit,
                  0,
                );

                return (
                  <Link
                    key={session.id}
                    href={`/sessions/${session.id}`}
                    className="block rounded-[24px] border border-[var(--line)] bg-white p-4 shadow-[0_10px_40px_rgba(24,21,17,0.04)] transition hover:border-[var(--ink-1)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold tracking-tight text-[var(--ink-1)]">
                          {session.title}
                        </h3>
                        <p className="mt-1 text-sm text-[var(--ink-3)]">
                          {formatDate(session.sessionDate)}
                        </p>
                      </div>
                      <SessionStatusBadge finalizedAt={session.finalizedAt?.toISOString() ?? null} />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-[20px] bg-[var(--surface-0)] px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ink-3)]">
                          Players
                        </p>
                        <p className="mt-2 font-semibold text-[var(--ink-1)]">
                          {session._count.sessionPlayers}
                        </p>
                      </div>
                      <div className="rounded-[20px] bg-[var(--surface-0)] px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ink-3)]">
                          Net
                        </p>
                        <p
                          className={`mt-2 font-semibold ${
                            totalProfit > 0
                              ? "text-[var(--positive)]"
                              : totalProfit < 0
                                ? "text-[var(--negative)]"
                                : "text-[var(--ink-2)]"
                          }`}
                        >
                          {formatSignedCurrency(totalProfit)}
                        </p>
                      </div>
                      <div className="rounded-[20px] bg-[var(--surface-0)] px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ink-3)]">
                          Buy-in
                        </p>
                        <p className="mt-2 font-semibold text-[var(--ink-1)]">
                          {formatCurrency(totalBuyin)}
                        </p>
                      </div>
                      <div className="rounded-[20px] bg-[var(--surface-0)] px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ink-3)]">
                          Cash-out
                        </p>
                        <p className="mt-2 font-semibold text-[var(--ink-1)]">
                          {formatCurrency(totalCashout)}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--line)] text-xs uppercase tracking-[0.24em] text-[var(--ink-3)]">
                    <th className="pb-3 pr-4 font-medium">Session</th>
                    <th className="pb-3 pr-4 font-medium">Date</th>
                    <th className="pb-3 pr-4 font-medium">Players</th>
                    <th className="pb-3 pr-4 font-medium">Total Buy-in</th>
                    <th className="pb-3 pr-4 font-medium">Total Cash-out</th>
                    <th className="pb-3 font-medium">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSessions.map((session) => {
                    const totalBuyin = session.sessionPlayers.reduce(
                      (sum, player) => sum + player.totalBuyin,
                      0,
                    );
                    const totalCashout = session.sessionPlayers.reduce(
                      (sum, player) => sum + player.totalCashout,
                      0,
                    );
                    const totalProfit = session.sessionPlayers.reduce(
                      (sum, player) => sum + player.profit,
                      0,
                    );

                    return (
                      <tr key={session.id} className="border-b border-[var(--line)]/70 last:border-b-0">
                        <td className="py-4 pr-4">
                          <Link
                            href={`/sessions/${session.id}`}
                            className="font-semibold text-[var(--ink-1)] transition hover:text-[var(--accent)]"
                          >
                            {session.title}
                          </Link>
                          <div className="mt-1">
                            <SessionStatusBadge
                              finalizedAt={session.finalizedAt?.toISOString() ?? null}
                              className="px-2.5 py-0.5"
                            />
                          </div>
                        </td>
                        <td className="py-4 pr-4 text-[var(--ink-2)]">
                          {formatDate(session.sessionDate)}
                        </td>
                        <td className="py-4 pr-4 text-[var(--ink-2)]">
                          {session._count.sessionPlayers}
                        </td>
                        <td className="py-4 pr-4 font-medium">{formatCurrency(totalBuyin)}</td>
                        <td className="py-4 pr-4 font-medium">{formatCurrency(totalCashout)}</td>
                        <td
                          className={`py-4 font-semibold ${
                            totalProfit > 0
                              ? "text-[var(--positive)]"
                              : totalProfit < 0
                                ? "text-[var(--negative)]"
                                : "text-[var(--ink-2)]"
                          }`}
                        >
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
