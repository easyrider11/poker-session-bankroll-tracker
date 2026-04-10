import { CalendarDays, CheckCircle2, Clock, Filter, Plus } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { SessionStatusBadge } from "@/components/session-status-badge";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatSignedCurrency } from "@/lib/amounts";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SessionsPageSearchParams = Promise<{
  q?: string;
  status?: "all" | "finalized" | "draft";
}>;

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: SessionsPageSearchParams;
}) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const status = params.status === "finalized" || params.status === "draft" ? params.status : "all";

  const where = {
    ...(status === "finalized"
      ? {
          finalizedAt: {
            not: null,
          },
        }
      : status === "draft"
        ? {
            finalizedAt: null,
          }
        : {}),
  };

  const [allSessions, totalSessions, finalizedSessions, draftSessions] = await Promise.all([
    prisma.pokerSession.findMany({
      where,
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
    }),
    prisma.pokerSession.count(),
    prisma.pokerSession.count({
      where: {
        finalizedAt: {
          not: null,
        },
      },
    }),
    prisma.pokerSession.count({
      where: {
        finalizedAt: null,
      },
    }),
  ]);

  const sessions = query
    ? allSessions.filter((s) => s.title.toLowerCase().includes(query.toLowerCase()))
    : allSessions;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Session history"
        description="Review all saved poker sessions, filter by status, and open any settlement table from the archive."
        actions={
          <Link
            href="/sessions/new"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--on-accent)] transition hover:opacity-90"
          >
            <Plus size={15} />
            New session
          </Link>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="All Sessions"
          value={String(totalSessions)}
          helper="Across the tracker"
          icon={CalendarDays}
        />
        <StatCard
          label="Finalized"
          value={String(finalizedSessions)}
          helper="Lifetime stats already applied"
          icon={CheckCircle2}
        />
        <StatCard
          label="Drafts"
          value={String(draftSessions)}
          helper="Still open for live edits"
          icon={Clock}
        />
        <StatCard
          label="Filtered Results"
          value={String(sessions.length)}
          helper={query || status !== "all" ? "Based on current filter" : "No filter applied"}
          icon={Filter}
        />
      </section>

      <SectionCard
        title="History"
        description="Search by session title and filter by finalized or draft status."
      >
        <form className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center" method="GET">
          <Input
            name="q"
            placeholder="Search session title"
            defaultValue={query}
            className="lg:max-w-sm"
          />

          <select
            name="status"
            defaultValue={status}
            className="h-11 rounded-2xl border border-[var(--line)] bg-white px-4 text-sm text-[var(--ink-1)] outline-none transition focus:border-[var(--ink-1)]"
          >
            <option value="all">All statuses</option>
            <option value="finalized">Finalized only</option>
            <option value="draft">Draft only</option>
          </select>

          <div className="flex gap-3">
            <Button type="submit" variant="secondary">
              Apply filters
            </Button>
            {(query || status !== "all") && (
              <Link
                href="/sessions"
                className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--line)] px-4 text-sm font-semibold text-[var(--ink-1)] transition hover:border-[var(--ink-1)]"
              >
                Clear
              </Link>
            )}
          </div>
        </form>

        {sessions.length === 0 ? (
          <EmptyState
            title={query || status !== "all" ? "No sessions match" : "No sessions yet"}
            description={
              query || status !== "all"
                ? "Try changing the filters or clearing the search."
                : "Create your first session to start building a usable session history."
            }
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
              {sessions.map((session) => {
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
                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-bold tracking-tight text-[var(--ink-1)]">
                          {session.title}
                        </h3>
                        <p className="mt-1 text-sm text-[var(--ink-3)]">
                          {formatDate(session.sessionDate)}
                        </p>
                      </div>
                      <SessionStatusBadge finalizedAt={session.finalizedAt?.toISOString() ?? null} />
                    </div>

                    {session.notes ? (
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--ink-2)]">
                        {session.notes}
                      </p>
                    ) : null}

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
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 pr-4 font-medium">Players</th>
                    <th className="pb-3 pr-4 font-medium">Total Buy-in</th>
                    <th className="pb-3 pr-4 font-medium">Total Cash-out</th>
                    <th className="pb-3 pr-4 font-medium">Net</th>
                    <th className="pb-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => {
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
                          {session.notes ? (
                            <div className="mt-1 max-w-xs truncate text-xs text-[var(--ink-3)]">
                              {session.notes}
                            </div>
                          ) : (
                            <div className="mt-1 text-xs text-[var(--ink-3)]">No notes</div>
                          )}
                        </td>
                        <td className="py-4 pr-4 text-[var(--ink-2)]">
                          {formatDate(session.sessionDate)}
                        </td>
                        <td className="py-4 pr-4">
                          <SessionStatusBadge
                            finalizedAt={session.finalizedAt?.toISOString() ?? null}
                          />
                        </td>
                        <td className="py-4 pr-4 text-[var(--ink-2)]">
                          {session._count.sessionPlayers}
                        </td>
                        <td className="py-4 pr-4 font-medium">{formatCurrency(totalBuyin)}</td>
                        <td className="py-4 pr-4 font-medium">{formatCurrency(totalCashout)}</td>
                        <td
                          className={`py-4 pr-4 font-semibold ${
                            totalProfit > 0
                              ? "text-[var(--positive)]"
                              : totalProfit < 0
                                ? "text-[var(--negative)]"
                                : "text-[var(--ink-2)]"
                          }`}
                        >
                          {formatSignedCurrency(totalProfit)}
                        </td>
                        <td className="py-4">
                          <Link
                            href={`/sessions/${session.id}`}
                            className="inline-flex h-9 items-center justify-center rounded-full border border-[var(--line)] px-3 text-sm font-semibold text-[var(--ink-1)] transition hover:border-[var(--ink-1)]"
                          >
                            Open
                          </Link>
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
