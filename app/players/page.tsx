import { Users, ArrowDownLeft, ArrowUpRight, TrendingUp, Plus } from "lucide-react";
import Link from "next/link";

import { AddPlayerForm } from "@/components/players/add-player-form";
import { PlayersTable } from "@/components/players/players-table";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatSignedCurrency } from "@/lib/amounts";
import { prisma } from "@/lib/prisma";
import { serializePlayer } from "@/lib/serializers";

export const dynamic = "force-dynamic";

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";

  const [players, totals] = await Promise.all([
    prisma.player.findMany({
      where: query
        ? {
            OR: [
              {
                name: {
                  contains: query,
                },
              },
              {
                nickname: {
                  contains: query,
                },
              },
            ],
          }
        : undefined,
      orderBy: [{ lifetimeProfit: "desc" }, { name: "asc" }],
    }),
    prisma.player.aggregate({
      _count: {
        id: true,
      },
      _sum: {
        lifetimeBuyin: true,
        lifetimeCashout: true,
        lifetimeProfit: true,
      },
    }),
  ]);

  const serializedPlayers = players.map(serializePlayer);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Players"
        description="Maintain a reusable roster, search quickly, and review each player's lifetime bankroll stats."
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
          label="Players"
          value={String(totals._count.id)}
          helper="Across the full roster"
          icon={Users}
        />
        <StatCard
          label="Lifetime Buy-ins"
          value={formatCurrency(totals._sum.lifetimeBuyin ?? 0)}
          helper="Finalized sessions only"
          icon={ArrowDownLeft}
        />
        <StatCard
          label="Lifetime Cash-outs"
          value={formatCurrency(totals._sum.lifetimeCashout ?? 0)}
          helper="Finalized sessions only"
          icon={ArrowUpRight}
        />
        <StatCard
          label="Lifetime Profit"
          value={formatSignedCurrency(totals._sum.lifetimeProfit ?? 0)}
          helper="Should net toward zero across the table"
          icon={TrendingUp}
          tone={
            (totals._sum.lifetimeProfit ?? 0) > 0
              ? "positive"
              : (totals._sum.lifetimeProfit ?? 0) < 0
                ? "negative"
                : "neutral"
          }
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <SectionCard
          title="Add player"
          description="Create a player once, then reuse them in every future session."
        >
          <AddPlayerForm />
        </SectionCard>

        <SectionCard
          title="Player list"
          description="Search by name or nickname. Click a player for lifetime detail and recent sessions."
        >
          <form className="mb-5 flex flex-col gap-3 sm:flex-row" method="GET">
            <Input
              name="q"
              placeholder="Search players"
              defaultValue={query}
              className="sm:max-w-md"
            />
            <div className="flex gap-3">
              <Button type="submit" variant="secondary">
                Search
              </Button>
              {query ? (
                <Link
                  href="/players"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--line)] px-4 text-sm font-semibold text-[var(--ink-1)] transition hover:border-[var(--ink-1)]"
                >
                  Clear
                </Link>
              ) : null}
            </div>
          </form>

          {serializedPlayers.length === 0 ? (
            <EmptyState
              title={query ? "No players found" : "No players yet"}
              description={
                query
                  ? "Try a different search term or clear the filter."
                  : "Add your first player to start building reusable session rosters."
              }
              icon={Users}
            />
          ) : (
            <PlayersTable players={serializedPlayers} />
          )}
        </SectionCard>
      </div>
    </div>
  );
}
