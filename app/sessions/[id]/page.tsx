import Link from "next/link";
import { notFound } from "next/navigation";

import { SessionStatusBadge } from "@/components/session-status-badge";
import { DeleteSessionButton } from "@/components/sessions/delete-session-button";
import { SessionSettlementTable } from "@/components/sessions/session-settlement-table";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { prisma } from "@/lib/prisma";
import {
  serializeSession,
  serializeSessionRosterPlayer,
  sessionDetailInclude,
} from "@/lib/serializers";
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
      select: {
        id: true,
        name: true,
        nickname: true,
      },
      orderBy: [{ name: "asc" }],
    }),
  ]);

  if (!session) {
    notFound();
  }

  const serializedSession = serializeSession(session);
  const serializedRosterPlayers = rosterPlayers.map(serializeSessionRosterPlayer);

  return (
    <div className="space-y-8">
      <PageHeader
        title={serializedSession.title}
        description={`Session date: ${formatDate(serializedSession.sessionDate)}. Use the live tracker below to record rebuys, keep stacks current, and finalize when everyone is settled.`}
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
            <DeleteSessionButton
              sessionId={serializedSession.id}
              finalizedAt={serializedSession.finalizedAt}
            />
          </div>
        }
      />

      <section className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-1)] p-6 shadow-[0_18px_70px_rgba(24,21,17,0.06)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <SessionStatusBadge finalizedAt={serializedSession.finalizedAt} />
              <span className="text-sm font-medium text-[var(--ink-2)]">
                Session date {formatDate(serializedSession.sessionDate)}
              </span>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ink-3)]">
                Session overview
              </p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[var(--ink-1)]">
                {serializedSession.finalizedAt
                  ? "Final numbers are locked"
                  : "Live updates should stay fast and obvious"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-2)]">
                {serializedSession.finalizedAt
                  ? `Finalized on ${formatDateTime(serializedSession.finalizedAt)}. The tracker below now acts as a clean audit trail for each player's buy-ins, chips, and result.`
                  : "Keep the table current from the player cards below: add rebuys as they happen, update current chips whenever stacks change, and finalize once everyone is settled."}
              </p>
            </div>
          </div>

          <div className="rounded-[24px] border border-[var(--line)] bg-white px-4 py-4 lg:min-w-[250px]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ink-3)]">
              Session status
            </p>
            <p className="mt-2 text-lg font-bold tracking-tight text-[var(--ink-1)]">
              {serializedSession.finalizedAt ? "Closed and locked" : "Open for live updates"}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-2)]">
              {serializedSession.finalizedAt
                ? `Finalized ${formatDateTime(serializedSession.finalizedAt)}`
                : `Created ${formatDate(serializedSession.createdAt)}`}
            </p>
          </div>
        </div>
      </section>

      {serializedSession.notes ? (
        <SectionCard title="Notes">
          <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--ink-2)]">
            {serializedSession.notes}
          </p>
        </SectionCard>
      ) : null}

      <SessionSettlementTable
        session={serializedSession}
        availablePlayers={serializedRosterPlayers}
      />
    </div>
  );
}
