"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";

import { SessionStatusBadge } from "@/components/session-status-badge";
import { FinalizeSessionButton } from "@/components/sessions/finalize-session-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  formatCurrency,
  formatSignedCurrency,
  parseMoneyToCents,
  sumMoney,
} from "@/lib/amounts";
import type {
  SerializedSessionRosterPlayer,
  SerializedSession,
  SerializedSessionPlayer,
} from "@/lib/serializers";
import { cn, formatDateTime } from "@/lib/utils";

type SortMode = "seat" | "profit-desc" | "profit-asc";

type TrackerMetricCardProps = {
  label: string;
  value: string;
  helper: string;
  tone?: "neutral" | "positive" | "negative";
};

type SortButtonProps = {
  active: boolean;
  label: string;
  onClick: () => void;
};

function centsToInput(amount: number) {
  const dollars = amount / 100;
  return Number.isInteger(dollars)
    ? String(dollars)
    : dollars.toFixed(2).replace(/\.?0+$/, "");
}

function getMoneyTextClass(amount: number) {
  if (amount > 0) {
    return "text-[var(--positive)]";
  }

  if (amount < 0) {
    return "text-[var(--negative)]";
  }

  return "text-[var(--ink-1)]";
}

function TrackerMetricCard({
  label,
  value,
  helper,
  tone = "neutral",
}: TrackerMetricCardProps) {
  const toneClasses = {
    neutral: "border-[var(--line)] bg-white text-[var(--ink-1)]",
    positive: "border-emerald-200 bg-emerald-50 text-[var(--positive)]",
    negative: "border-rose-200 bg-rose-50 text-[var(--negative)]",
  } as const;

  return (
    <div
      className={cn(
        "rounded-[22px] border p-4 shadow-[0_10px_40px_rgba(24,21,17,0.04)]",
        toneClasses[tone],
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ink-3)]">
        {label}
      </p>
      <p className="mt-3 text-2xl font-extrabold tracking-tight">{value}</p>
      <p className="mt-2 text-sm text-[var(--ink-2)]">{helper}</p>
    </div>
  );
}

function SortButton({ active, label, onClick }: SortButtonProps) {
  return (
    <Button variant={active ? "primary" : "secondary"} size="sm" onClick={onClick}>
      {label}
    </Button>
  );
}

