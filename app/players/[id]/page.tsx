import { CalendarDays, ArrowDownLeft, ArrowUpRight, TrendingUp, ChevronLeft, Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DeletePlayerButton } from "@/components/players/delete-player-button";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { SessionStatusBadge } from "@/components/session-status-badge";
import { StatCard } from "@/components/stat-card";
import { formatCurrency, formatSignedCurrency } from "@/lib/amounts";
import { prisma } from "@/lib/prisma";
import { serializePlayerSessionHistory } from "@/lib/serializers";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PlayerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const routeParams = await params;
  const playerId = Number(routeParams.id);

  if (!Number.isInteger(playerId) || playerId <= 0) {
    notFound();
  }

  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: {
      sessionPlayers: {
        include: {
          session: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      },
    },
  });

  if (!player) {
    notFound();
  }

  const recentSessions = player.sessionPlayers.map(serializePlayerSessionHistory);

  return (
    <div className="space-y-8">
      <PageHeader
        title={player.name}
        description={
          player.nickname
            ? `Nickname: ${player.nickname}`
            : "No nickname set for this player."
        }
        actions={
          <div className="flex flex-wrap gap-3">
            <Link
              href="/players"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--ink-1)] transition hover:border-[var(--ink-1)]"
            >
              <ChevronLeft size={15} />
              Back to players
            </Link>
            <Link
              href="/sessions/new"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--on-accent)] transition hover:opacity-90"
            >
              <Plus size={15} />
              Start session
            </Link>
            <DeletePlayerButton
              playerId={player.id}
              playerName={player.name}
              redirectPath="/players"
            />
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Sessions played" value={String(player.totalSessions)} helper="Finalized sessions" icon={CalendarDays} />
        <StatCard label="Lifetime Buy-in" value={formatCurrency(player.lifetimeBuyin)} icon={ArrowDownLeft} />
        <StatCard label="Lifetime Cash-out" value={formatCurrency(player.lifetimeCashout)} icon={ArrowUpRight} />
        <StatCard
          label="Lifetime Profit"
          value={formatSignedCurrency(player.lifetimeProfit)}
          icon={TrendingUp}
          tone={
            player.lifetimeProfit > 0
              ? "positive"
              : player.lifetimeProfit < 0
                ? "negative"
                : "neutral"
          }
        />
      </section>

      <SectionCard
        title="Recent sessions"
        description="Most recent appearances for this player, with per-session profit and cash flow."
      >
        {recentSessions.length === 0 ? (
          <EmptyState
            title="No session history"
            description="This player has not been included in any saved sessions yet."
            icon={CalendarDays}
          />
        ) : (
          <div className="space-y-4">
            <div className="space-y-3 md:hidden">
              {recentSessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/sessions/${session.sessionId}`}
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
                    <SessionStatusBadge finalizedAt={session.finalizedAt} />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-[20px] bg-[var(--surface-0)] px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ink-3)]">
                        Buy-in
                      </p>
                      <p className="mt-2 font-semibold text-[var(--ink-1)]">
                        {formatCurrency(session.totalBuyin)}
                      </p>
                    </div>
                    <div className="rounded-[20px] bg-[var(--surface-0)] px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ink-3)]">
                        Cash-out
                      </p>
                      <p className="mt-2 font-semibold text-[var(--ink-1)]">
                        {formatCurrency(session.totalCashout)}
                      </p>
                    </div>
                    <div className="rounded-[20px] bg-[var(--surface-0)] px-4 py-3 col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ink-3)]">
                        Profit / loss
                      </p>
                      <p
                        className={`mt-2 font-semibold ${
                          session.profit > 0
                            ? "text-[var(--positive)]"
                            : session.profit < 0
                              ? "text-[var(--negative)]"
                              : "text-[var(--ink-2)]"
                        }`}
                      >
                        {formatSignedCurrency(session.profit)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--line)] text-xs uppercase tracking-[0.24em] text-[var(--ink-3)]">
                    <th className="pb-3 pr-4 font-medium">Session</th>
                    <th className="pb-3 pr-4 font-medium">Date</th>
                    <th className="pb-3 pr-4 font-medium">Buy-in</th>
                    <th className="pb-3 pr-4 font-medium">Cash-out</th>
                    <th className="pb-3 font-medium">Profit / Loss</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSessions.map((session) => (
                    <tr key={session.id} className="border-b border-[var(--line)]/70 last:border-b-0">
                      <td className="py-4 pr-4">
                        <Link
                          href={`/sessions/${session.sessionId}`}
                          className="font-semibold text-[var(--ink-1)] transition hover:text-[var(--accent)]"
                        >
                          {session.title}
                        </Link>
                        <div className="mt-1">
                          <SessionStatusBadge
                            finalizedAt={session.finalizedAt}
                            className="px-2.5 py-0.5"
                          />
                        </div>
                      </td>
                      <td className="py-4 pr-4 text-[var(--ink-2)]">
                        {formatDate(session.sessionDate)}
                      </td>
                      <td className="py-4 pr-4 font-medium">
                        {formatCurrency(session.totalBuyin)}
                      </td>
                      <td className="py-4 pr-4 font-medium">
                        {formatCurrency(session.totalCashout)}
                      </td>
                      <td
                        className={`py-4 font-semibold ${
                          session.profit > 0
                            ? "text-[var(--positive)]"
                            : session.profit < 0
                              ? "text-[var(--negative)]"
                              : "text-[var(--ink-2)]"
                        }`}
                      >
                        {formatSignedCurrency(session.profit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
