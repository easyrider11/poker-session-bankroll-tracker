import Link from "next/link";
import { notFound } from "next/navigation";

import { SessionStatusBadge } from "@/components/session-status-badge";
import { FinalizeSessionButton } from "@/components/sessions/finalize-session-button";
import { SessionSettlementTable } from "@/components/sessions/session-settlement-table";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { formatCurrency } from "@/lib/amounts";
import { prisma } from "@/lib/prisma";
import { serializePlayer, serializeSession, sessionDetailInclude } from "@/lib/serializers";
import { formatDate, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const routeParams = await params;
  const sessionId = Number(routeParams.id);

  if (!Number.isInteger(sessionId) || sessionId <= 0) {
    notFound();
  }

  const [session, rosterPlayers] = await Promise.all([
    prisma.pokerSession.findUnique({
      where: { id: sessionId },
      include: sessionDetailInclude,
    }),
    prisma.player.findMany({
      orderBy: [{ name: "asc" }],
    }),
  ]);

  if (!session) {
    notFound();
  }

  const serializedSession = serializeSession(session);
  const serializedRosterPlayers = rosterPlayers.map(serializePlayer);

  return (
    <div className="space-y-8">
      <PageHeader
        title={serializedSession.title}
        description={`Session date: ${formatDate(serializedSession.sessionDate)}. Track live buy-ins during play, then finalize once cash-outs are complete.`}
        actions={
          <div className="flex flex-wrap gap-3">
            <Link
              href="/sessions"
              className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--ink-1)] transition hover:border-[var(--ink-1)]"
            >
              Back to history
            </Link>
            <Link
              href="/sessions/new"
              className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--ink-1)] transition hover:border-[var(--ink-1)]"
            >
              New session
            </Link>
            <FinalizeSessionButton
              sessionId={serializedSession.id}
              finalizedAt={serializedSession.finalizedAt}
            />
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Status"
          value={serializedSession.finalizedAt ? "Finalized" : "Live draft"}
          helper={
            serializedSession.finalizedAt
              ? `Closed ${formatDateTime(serializedSession.finalizedAt)}`
              : "Session can still be updated"
          }
        />
        <StatCard
          label="Participants"
          value={String(serializedSession.sessionPlayers.length)}
          helper={serializedSession.finalizedAt ? "Locked roster" : "Players currently seated"}
        />
        <StatCard label="Total Buy-in" value={formatCurrency(serializedSession.totalBuyin)} />
        <StatCard label="Current Chips" value={formatCurrency(serializedSession.totalCashout)} />
        <StatCard
          label="Created"
          value={formatDate(serializedSession.createdAt)}
          helper={`Updated ${formatDateTime(serializedSession.updatedAt)}`}
        />
      </section>

      <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-1)] px-6 py-5 shadow-[0_18px_70px_rgba(24,21,17,0.06)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ink-3)]">
              Session workflow
            </p>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-[var(--ink-1)]">
              Live table management
            </h2>
            <p className="mt-1 text-sm text-[var(--ink-2)]">
              Add rebuys as they happen, keep current chips updated, and finalize once the game is
              over.
            </p>
          </div>
          <SessionStatusBadge finalizedAt={serializedSession.finalizedAt} />
        </div>
      </div>

      {serializedSession.notes ? (
        <SectionCard title="Notes">
          <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--ink-2)]">
            {serializedSession.notes}
          </p>
        </SectionCard>
      ) : null}

      <SectionCard
        title="Session tracker"
        description={
          serializedSession.finalizedAt
            ? `Finalized on ${formatDateTime(serializedSession.finalizedAt)}. Values below are locked into lifetime player history.`
            : "This live table is optimized for in-session use. Add buy-ins and update current chips directly from each row."
        }
      >
        <SessionSettlementTable
          session={serializedSession}
          availablePlayers={serializedRosterPlayers}
        />
      </SectionCard>
    </div>
  );
}