export function SessionSettlementTable({
  session,
  availablePlayers,
}: {
  session: SerializedSession;
  availablePlayers: SerializedSessionRosterPlayer[];
}) {
  const [sessionPlayers, setSessionPlayers] = useState(session.sessionPlayers);
  const [finalizedAt, setFinalizedAt] = useState(session.finalizedAt);
  const [sortMode, setSortMode] = useState<SortMode>("seat");
  const [addPlayerId, setAddPlayerId] = useState("");
  const [buyinInputs, setBuyinInputs] = useState<Record<number, string>>({});
  const [cashoutInputs, setCashoutInputs] = useState<Record<number, string>>(() =>
    Object.fromEntries(
      session.sessionPlayers.map((player) => [player.id, centsToInput(player.totalCashout)]),
    ),
  );
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setSessionPlayers(session.sessionPlayers);
    setFinalizedAt(session.finalizedAt);
    setCashoutInputs(
      Object.fromEntries(
        session.sessionPlayers.map((player) => [player.id, centsToInput(player.totalCashout)]),
      ),
    );
    setIsFinalizing(false);
  }, [session.finalizedAt, session.sessionPlayers]);

  const openRosterPlayers = useMemo(() => {
    const seatedIds = new Set(sessionPlayers.map((player) => player.playerId));
    return availablePlayers.filter((player) => !seatedIds.has(player.id));
  }, [availablePlayers, sessionPlayers]);

  const sessionPlayerLookup = useMemo(
    () => new Map(sessionPlayers.map((player) => [player.id, player])),
    [sessionPlayers],
  );

  useEffect(() => {
    if (openRosterPlayers.length === 0) {
      setAddPlayerId("");
      return;
    }

    if (!openRosterPlayers.some((player) => String(player.id) === addPlayerId)) {
      setAddPlayerId(String(openRosterPlayers[0].id));
    }
  }, [addPlayerId, openRosterPlayers]);

  const seatNumbers = useMemo(
    () => new Map(sessionPlayers.map((player, index) => [player.id, index + 1])),
    [sessionPlayers],
  );

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

  const isFinalized = Boolean(finalizedAt);
  const isInteractionLocked = isFinalized || isFinalizing;

  function clearError() {
    setError(null);
  }

  function setSuccessMessage(message: string) {
    setError(null);
    setStatusMessage(message);
  }

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
    setStatusMessage(null);
    setPendingAction(actionKey);

    startTransition(async () => {
      try {
        await task();
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
    if (!addPlayerId || isInteractionLocked) {
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

      const nextPlayer = data.sessionPlayer as SerializedSessionPlayer;
      appendSessionPlayer(nextPlayer);
      setSuccessMessage(`${nextPlayer.playerName} is seated. Add their opening buy-in next.`);
    });
  }

  function handleAddBuyin(sessionPlayerId: number) {
    if (isInteractionLocked) {
      return;
    }

    const rawValue = (buyinInputs[sessionPlayerId] ?? "").trim();
    const amountCents = parseMoneyToCents(rawValue);
    const player = sessionPlayerLookup.get(sessionPlayerId);
    const playerName = player?.playerName ?? "That player";

    if (amountCents === null || amountCents <= 0) {
      setError(`Enter a buy-in greater than zero for ${playerName}.`);
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
      setSuccessMessage(`Added a buy-in for ${playerName}.`);
    });
  }

  function handleSaveCashout(sessionPlayerId: number) {
    if (isInteractionLocked) {
      return;
    }

    const rawValue = (cashoutInputs[sessionPlayerId] ?? "").trim();
    const cashoutValue = rawValue || "0";
    const amountCents = parseMoneyToCents(cashoutValue);
    const player = sessionPlayerLookup.get(sessionPlayerId);
    const playerName = player?.playerName ?? "That player";

    if (amountCents === null || amountCents < 0) {
      setError(`Enter a non-negative chips amount for ${playerName}.`);
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
      setSuccessMessage(`Saved chips for ${playerName}.`);
    });
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-1)] p-6 shadow-[0_18px_70px_rgba(24,21,17,0.06)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-2xl space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <SessionStatusBadge finalizedAt={finalizedAt} />
                <span className="text-sm font-medium text-[var(--ink-2)]">
                  {finalizedAt
                    ? `Finalized ${formatDateTime(finalizedAt)}`
                    : isFinalizing
                      ? "Finalizing session and locking the results now."
                      : "Live updates stay open until you finalize the session."}
                </span>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ink-3)]">
                  Live tracker
                </p>
                <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[var(--ink-1)]">
                  {isFinalized
                    ? "Final results are locked in"
                    : isFinalizing
                      ? "Locking the session now"
                      : "Keep the table current as play moves"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[var(--ink-2)]">
                  {isFinalized
                    ? "This session is closed. The player cards below stay available as an audit trail of buy-ins, chips, and profit."
                    : isFinalizing
                      ? "Hold edits for a moment while the session flips into its finalized, locked state."
                      : "Each player card keeps the two live actions together: add a rebuy when someone reloads, then update current chips or final cash-out as stacks change."}
                </p>
              </div>
            </div>

            <div className="rounded-[24px] border border-[var(--line)] bg-white px-4 py-3 sm:min-w-[220px]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ink-3)]">
                Next step
              </p>
              <p className="mt-2 text-base font-semibold tracking-tight text-[var(--ink-1)]">
                {isFinalized
                  ? "Review the locked totals."
                  : isFinalizing
                    ? "Waiting for finalized results."
                    : "Work through the player cards, then finalize when the table settles."}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-2)]">
                {isFinalized
                  ? "No more edits can be made."
                  : isFinalizing
                    ? "The player list will lock as soon as the refresh completes."
                    : "Use sorting if you want to surface winners or losers first while the session is still active."}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <TrackerMetricCard
              label="Players seated"
              value={String(sessionPlayers.length)}
              helper={
                isFinalized ? "Final roster" : "Late arrivals can still be seated below."
              }
            />
            <TrackerMetricCard
              label="Total buy-in"
              value={formatCurrency(totals.totalBuyin)}
              helper="All opening buy-ins plus rebuys."
            />
            <TrackerMetricCard
              label="Current chips"
              value={formatCurrency(totals.totalCashout)}
              helper={isFinalized ? "Final recorded cash-out." : "Current table value from saved player stacks."}
            />
            <TrackerMetricCard
              label="Session net"
              value={formatSignedCurrency(totals.totalProfit)}
              helper="Current profit and loss across the full table."
              tone={
                totals.totalProfit > 0
                  ? "positive"
                  : totals.totalProfit < 0
                    ? "negative"
                    : "neutral"
              }
            />
          </div>

          <div className="mt-6 rounded-[24px] border border-[var(--line)] bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ink-3)]">
                  Sort players
                </p>
                <p className="mt-1 text-sm text-[var(--ink-2)]">
                  Choose the view that is easiest to manage during the session.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <SortButton active={sortMode === "seat"} label="Seat order" onClick={() => setSortMode("seat")} />
                <SortButton
                  active={sortMode === "profit-desc"}
                  label="Winners first"
                  onClick={() => setSortMode("profit-desc")}
                />
                <SortButton
                  active={sortMode === "profit-asc"}
                  label="Losers first"
                  onClick={() => setSortMode("profit-asc")}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-1)] p-6 shadow-[0_18px_70px_rgba(24,21,17,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ink-3)]">
              Table actions
            </p>
            <h3 className="mt-2 text-xl font-bold tracking-tight text-[var(--ink-1)]">
              {isFinalized ? "Session is locked" : "Seat a late player"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-2)]">
              {isFinalized
                ? "No additional players or bankroll changes can be recorded after finalization."
                : "If someone joins after the session starts, seat them here first and then record their buy-in from their player card."}
            </p>

            {isInteractionLocked ? null : openRosterPlayers.length === 0 ? (
              <div className="mt-4 rounded-[22px] border border-dashed border-[var(--line)] bg-white px-4 py-5 text-sm text-[var(--ink-2)]">
                Everyone in the saved roster is already seated in this session.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <select
                  value={addPlayerId}
                  onChange={(event) => {
                    clearError();
                    setAddPlayerId(event.target.value);
                  }}
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
                  disabled={!addPlayerId || isInteractionLocked || (isPending && pendingAction === "add-player")}
                  className="w-full"
                >
                  {isPending && pendingAction === "add-player" ? "Adding..." : "Seat player"}
                </Button>
              </div>
            )}
          </div>

          <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-1)] p-6 shadow-[0_18px_70px_rgba(24,21,17,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ink-3)]">
              Finalize
            </p>
            <h3 className="mt-2 text-xl font-bold tracking-tight text-[var(--ink-1)]">
              {isFinalized ? "Session already finalized" : "Lock the session when stacks are settled"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-2)]">
              {isFinalized
                ? "The final results are already written into lifetime player history."
                : "Finalize only after every player has their latest chips or cash-out saved. This keeps lifetime totals accurate."}
            </p>

            <FinalizeSessionButton
              sessionId={session.id}
              finalizedAt={finalizedAt}
              className="mt-4"
              buttonClassName="w-full"
              onPendingChange={setIsFinalizing}
              onFinalized={(nextSession) => {
                setFinalizedAt(nextSession.finalizedAt);
                setSessionPlayers(nextSession.sessionPlayers);
                setCashoutInputs(
                  Object.fromEntries(
                    nextSession.sessionPlayers.map((player) => [
                      player.id,
                      centsToInput(player.totalCashout),
                    ]),
                  ),
                );
                setPendingAction(null);
                setStatusMessage(null);
                setIsFinalizing(false);
              }}
            />
          </div>
        </div>
      </section>

      {isFinalizing ? (
        <div className="rounded-[22px] border border-[var(--line)] bg-[var(--accent-soft)] px-4 py-3 text-sm font-medium text-[var(--ink-1)]">
          Finalizing session and locking bankroll results now.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-[var(--negative)]">
          {error}
        </div>
      ) : null}

      {statusMessage ? (
        <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-[var(--positive)]">
          {statusMessage}
        </div>
      ) : null}

      {sortedPlayers.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-[var(--line)] bg-[var(--surface-1)] px-6 py-12 text-center shadow-[0_18px_70px_rgba(24,21,17,0.06)]">
          <h3 className="text-xl font-bold tracking-tight text-[var(--ink-1)]">No players seated yet</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--ink-2)]">
            Seat a player to start recording buy-ins and current chips.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedPlayers.map((player) => {
            const seatNumber = seatNumbers.get(player.id);
            const buyinPending = isPending && pendingAction === `buyin-${player.id}`;
            const cashoutPending = isPending && pendingAction === `cashout-${player.id}`;
            const rawBuyinValue = (buyinInputs[player.id] ?? "").trim();
            const buyinCents = parseMoneyToCents(rawBuyinValue);
            const buyinIsValid = rawBuyinValue !== "" && buyinCents !== null && buyinCents > 0;
            const rawCashoutValue = (cashoutInputs[player.id] ?? "").trim();
            const normalizedCashoutValue = rawCashoutValue || "0";
            const cashoutCents = parseMoneyToCents(normalizedCashoutValue);
            const cashoutIsValid = cashoutCents !== null && cashoutCents >= 0;
            const cashoutHasChanged = cashoutIsValid && cashoutCents !== player.totalCashout;

            return (
              <article
                key={player.id}
                className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-1)] p-5 shadow-[0_18px_70px_rgba(24,21,17,0.06)]"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-[var(--surface-0)] px-3 py-1 text-xs font-semibold text-[var(--ink-2)]">
                        Seat {seatNumber}
                      </span>
                      <span className="rounded-full bg-[var(--surface-0)] px-3 py-1 text-xs font-semibold text-[var(--ink-2)]">
                        {player.buyinRecords.length} buy-ins logged
                      </span>
                    </div>

                    <div>
                      <Link
                        href={`/players/${player.playerId}`}
                        className="text-xl font-bold tracking-tight text-[var(--ink-1)] transition hover:text-[var(--accent)]"
                      >
                        {player.playerName}
                      </Link>
                      <p className="mt-1 text-sm text-[var(--ink-3)]">
                        {player.playerNickname ? player.playerNickname : "No nickname"}
                      </p>
                    </div>

                    <p className="text-sm text-[var(--ink-2)]">
                      Last updated {formatDateTime(player.updatedAt)}
                    </p>
                  </div>

                  <div className="rounded-[24px] border border-[var(--line)] bg-white px-4 py-4 lg:min-w-[240px]">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ink-3)]">
                      Current P/L
                    </p>
                    <p
                      className={cn(
                        "mt-2 text-3xl font-extrabold tracking-tight",
                        getMoneyTextClass(player.profit),
                      )}
                    >
                      {formatSignedCurrency(player.profit)}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--ink-2)]">
                      {formatCurrency(player.totalCashout)} in chips against{" "}
                      {formatCurrency(player.totalBuyin)} invested.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <TrackerMetricCard
                    label="Current chips"
                    value={formatCurrency(player.totalCashout)}
                    helper={isFinalized ? "Final recorded cash-out." : "Most recently saved stack."}
                  />
                  <TrackerMetricCard
                    label="Total buy-in"
                    value={formatCurrency(player.totalBuyin)}
                    helper="Opening buy-in plus every rebuy."
                  />
                  <TrackerMetricCard
                    label="Opening buy-in"
                    value={formatCurrency(player.initialBuyin)}
                    helper="First buy-in recorded for this player."
                  />
                  <TrackerMetricCard
                    label="Add-ons"
                    value={formatCurrency(player.additionalBuyinTotal)}
                    helper={
                      player.additionalBuyins.length > 0
                        ? `${player.additionalBuyins.length} rebuy${player.additionalBuyins.length === 1 ? "" : "s"} recorded.`
                        : "No rebuys yet."
                    }
                  />
                </div>

                <div className="mt-5 rounded-[24px] border border-[var(--line)] bg-white p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ink-3)]">
                        Buy-in history
                      </p>
                      <p className="mt-1 text-sm text-[var(--ink-2)]">
                        Opening buy-in followed by every later rebuy.
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-[var(--ink-1)]">{player.buyinDisplay}</p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {player.buyinRecords.map((record, index) => (
                      <span
                        key={record.id}
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-semibold",
                          index === 0
                            ? "bg-[var(--accent-soft)] text-[var(--ink-1)]"
                            : "bg-[var(--surface-0)] text-[var(--ink-2)]",
                        )}
                      >
                        {index === 0 ? "Opening " : "Rebuy "}
                        {formatCurrency(record.amount)}
                      </span>
                    ))}
                  </div>
                </div>

                {isFinalized ? (
                  <div className="mt-5 rounded-[24px] border border-[var(--line)] bg-white px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ink-3)]">
                      Locked result
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--ink-2)]">
                      This player&apos;s bankroll result is finalized and included in lifetime stats.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 grid gap-4 xl:grid-cols-2">
                    <div className="rounded-[24px] border border-[var(--line)] bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ink-3)]">
                        Add buy-in
                      </p>
                      <p className="mt-1 text-sm leading-6 text-[var(--ink-2)]">
                        Record a rebuy as soon as the player reloads.
                      </p>

                      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                        <Input
                          inputMode="decimal"
                          placeholder="Buy-in amount"
                          value={buyinInputs[player.id] ?? ""}
                          onChange={(event) => {
                            clearError();
                            setBuyinInputs((current) => ({
                              ...current,
                              [player.id]: event.target.value,
                            }));
                          }}
                          disabled={isInteractionLocked || buyinPending}
                        />
                        <Button
                          variant="secondary"
                          onClick={() => handleAddBuyin(player.id)}
                          disabled={!buyinIsValid || isInteractionLocked || buyinPending}
                          className="w-full sm:w-auto"
                        >
                          {buyinPending ? "Saving..." : "Add buy-in"}
                        </Button>
                      </div>
                      <p className="mt-3 text-sm text-[var(--ink-2)]">
                        {buyinIsValid && buyinCents !== null
                          ? `New total buy-in: ${formatCurrency(player.totalBuyin + buyinCents)}`
                          : "Enter a positive amount like 100 or 100.50."}
                      </p>
                    </div>

                    <div className="rounded-[24px] border border-[var(--line)] bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ink-3)]">
                        Current chips / cash-out
                      </p>
                      <p className="mt-1 text-sm leading-6 text-[var(--ink-2)]">
                        Save the latest stack whenever chips move or the player cashes out.
                      </p>

                      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                        <Input
                          inputMode="decimal"
                          placeholder="0"
                          value={cashoutInputs[player.id] ?? ""}
                          onChange={(event) => {
                            clearError();
                            setCashoutInputs((current) => ({
                              ...current,
                              [player.id]: event.target.value,
                            }));
                          }}
                          disabled={isInteractionLocked || cashoutPending}
                        />
                        <Button
                          variant="secondary"
                          onClick={() => handleSaveCashout(player.id)}
                          disabled={!cashoutIsValid || !cashoutHasChanged || isInteractionLocked || cashoutPending}
                          className="w-full sm:w-auto"
                        >
                          {cashoutPending ? "Saving..." : "Save chips"}
                        </Button>
                      </div>
                      <p className="mt-3 text-sm text-[var(--ink-2)]">
                        {!cashoutIsValid
                          ? "Use a non-negative amount."
                          : !cashoutHasChanged
                            ? "Already matches the saved stack."
                            : `Projected P/L: ${formatSignedCurrency(cashoutCents - player.totalBuyin)}`}
                      </p>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
