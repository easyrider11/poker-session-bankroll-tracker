"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { SessionStatusBadge } from "@/components/session-status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  formatCurrency,
  formatSignedCurrency,
  parseMoneyToCents,
  sumMoney,
} from "@/lib/amounts";
import type {
  SerializedPlayer,
  SerializedSession,
  SerializedSessionPlayer,
} from "@/lib/serializers";
import { cn, formatDateTime } from "@/lib/utils";

type SortMode = "seat" | "profit-desc" | "profit-asc";

function centsToInput(amount: number) {
  const dollars = amount / 100;
  return Number.isInteger(dollars)
    ? String(dollars)
    : dollars.toFixed(2).replace(/\.?0+$/, "");
}

export function SessionSettlementTable({
  session,
  availablePlayers,
}: {
  session: SerializedSession;
  availablePlayers: SerializedPlayer[];
}) {
  const router = useRouter();
  const [sessionPlayers, setSessionPlayers] = useState(session.sessionPlayers);
  const [sortMode, setSortMode] = useState<SortMode>("seat");
  const [addPlayerId, setAddPlayerId] = useState("");
  const [buyinInputs, setBuyinInputs] = useState<Record<number, string>>({});
  const [cashoutInputs, setCashoutInputs] = useState<Record<number, string>>(() =>
    Object.fromEntries(
      session.sessionPlayers.map((player) => [player.id, centsToInput(player.totalCashout)]),
    ),
  );
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setSessionPlayers(session.sessionPlayers);
    setCashoutInputs(
      Object.fromEntries(
        session.sessionPlayers.map((player) => [player.id, centsToInput(player.totalCashout)]),
      ),
    );
  }, [session.sessionPlayers]);

  const openRosterPlayers = useMemo(() => {
    const seatedIds = new Set(sessionPlayers.map((player) => player.playerId));
    return availablePlayers.filter((player) => !seatedIds.has(player.id));
  }, [availablePlayers, sessionPlayers]);

  useEffect(() => {
    if (openRosterPlayers.length === 0) {
      setAddPlayerId("");
      return;
    }

    if (!openRosterPlayers.some((player) => String(player.id) === addPlayerId)) {
      setAddPlayerId(String(openRosterPlayers[0].id));
    }
  }, [addPlayerId, openRosterPlayers]);

  const sortedPlayers = useMemo(() => {
    const next = [...sessionPlayers];

    if (sortMode === "profit-desc") {
      next.sort((left, right) => right.profit - left.profit);
    } else if (sortMode === "profit-asc") {
      next.sort((left, right) => left.profit - right.profit);
    }

    return next;
  }, [sessionPlayers, sortMode]);

  const totals = useMemo(
    () => ({
      totalBuyin: sumMoney(sessionPlayers.map((player) => player.totalBuyin)),
      totalCashout: sumMoney(sessionPlayers.map((player) => player.totalCashout)),
      totalProfit: sumMoney(sessionPlayers.map((player) => player.profit)),
    }),
    [sessionPlayers],
  );

  const isFinalized = Boolean(session.finalizedAt);

  function replaceSessionPlayer(nextPlayer: SerializedSessionPlayer) {
    setSessionPlayers((current) =>
      current.map((player) => (player.id === nextPlayer.id ? nextPlayer : player)),
    );
    setCashoutInputs((current) => ({
      ...current,
      [nextPlayer.id]: centsToInput(nextPlayer.totalCashout),
    }));
  }

  function appendSessionPlayer(nextPlayer: SerializedSessionPlayer) {
    setSessionPlayers((current) => [...current, nextPlayer]);
    setCashoutInputs((current) => ({
      ...current,
      [nextPlayer.id]: centsToInput(nextPlayer.totalCashout),
    }));
  }

  function runMutation(actionKey: string, task: () => Promise<void>) {
    setError(null);
    setPendingAction(actionKey);

    startTransition(async () => {
      try {
        await task();
        router.refresh();
      } catch (mutationError) {
        setError(
          mutationError instanceof Error ? mutationError.message : "Could not update session.",
        );
      } finally {
        setPendingAction(null);
      }
    });
  }

  function handleAddPlayer() {
    if (!addPlayerId) {
      return;
    }

    runMutation("add-player", async () => {
      const response = await fetch(`/api/sessions/${session.id}/players`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerId: Number(addPlayerId),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Could not add player to session.");
      }

      appendSessionPlayer(data.sessionPlayer as SerializedSessionPlayer);
    });
  }

  function handleAddBuyin(sessionPlayerId: number) {
    const rawValue = (buyinInputs[sessionPlayerId] ?? "").trim();
    const amountCents = parseMoneyToCents(rawValue);

    if (amountCents === null || amountCents <= 0) {
      setError("Buy-ins must be greater than zero.");
      return;
    }

    runMutation(`buyin-${sessionPlayerId}`, async () => {
      const response = await fetch(`/api/session-players/${sessionPlayerId}/buyins`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: rawValue,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Could not add buy-in.");
      }

      replaceSessionPlayer(data.sessionPlayer as SerializedSessionPlayer);
      setBuyinInputs((current) => ({
        ...current,
        [sessionPlayerId]: "",
      }));
    });
  }

  function handleSaveCashout(sessionPlayerId: number) {
    const rawValue = (cashoutInputs[sessionPlayerId] ?? "").trim();
    const cashoutValue = rawValue || "0";
    const amountCents = parseMoneyToCents(cashoutValue);

    if (amountCents === null || amountCents < 0) {
      setError("Current chips or cash-out must be a non-negative amount.");
      return;
    }

    runMutation(`cashout-${sessionPlayerId}`, async () => {
      const response = await fetch(`/api/session-players/${sessionPlayerId}/cashout`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cashout: cashoutValue,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Could not update chips.");
      }

      replaceSessionPlayer(data.sessionPlayer as SerializedSessionPlayer);
    });
  }

  function buyinList(player: SerializedSessionPlayer) {
    if (player.additionalBuyins.length === 0) {
      return <span className="text-[var(--ink-3)]">No add-ons yet</span>;
    }

    return (
      <div className="flex flex-wrap gap-2">
        {player.additionalBuyins.map((record) => (
          <span
            key={record.id}
            className="rounded-full bg-[var(--surface-0)] px-2.5 py-1 text-xs font-medium text-[var(--ink-2)]"
          >
            {formatCurrency(record.amount)}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="rounded-[24px] border border-[var(--line)] bg-[var(--surface-0)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ink-3)]">
                Session status
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <SessionStatusBadge finalizedAt={session.finalizedAt} />
                <span className="text-sm text-[var(--ink-2)]">
                  {session.finalizedAt
                    ? `Finalized ${formatDateTime(session.finalizedAt)}`
                    : "Track live buy-ins now. Finalize once cash-outs are locked."}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant={sortMode === "seat" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setSortMode("seat")}
              >
                Seat order
              </Button>
              <Button
                variant={sortMode === "profit-desc" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setSortMode("profit-desc")}
              >
                Winners first
              </Button>
              <Button
                variant={sortMode === "profit-asc" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setSortMode("profit-asc")}
              >
                Losers first
              </Button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[20px] border border-[var(--line)] bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ink-3)]">
                Total buy-in
              </p>
              <p className="mt-2 text-xl font-bold tracking-tight text-[var(--ink-1)]">
                {formatCurrency(totals.totalBuyin)}
              </p>
            </div>
            <div className="rounded-[20px] border border-[var(--line)] bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ink-3)]">
                Total current chips
              </p>
              <p className="mt-2 text-xl font-bold tracking-tight text-[var(--ink-1)]">
                {formatCurrency(totals.totalCashout)}
              </p>
            </div>
            <div className="rounded-[20px] border border-[var(--line)] bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ink-3)]">
                Session net
              </p>
              <p
                className={cn(
                  "mt-2 text-xl font-bold tracking-tight",
                  totals.totalProfit > 0
                    ? "text-[var(--positive)]"
                    : totals.totalProfit < 0
                      ? "text-[var(--negative)]"
                      : "text-[var(--ink-1)]",
                )}
              >
                {formatSignedCurrency(totals.totalProfit)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-[var(--line)] bg-[var(--surface-0)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ink-3)]">
            Table management
          </p>
          <h3 className="mt-2 text-lg font-bold tracking-tight text-[var(--ink-1)]">
            {isFinalized ? "Session is locked" : "Seat another historical player"}
          </h3>
          <p className="mt-1 text-sm text-[var(--ink-2)]">
            {isFinalized
              ? "No more changes can be made after finalization."
              : "Use this if someone joins late. Their initial buy-in can be added immediately after seating them."}
          </p>

          {isFinalized ? null : openRosterPlayers.length === 0 ? (
            <div className="mt-4 rounded-[20px] border border-dashed border-[var(--line)] bg-white px-4 py-4 text-sm text-[var(--ink-2)]">
              Everyone in the saved roster is already seated in this session.
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <select
                value={addPlayerId}
                onChange={(event) => setAddPlayerId(event.target.value)}
                className="h-11 w-full rounded-2xl border border-[var(--line)] bg-white px-4 text-sm text-[var(--ink-1)] outline-none transition focus:border-[var(--ink-1)]"
              >
                {openRosterPlayers.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                    {player.nickname ? ` (${player.nickname})` : ""}
                  </option>
                ))}
              </select>

              <Button
                onClick={handleAddPlayer}
                disabled={isPending && pendingAction === "add-player"}
                className="w-full sm:w-auto"
              >
                {isPending && pendingAction === "add-player" ? "Adding..." : "Add player"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {error ? <p className="text-sm font-medium text-[var(--negative)]">{error}</p> : null}

      <div className="space-y-4 md:hidden">
        {sortedPlayers.map((player) => (
          <div
            key={player.id}
            className="rounded-[24px] border border-[var(--line)] bg-white p-4 shadow-[0_10px_40px_rgba(24,21,17,0.04)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link
                  href={`/players/${player.playerId}`}
                  className="text-lg font-bold tracking-tight text-[var(--ink-1)] transition hover:text-[var(--accent)]"
                >
                  {player.playerName}
                </Link>
                <p className="mt-1 text-sm text-[var(--ink-3)]">
                  {player.playerNickname ? player.playerNickname : "No nickname"}
                </p>
              </div>
              <div
                className={cn(
                  "text-right text-xl font-extrabold tracking-tight",
                  player.profit > 0
                    ? "text-[var(--positive)]"
                    : player.profit < 0
                      ? "text-[var(--negative)]"
                      : "text-[var(--ink-2)]",
                )}
              >
                {formatSignedCurrency(player.profit)}
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[20px] bg-[var(--surface-0)] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ink-3)]">
                  Initial buy-in
                </p>
                <p className="mt-2 font-semibold text-[var(--ink-1)]">
                  {formatCurrency(player.initialBuyin)}
                </p>
              </div>
              <div className="rounded-[20px] bg-[var(--surface-0)] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ink-3)]">
                  Total buy-in
                </p>
                <p className="mt-2 font-semibold text-[var(--ink-1)]">
                  {formatCurrency(player.totalBuyin)}
                </p>
              </div>
              <div className="rounded-[20px] bg-[var(--surface-0)] px-4 py-3 sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ink-3)]">
                  Additional buy-ins
                </p>
                <div className="mt-2">{buyinList(player)}</div>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                <Input
                  inputMode="decimal"
                  placeholder="Add buy-in amount"
                  value={buyinInputs[player.id] ?? ""}
                  onChange={(event) =>
                    setBuyinInputs((current) => ({
                      ...current,
                      [player.id]: event.target.value,
                    }))
                  }
                  disabled={isFinalized}
                />
                <Button
                  variant="secondary"
                  onClick={() => handleAddBuyin(player.id)}
                  disabled={isFinalized || (isPending && pendingAction === `buyin-${player.id}`)}
                >
                  {isPending && pendingAction === `buyin-${player.id}` ? "Saving..." : "Add buy-in"}
                </Button>
              </div>

              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                <Input
                  inputMode="decimal"
                  placeholder="Current chips / cash-out"
                  value={cashoutInputs[player.id] ?? ""}
                  onChange={(event) =>
                    setCashoutInputs((current) => ({
                      ...current,
                      [player.id]: event.target.value,
                    }))
                  }
                  disabled={isFinalized}
                />
                <Button
                  variant="secondary"
                  onClick={() => handleSaveCashout(player.id)}
                  disabled={isFinalized || (isPending && pendingAction === `cashout-${player.id}`)}
                >
                  {isPending && pendingAction === `cashout-${player.id}`
                    ? "Saving..."
                    : "Save chips"}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--line)] text-xs uppercase tracking-[0.24em] text-[var(--ink-3)]">
              <th className="pb-3 pr-4 font-medium">Player</th>
              <th className="pb-3 pr-4 font-medium">Initial Buy-in</th>
              <th className="pb-3 pr-4 font-medium">Additional Buy-ins</th>
              <th className="pb-3 pr-4 font-medium">Total Buy-in</th>
              <th className="pb-3 pr-4 font-medium">Current Chips / Cash-out</th>
              <th className="pb-3 pr-4 font-medium">Profit / Loss</th>
              <th className="pb-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.map((player) => (
              <tr key={player.id} className="border-b border-[var(--line)]/70 align-top last:border-b-0">
                <td className="py-4 pr-4">
                  <Link
                    href={`/players/${player.playerId}`}
                    className="font-semibold text-[var(--ink-1)] transition hover:text-[var(--accent)]"
                  >
                    {player.playerName}
                  </Link>
                  <div className="mt-1 text-xs text-[var(--ink-3)]">
                    {player.playerNickname ? player.playerNickname : "No nickname"}
                  </div>
                </td>
                <td className="py-4 pr-4 font-medium">{formatCurrency(player.initialBuyin)}</td>
                <td className="py-4 pr-4">
                  <div className="max-w-xs">{buyinList(player)}</div>
                </td>
                <td className="py-4 pr-4 font-medium">{formatCurrency(player.totalBuyin)}</td>
                <td className="py-4 pr-4">
                  {isFinalized ? (
                    <div className="font-medium text-[var(--ink-1)]">
                      {formatCurrency(player.totalCashout)}
                    </div>
                  ) : (
                    <div className="min-w-[220px] space-y-2">
                      <Input
                        inputMode="decimal"
                        placeholder="0"
                        value={cashoutInputs[player.id] ?? ""}
                        onChange={(event) =>
                          setCashoutInputs((current) => ({
                            ...current,
                            [player.id]: event.target.value,
                          }))
                        }
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleSaveCashout(player.id)}
                        disabled={isPending && pendingAction === `cashout-${player.id}`}
                      >
                        {isPending && pendingAction === `cashout-${player.id}`
                          ? "Saving..."
                          : "Save chips"}
                      </Button>
                    </div>
                  )}
                </td>
                <td
                  className={cn(
                    "py-4 pr-4 text-lg font-extrabold",
                    player.profit > 0
                      ? "text-[var(--positive)]"
                      : player.profit < 0
                        ? "text-[var(--negative)]"
                        : "text-[var(--ink-2)]",
                  )}
                >
                  {formatSignedCurrency(player.profit)}
                </td>
                <td className="py-4">
                  {isFinalized ? (
                    <span className="text-sm text-[var(--ink-3)]">Locked</span>
                  ) : (
                    <div className="min-w-[220px] space-y-2">
                      <Input
                        inputMode="decimal"
                        placeholder="Buy-in amount"
                        value={buyinInputs[player.id] ?? ""}
                        onChange={(event) =>
                          setBuyinInputs((current) => ({
                            ...current,
                            [player.id]: event.target.value,
                          }))
                        }
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleAddBuyin(player.id)}
                        disabled={isPending && pendingAction === `buyin-${player.id}`}
                      >
                        {isPending && pendingAction === `buyin-${player.id}`
                          ? "Saving..."
                          : "Add buy-in"}
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-[var(--line)] text-sm font-semibold text-[var(--ink-1)]">
              <td className="pt-4 pr-4">Session total</td>
              <td className="pt-4 pr-4">{sessionPlayers.length} players</td>
              <td className="pt-4 pr-4">Live tracking</td>
              <td className="pt-4 pr-4">{formatCurrency(totals.totalBuyin)}</td>
              <td className="pt-4 pr-4">{formatCurrency(totals.totalCashout)}</td>
              <td
                className={cn(
                  "pt-4 pr-4 text-lg",
                  totals.totalProfit > 0
                    ? "text-[var(--positive)]"
                    : totals.totalProfit < 0
                      ? "text-[var(--negative)]"
                      : "text-[var(--ink-2)]",
                )}
              >
                {formatSignedCurrency(totals.totalProfit)}
              </td>
              <td className="pt-4 text-[var(--ink-3)]">
                {isFinalized ? "Closed" : "Open"}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
