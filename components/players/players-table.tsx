import Link from "next/link";

import { DeletePlayerButton } from "@/components/players/delete-player-button";
import { formatCurrency, formatSignedCurrency } from "@/lib/amounts";
import type { SerializedPlayer } from "@/lib/serializers";

export function PlayersTable({ players }: { players: SerializedPlayer[] }) {
  return (
    <div className="space-y-4">
      <div className="space-y-3 md:hidden">
        {players.map((player) => (
          <div
            key={player.id}
            className="rounded-[24px] border border-[var(--line)] bg-white p-4 shadow-[0_10px_40px_rgba(24,21,17,0.04)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link
                  href={`/players/${player.id}`}
                  className="text-lg font-bold tracking-tight text-[var(--ink-1)] transition hover:text-[var(--accent)]"
                >
                  {player.name}
                </Link>
                <div className="mt-1 text-sm text-[var(--ink-3)]">
                  {player.nickname ? player.nickname : "No nickname"}
                </div>
              </div>

              <div
                className={`text-right text-lg font-extrabold tracking-tight ${
                  player.lifetimeProfit > 0
                    ? "text-[var(--positive)]"
                    : player.lifetimeProfit < 0
                      ? "text-[var(--negative)]"
                      : "text-[var(--ink-2)]"
                }`}
              >
                {formatSignedCurrency(player.lifetimeProfit)}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-[20px] bg-[var(--surface-0)] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ink-3)]">
                  Sessions
                </p>
                <p className="mt-2 font-semibold text-[var(--ink-1)]">{player.totalSessions}</p>
              </div>
              <div className="rounded-[20px] bg-[var(--surface-0)] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ink-3)]">
                  Buy-in
                </p>
                <p className="mt-2 font-semibold text-[var(--ink-1)]">
                  {formatCurrency(player.lifetimeBuyin)}
                </p>
              </div>
              <div className="rounded-[20px] bg-[var(--surface-0)] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ink-3)]">
                  Cash-out
                </p>
                <p className="mt-2 font-semibold text-[var(--ink-1)]">
                  {formatCurrency(player.lifetimeCashout)}
                </p>
              </div>
              <div className="rounded-[20px] bg-[var(--surface-0)] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ink-3)]">
                  Profit
                </p>
                <p
                  className={`mt-2 font-semibold ${
                    player.lifetimeProfit > 0
                      ? "text-[var(--positive)]"
                      : player.lifetimeProfit < 0
                        ? "text-[var(--negative)]"
                        : "text-[var(--ink-2)]"
                  }`}
                >
                  {formatSignedCurrency(player.lifetimeProfit)}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href={`/players/${player.id}`}
                className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--line)] px-4 text-sm font-semibold text-[var(--ink-1)] transition hover:border-[var(--ink-1)]"
              >
                View history
              </Link>
              <DeletePlayerButton playerId={player.id} playerName={player.name} />
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--line)] text-xs uppercase tracking-[0.24em] text-[var(--ink-3)]">
              <th className="pb-3 pr-4 font-medium">Player</th>
              <th className="pb-3 pr-4 font-medium">Sessions</th>
              <th className="pb-3 pr-4 font-medium">Lifetime Buy-in</th>
              <th className="pb-3 pr-4 font-medium">Lifetime Cash-out</th>
              <th className="pb-3 pr-4 font-medium">Lifetime Profit</th>
              <th className="pb-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player) => (
              <tr key={player.id} className="border-b border-[var(--line)]/70 last:border-b-0">
                <td className="py-4 pr-4">
                  <Link
                    href={`/players/${player.id}`}
                    className="font-semibold text-[var(--ink-1)] transition hover:text-[var(--accent)]"
                  >
                    {player.name}
                  </Link>
                  <div className="mt-1 text-xs text-[var(--ink-3)]">
                    {player.nickname ? player.nickname : "No nickname"}
                  </div>
                </td>
                <td className="py-4 pr-4 text-[var(--ink-2)]">{player.totalSessions}</td>
                <td className="py-4 pr-4 font-medium">{formatCurrency(player.lifetimeBuyin)}</td>
                <td className="py-4 pr-4 font-medium">
                  {formatCurrency(player.lifetimeCashout)}
                </td>
                <td
                  className={`py-4 font-semibold ${
                    player.lifetimeProfit > 0
                      ? "text-[var(--positive)]"
                      : player.lifetimeProfit < 0
                        ? "text-[var(--negative)]"
                        : "text-[var(--ink-2)]"
                  }`}
                >
                  {formatSignedCurrency(player.lifetimeProfit)}
                </td>
                <td className="py-4">
                  <DeletePlayerButton playerId={player.id} playerName={player.name} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
