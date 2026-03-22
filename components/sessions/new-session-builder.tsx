"use client";

import { FormEvent, useDeferredValue, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatSignedCurrency, parseMoneyToCents, sumMoney } from "@/lib/amounts";
import type { SerializedPlayer } from "@/lib/serializers";

type BuyinMode = "shared" | "custom";

type DraftPlayer = {
  playerId: number;
  name: string;
  nickname: string | null;
  initialBuyin: string;
  lifetimeProfit: number;
  totalSessions: number;
};

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function sortPlayersByName(players: SerializedPlayer[]) {
  return [...players].sort((left, right) => left.name.localeCompare(right.name));
}

function getResolvedInitialBuyin(player: DraftPlayer, mode: BuyinMode, sharedInitialBuyin: string) {
  return mode === "shared" ? sharedInitialBuyin : player.initialBuyin;
}

export function NewSessionBuilder({ players }: { players: SerializedPlayer[] }) {
  const router = useRouter();
  const [title, setTitle] = useState(`Cash Game ${todayInputValue()}`);
  const [sessionDate, setSessionDate] = useState(todayInputValue());
  const [notes, setNotes] = useState("");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [historicalPlayers, setHistoricalPlayers] = useState(() => sortPlayersByName(players));
  const [selectedPlayers, setSelectedPlayers] = useState<DraftPlayer[]>([]);
  const [buyinMode, setBuyinMode] = useState<BuyinMode>("shared");
  const [sharedInitialBuyin, setSharedInitialBuyin] = useState("100");
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerNickname, setNewPlayerNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const availablePlayers = useMemo(() => {
    const selectedIds = new Set(selectedPlayers.map((player) => player.playerId));
    const normalizedSearch = deferredSearch.trim().toLowerCase();

    return historicalPlayers.filter((player) => {
      if (selectedIds.has(player.id)) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const haystack = `${player.name} ${player.nickname ?? ""}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [deferredSearch, historicalPlayers, selectedPlayers]);

  const selectedTotals = useMemo(() => {
    const totalInitialBuyin = sumMoney(
      selectedPlayers.map((player) => {
        const cents = parseMoneyToCents(
          getResolvedInitialBuyin(player, buyinMode, sharedInitialBuyin),
        );
        return cents ?? 0;
      }),
    );

    return {
      totalPlayers: selectedPlayers.length,
      totalInitialBuyin,
    };
  }, [buyinMode, selectedPlayers, sharedInitialBuyin]);

  function addPlayer(player: SerializedPlayer) {
    setSelectedPlayers((current) => [
      ...current,
      {
        playerId: player.id,
        name: player.name,
        nickname: player.nickname,
        initialBuyin: buyinMode === "shared" ? sharedInitialBuyin : "",
        lifetimeProfit: player.lifetimeProfit,
        totalSessions: player.totalSessions,
      },
    ]);
    setSuccess(null);
  }

  function removePlayer(playerId: number) {
    setSelectedPlayers((current) => current.filter((player) => player.playerId !== playerId));
  }

  function handleBuyinModeChange(nextMode: BuyinMode) {
    setBuyinMode(nextMode);

    if (nextMode === "custom") {
      setSelectedPlayers((current) =>
        current.map((player) => ({
          ...player,
          initialBuyin: player.initialBuyin || sharedInitialBuyin,
        })),
      );
    }
  }

  function updatePlayerInitialBuyin(playerId: number, value: string) {
    setSelectedPlayers((current) =>
      current.map((player) =>
        player.playerId === playerId
          ? {
              ...player,
              initialBuyin: value,
            }
          : player,
      ),
    );
  }

  async function handleQuickAddPlayer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/players", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: newPlayerName,
            nickname: newPlayerNickname,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error ?? "Could not add player.");
          return;
        }

        const nextPlayer = data.player as SerializedPlayer;
        setHistoricalPlayers((current) => sortPlayersByName([...current, nextPlayer]));
        addPlayer(nextPlayer);
        setNewPlayerName("");
        setNewPlayerNickname("");
        setSuccess(`${nextPlayer.name} was added to the roster and selected for this session.`);
      } catch {
        setError("Could not add player.");
      }
    });
  }

  function buildPayload():
    | { errorMessage: string }
    | {
        payload: {
          title: string;
          sessionDate: string;
          notes: string;
          players: Array<{
            playerId: number;
            buyins: string[];
            cashout: string;
          }>;
        };
      } {
    if (!title.trim()) {
      return { errorMessage: "Session title is required." };
    }

    if (selectedPlayers.length === 0) {
      return { errorMessage: "Select at least one player." };
    }

    if (buyinMode === "shared") {
      const sharedBuyinCents = parseMoneyToCents(sharedInitialBuyin.trim());

      if (sharedBuyinCents === null || sharedBuyinCents <= 0) {
        return { errorMessage: "Shared initial buy-in must be greater than zero." };
      }
    }

    const playersPayload = selectedPlayers.map((player) => {
      const initialBuyinValue = getResolvedInitialBuyin(player, buyinMode, sharedInitialBuyin).trim();
      const initialBuyinCents = parseMoneyToCents(initialBuyinValue);

      if (initialBuyinCents === null || initialBuyinCents <= 0) {
        throw new Error(player.name);
      }

      return {
        playerId: player.playerId,
        buyins: [initialBuyinValue],
        cashout: "0",
      };
    });

    return {
      payload: {
        title: title.trim(),
        sessionDate,
        notes,
        players: playersPayload,
      },
    };
  }

  function handleSubmit() {
    setError(null);
    setSuccess(null);

    let result: ReturnType<typeof buildPayload>;

    try {
      result = buildPayload();
    } catch (buildError) {
      const playerName = buildError instanceof Error ? buildError.message : "A player";
      setError(`${playerName} needs a valid initial buy-in greater than zero.`);
      return;
    }

    if ("errorMessage" in result) {
      setError(result.errorMessage);
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/sessions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(result.payload),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error ?? "Could not create session.");
          return;
        }

        router.push(`/sessions/${data.session.id}`);
        router.refresh();
      } catch {
        setError("Could not create session.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_340px]">
        <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-1)] p-6 shadow-[0_18px_70px_rgba(24,21,17,0.06)]">
          <div className="mb-5 flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ink-3)]">
              Step 1
            </p>
            <h2 className="text-xl font-bold tracking-tight text-[var(--ink-1)]">Session details</h2>
            <p className="text-sm text-[var(--ink-2)]">
              Create the shell of the game first. Live buy-ins and current chip counts happen on
              the next screen.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--ink-1)]" htmlFor="session-title">
                Session title
              </label>
              <Input
                id="session-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Friday Night $1/$3"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--ink-1)]" htmlFor="session-date">
                Session date
              </label>
              <Input
                id="session-date"
                type="date"
                value={sessionDate}
                onChange={(event) => setSessionDate(event.target.value)}
              />
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <label className="text-sm font-semibold text-[var(--ink-1)]" htmlFor="session-notes">
              Notes
            </label>
            <Textarea
              id="session-notes"
              placeholder="Optional notes about venue, stakes, blinds, or the game."
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-1)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ink-3)]">
              Players selected
            </p>
            <p className="mt-3 text-3xl font-extrabold tracking-tight">
              {selectedTotals.totalPlayers}
            </p>
            <p className="mt-2 text-sm text-[var(--ink-2)]">Build the table before starting.</p>
          </div>

          <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-1)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ink-3)]">
              Initial bankroll on table
            </p>
            <p className="mt-3 text-3xl font-extrabold tracking-tight">
              {formatCurrency(selectedTotals.totalInitialBuyin)}
            </p>
            <p className="mt-2 text-sm text-[var(--ink-2)]">
              This only reflects the first buy-in for each selected player.
            </p>
          </div>

          <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-1)] p-5 sm:col-span-2 xl:col-span-1">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ink-3)]">
              Setup mode
            </p>
            <div className="mt-4 grid gap-2">
              <button
                type="button"
                onClick={() => handleBuyinModeChange("shared")}
                className={`rounded-[22px] border px-4 py-3 text-left transition ${
                  buyinMode === "shared"
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--ink-1)]"
                    : "border-[var(--line)] bg-white text-[var(--ink-2)]"
                }`}
              >
                <span className="block font-semibold">Shared initial buy-in</span>
                <span className="mt-1 block text-sm">One amount applied to every selected player.</span>
              </button>

              <button
                type="button"
                onClick={() => handleBuyinModeChange("custom")}
                className={`rounded-[22px] border px-4 py-3 text-left transition ${
                  buyinMode === "custom"
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--ink-1)]"
                    : "border-[var(--line)] bg-white text-[var(--ink-2)]"
                }`}
              >
                <span className="block font-semibold">Custom initial buy-ins</span>
                <span className="mt-1 block text-sm">Set each player&apos;s first entry individually.</span>
              </button>
            </div>

            {buyinMode === "shared" ? (
              <div className="mt-4 space-y-2">
                <label
                  className="text-sm font-semibold text-[var(--ink-1)]"
                  htmlFor="shared-buyin"
                >
                  Shared initial buy-in
                </label>
                <Input
                  id="shared-buyin"
                  inputMode="decimal"
                  placeholder="100"
                  value={sharedInitialBuyin}
                  onChange={(event) => setSharedInitialBuyin(event.target.value)}
                />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)]">
        <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-1)] p-6 shadow-[0_18px_70px_rgba(24,21,17,0.06)]">
          <div className="mb-5 flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ink-3)]">
              Step 2
            </p>
            <h2 className="text-xl font-bold tracking-tight text-[var(--ink-1)]">Selected table</h2>
            <p className="text-sm text-[var(--ink-2)]">
              Confirm the roster before starting the session. You can keep adjusting live buy-ins
              once the session opens.
            </p>
          </div>

          {selectedPlayers.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-[var(--line)] bg-[var(--surface-0)] px-5 py-10 text-center text-sm text-[var(--ink-2)]">
              Pick players from the roster on the right to start building the table.
            </div>
          ) : (
            <div className="space-y-3">
              {selectedPlayers.map((player) => {
                const initialBuyinValue = getResolvedInitialBuyin(
                  player,
                  buyinMode,
                  sharedInitialBuyin,
                );
                const initialBuyinCents = parseMoneyToCents(initialBuyinValue) ?? 0;

                return (
                  <div
                    key={player.playerId}
                    className="rounded-[24px] border border-[var(--line)] bg-white p-4"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div>
                          <p className="text-lg font-bold tracking-tight text-[var(--ink-1)]">
                            {player.name}
                          </p>
                          <p className="text-sm text-[var(--ink-3)]">
                            {player.nickname ? player.nickname : "No nickname"}
                          </p>
                        </div>

                        <p className="text-sm text-[var(--ink-2)]">
                          Lifetime {formatSignedCurrency(player.lifetimeProfit)} across{" "}
                          {player.totalSessions} finalized sessions
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-[minmax(0,180px)_auto] lg:min-w-[320px]">
                        {buyinMode === "custom" ? (
                          <div className="space-y-2">
                            <label
                              className="text-sm font-semibold text-[var(--ink-1)]"
                              htmlFor={`player-buyin-${player.playerId}`}
                            >
                              Initial buy-in
                            </label>
                            <Input
                              id={`player-buyin-${player.playerId}`}
                              inputMode="decimal"
                              placeholder="100"
                              value={player.initialBuyin}
                              onChange={(event) =>
                                updatePlayerInitialBuyin(player.playerId, event.target.value)
                              }
                            />
                          </div>
                        ) : (
                          <div className="rounded-[20px] border border-[var(--line)] bg-[var(--surface-0)] px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ink-3)]">
                              Initial buy-in
                            </p>
                            <p className="mt-2 text-xl font-bold tracking-tight text-[var(--ink-1)]">
                              {formatCurrency(initialBuyinCents)}
                            </p>
                          </div>
                        )}

                        <div className="flex items-end">
                          <Button
                            variant="secondary"
                            className="w-full"
                            onClick={() => removePlayer(player.playerId)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-1)] p-6 shadow-[0_18px_70px_rgba(24,21,17,0.06)]">
            <div className="mb-5 flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ink-3)]">
                Step 3
              </p>
              <h2 className="text-xl font-bold tracking-tight text-[var(--ink-1)]">
                Historical players
              </h2>
              <p className="text-sm text-[var(--ink-2)]">
                Search your saved roster, then seat players into this session.
              </p>
            </div>

            <div className="space-y-4">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name or nickname"
              />

              <div className="max-h-[340px] space-y-3 overflow-y-auto pr-1">
                {availablePlayers.length === 0 ? (
                  <div className="rounded-[22px] border border-dashed border-[var(--line)] bg-[var(--surface-0)] px-4 py-6 text-sm text-[var(--ink-2)]">
                    No available players match this search.
                  </div>
                ) : (
                  availablePlayers.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between gap-3 rounded-[22px] border border-[var(--line)] bg-white px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[var(--ink-1)]">{player.name}</p>
                        <p className="text-sm text-[var(--ink-3)]">
                          {player.nickname ? player.nickname : "No nickname"}
                        </p>
                        <p className="mt-1 text-xs text-[var(--ink-3)]">
                          {formatSignedCurrency(player.lifetimeProfit)} lifetime across{" "}
                          {player.totalSessions} sessions
                        </p>
                      </div>

                      <Button size="sm" onClick={() => addPlayer(player)}>
                        Add
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-1)] p-6 shadow-[0_18px_70px_rgba(24,21,17,0.06)]">
            <div className="mb-5 flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ink-3)]">
                Need someone new?
              </p>
              <h2 className="text-xl font-bold tracking-tight text-[var(--ink-1)]">Quick add</h2>
              <p className="text-sm text-[var(--ink-2)]">
                Add a missing player to the roster without leaving this setup flow.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleQuickAddPlayer}>
              <div className="space-y-2">
                <label
                  className="text-sm font-semibold text-[var(--ink-1)]"
                  htmlFor="quick-player-name"
                >
                  Player name
                </label>
                <Input
                  id="quick-player-name"
                  placeholder="Alex Rivera"
                  value={newPlayerName}
                  onChange={(event) => setNewPlayerName(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-semibold text-[var(--ink-1)]"
                  htmlFor="quick-player-nickname"
                >
                  Nickname
                </label>
                <Input
                  id="quick-player-nickname"
                  placeholder="Optional"
                  value={newPlayerNickname}
                  onChange={(event) => setNewPlayerNickname(event.target.value)}
                />
              </div>

              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? "Adding player..." : "Add and select player"}
              </Button>
            </form>
          </div>
        </div>
      </section>

      {(error || success) && (
        <div className="space-y-2">
          {error ? <p className="text-sm font-medium text-[var(--negative)]">{error}</p> : null}
          {success ? <p className="text-sm font-medium text-[var(--positive)]">{success}</p> : null}
        </div>
      )}

      <section className="sticky bottom-20 z-20 md:bottom-4">
        <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-1)]/95 p-4 shadow-[0_18px_70px_rgba(24,21,17,0.12)] backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="grid gap-3 sm:grid-cols-2 lg:flex lg:items-center lg:gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ink-3)]">
                  Ready to start
                </p>
                <p className="mt-1 text-lg font-bold tracking-tight text-[var(--ink-1)]">
                  {selectedTotals.totalPlayers} players selected
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ink-3)]">
                  Initial bankroll
                </p>
                <p className="mt-1 text-lg font-bold tracking-tight text-[var(--ink-1)]">
                  {formatCurrency(selectedTotals.totalInitialBuyin)}
                </p>
              </div>
              <p className="max-w-xl text-sm text-[var(--ink-2)]">
                Creating the session opens the live tracking page, where you can keep adding buy-ins
                and update current chips or cash-out per player.
              </p>
            </div>

            <Button onClick={handleSubmit} disabled={isPending} className="w-full sm:w-auto">
              {isPending ? "Creating session..." : "Create session"}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
