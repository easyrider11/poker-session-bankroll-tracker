"use client";

import { FormEvent, ReactNode, useDeferredValue, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatSignedCurrency, parseMoneyToCents, sumMoney } from "@/lib/amounts";
import type {
  SerializedPlayer,
  SerializedSessionBuilderPlayer,
} from "@/lib/serializers";

type BuyinMode = "shared" | "custom";

type DraftPlayer = {
  playerId: number;
  name: string;
  nickname: string | null;
  initialBuyin: string;
  lifetimeProfit: number;
  totalSessions: number;
};

type StepStatusCardProps = {
  step: string;
  title: string;
  status: string;
  description: string;
  isComplete?: boolean;
};

type SetupSectionProps = {
  step: string;
  title: string;
  description: string;
  aside?: ReactNode;
  children: ReactNode;
};

type SummaryCardProps = {
  label: string;
  value: string;
  helper: string;
};

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function toSessionBuilderPlayer(player: SerializedPlayer): SerializedSessionBuilderPlayer {
  return {
    id: player.id,
    name: player.name,
    nickname: player.nickname,
    lifetimeProfit: player.lifetimeProfit,
    totalSessions: player.totalSessions,
  };
}

function sortPlayersByName(players: SerializedSessionBuilderPlayer[]) {
  return [...players].sort((left, right) => left.name.localeCompare(right.name));
}

function getResolvedInitialBuyin(player: DraftPlayer, mode: BuyinMode, sharedInitialBuyin: string) {
  return mode === "shared" ? sharedInitialBuyin : player.initialBuyin;
}

function getValidBuyinCents(value: string) {
  const cents = parseMoneyToCents(value.trim());
  return cents !== null && cents > 0 ? cents : null;
}

function StepStatusCard({
  step,
  title,
  status,
  description,
  isComplete = false,
}: StepStatusCardProps) {
  return (
    <div
      className={`rounded-[24px] border p-4 shadow-[0_10px_40px_rgba(24,21,17,0.04)] ${
        isComplete
          ? "border-[var(--accent)] bg-[var(--accent-soft)]"
          : "border-[var(--line)] bg-[var(--surface-1)]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ink-3)]">
            {step}
          </p>
          <h3 className="mt-2 text-lg font-bold tracking-tight text-[var(--ink-1)]">{title}</h3>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            isComplete
              ? "bg-[var(--accent)] text-[var(--on-accent)]"
              : "bg-white text-[var(--ink-2)]"
          }`}
        >
          {status}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-[var(--ink-2)]">{description}</p>
    </div>
  );
}

function SetupSection({ step, title, description, aside, children }: SetupSectionProps) {
  return (
    <section className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-1)] p-6 shadow-[0_18px_70px_rgba(24,21,17,0.06)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ink-3)]">
            {step}
          </p>
          <h2 className="text-xl font-bold tracking-tight text-[var(--ink-1)]">{title}</h2>
          <p className="text-sm leading-6 text-[var(--ink-2)]">{description}</p>
        </div>
        {aside ? <div className="shrink-0">{aside}</div> : null}
      </div>

      <div className="mt-6">{children}</div>
    </section>
  );
}

function SummaryCard({ label, value, helper }: SummaryCardProps) {
  return (
    <div className="rounded-[22px] border border-[var(--line)] bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ink-3)]">
        {label}
      </p>
      <p className="mt-3 text-2xl font-extrabold tracking-tight text-[var(--ink-1)]">{value}</p>
      <p className="mt-2 text-sm text-[var(--ink-2)]">{helper}</p>
    </div>
  );
}

export function NewSessionBuilder({ players }: { players: SerializedSessionBuilderPlayer[] }) {
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

  const sharedInitialBuyinCents = getValidBuyinCents(sharedInitialBuyin);
  const selectedPlayerBuyins = selectedPlayers.map((player) => {
    const rawValue = getResolvedInitialBuyin(player, buyinMode, sharedInitialBuyin);
    const initialBuyinCents = getValidBuyinCents(rawValue);

    return {
      ...player,
      rawValue,
      initialBuyinCents,
    };
  });

  const detailsReady = title.trim().length > 0 && sessionDate.trim().length > 0;
  const validBuyinCount =
    buyinMode === "shared"
      ? sharedInitialBuyinCents !== null
        ? selectedPlayers.length
        : 0
      : selectedPlayerBuyins.filter((player) => player.initialBuyinCents !== null).length;
  const missingBuyinCount = Math.max(selectedPlayers.length - validBuyinCount, 0);
  const buyinsReady = selectedPlayers.length > 0 && missingBuyinCount === 0;
  const reviewReady = detailsReady && selectedPlayers.length > 0 && buyinsReady;

  const nextActionTitle = !detailsReady
    ? "Add a session title and date."
    : selectedPlayers.length === 0
      ? "Seat at least one player."
      : !buyinsReady
        ? buyinMode === "shared"
          ? "Enter a valid shared opening buy-in."
          : "Finish the missing opening buy-ins."
        : "Create the session and move into live tracking.";

  const nextActionDescription = !detailsReady
    ? "The session shell needs basic details before it can be created."
    : selectedPlayers.length === 0
      ? "Pick players from the saved roster or quick add someone new without leaving this page."
      : !buyinsReady
        ? buyinMode === "shared"
          ? "One valid amount will be used as the first buy-in for every seated player."
          : "Every seated player needs a valid opening buy-in before the session starts."
        : "Rebuys and current chip counts stay on the next screen, so setup can stay focused and fast.";
  const canQuickAdd = newPlayerName.trim().length > 0 && !isPending;
  const canCreateSession = reviewReady && !isPending;

  function clearError() {
    setError(null);
  }

  function addPlayer(player: SerializedSessionBuilderPlayer) {
    clearError();
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
    clearError();
    setSelectedPlayers((current) => current.filter((player) => player.playerId !== playerId));
  }

  function handleBuyinModeChange(nextMode: BuyinMode) {
    clearError();
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
    clearError();
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

        const nextPlayer = toSessionBuilderPlayer(data.player as SerializedPlayer);
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
      } catch {
        setError("Could not create session.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-1)] p-6 shadow-[0_18px_70px_rgba(24,21,17,0.06)]">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ink-3)]">
            Session setup
          </p>
          <h2 className="text-2xl font-extrabold tracking-tight text-[var(--ink-1)] sm:text-3xl">
            Move from table setup to live tracking in one pass
          </h2>
          <p className="max-w-3xl text-sm leading-6 text-[var(--ink-2)] sm:text-base">
            Keep the flow lightweight on mobile: set the game details, seat the players, lock in
            the opening buy-ins, then jump into the live tracker for rebuys and current chips.
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StepStatusCard
            step="Step 1"
            title="Details"
            status={detailsReady ? "Ready" : "Required"}
            description="Set the session shell before anything else."
            isComplete={detailsReady}
          />
          <StepStatusCard
            step="Step 2"
            title="Players"
            status={
              selectedTotals.totalPlayers > 0
                ? `${selectedTotals.totalPlayers} seated`
                : "Required"
            }
            description="Build the table from the roster or quick add someone new."
            isComplete={selectedTotals.totalPlayers > 0}
          />
          <StepStatusCard
            step="Step 3"
            title="Buy-ins"
            status={
              selectedPlayers.length === 0
                ? "Waiting"
                : buyinsReady
                  ? "Ready"
                  : `${missingBuyinCount} missing`
            }
            description="Only the first buy-in is handled here. Rebuys stay in the live tracker."
            isComplete={buyinsReady}
          />
          <StepStatusCard
            step="Step 4"
            title="Start"
            status={reviewReady ? "Ready" : "In progress"}
            description="Review the setup, create the draft session, and continue live."
            isComplete={reviewReady}
          />
        </div>
      </section>

      <SetupSection
        step="Step 1"
        title="Session details"
        description="Keep this lightweight. The live tracker handles rebuys and chip updates after the session opens."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--ink-1)]" htmlFor="session-title">
              Session title
            </label>
            <Input
              id="session-title"
              value={title}
              onChange={(event) => {
                clearError();
                setTitle(event.target.value);
              }}
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
              onChange={(event) => {
                clearError();
                setSessionDate(event.target.value);
              }}
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
            onChange={(event) => {
              clearError();
              setNotes(event.target.value);
            }}
          />
        </div>
      </SetupSection>

      <SetupSection
        step="Step 2"
        title="Seat the table"
        description="Pick from historical players first. If someone new shows up, add them here without leaving the flow."
        aside={
          <div className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink-1)]">
            {selectedTotals.totalPlayers} selected
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <SummaryCard
            label="Players selected"
            value={String(selectedTotals.totalPlayers)}
            helper={
              selectedTotals.totalPlayers > 0
                ? "The seated roster is ready for opening buy-ins."
                : "Start by adding players from the roster below."
            }
          />
          <SummaryCard
            label="Available roster"
            value={String(availablePlayers.length)}
            helper={
              deferredSearch.trim()
                ? "Filtered by your current search."
                : "Historical players available to add."
            }
          />
        </div>

        <div className="mt-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-lg font-bold tracking-tight text-[var(--ink-1)]">Selected players</h3>
            {selectedPlayers.length > 0 ? (
              <span className="text-sm font-medium text-[var(--ink-2)]">
                Remove anyone who should not be seated yet.
              </span>
            ) : null}
          </div>

          {selectedPlayers.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-[var(--line)] bg-[var(--surface-0)] px-5 py-10 text-center text-sm text-[var(--ink-2)]">
              No players selected yet. Add players below to start building the table.
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {selectedPlayers.map((player) => (
                <div
                  key={player.playerId}
                  className="rounded-[24px] border border-[var(--line)] bg-white p-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-lg font-bold tracking-tight text-[var(--ink-1)]">
                        {player.name}
                      </p>
                      <p className="text-sm text-[var(--ink-3)]">
                        {player.nickname ? player.nickname : "No nickname"}
                      </p>
                      <p className="mt-2 text-sm text-[var(--ink-2)]">
                        Lifetime {formatSignedCurrency(player.lifetimeProfit)} across{" "}
                        {player.totalSessions} finalized sessions
                      </p>
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={() => removePlayer(player.playerId)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="rounded-[24px] border border-[var(--line)] bg-white p-5">
            <div className="space-y-2">
              <h3 className="text-lg font-bold tracking-tight text-[var(--ink-1)]">
                Historical players
              </h3>
              <p className="text-sm text-[var(--ink-2)]">
                Search the saved roster, then add players to the table one by one.
              </p>
            </div>

            <div className="mt-4 space-y-4">
              <Input
                value={search}
                onChange={(event) => {
                  clearError();
                  setSearch(event.target.value);
                }}
                placeholder="Search name or nickname"
              />

              <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
                {availablePlayers.length === 0 ? (
                  <div className="rounded-[22px] border border-dashed border-[var(--line)] bg-[var(--surface-0)] px-4 py-6 text-sm text-[var(--ink-2)]">
                    No available players match this search.
                  </div>
                ) : (
                  availablePlayers.map((player) => (
                    <div
                      key={player.id}
                      className="flex flex-col gap-4 rounded-[22px] border border-[var(--line)] bg-[var(--surface-1)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
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

                      <Button
                        className="w-full sm:w-auto"
                        size="sm"
                        onClick={() => addPlayer(player)}
                        disabled={isPending}
                      >
                        Add player
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-[var(--line)] bg-white p-5">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ink-3)]">
                Need someone new?
              </p>
              <h3 className="text-lg font-bold tracking-tight text-[var(--ink-1)]">Quick add</h3>
              <p className="text-sm text-[var(--ink-2)]">
                Add a missing player to the roster and seat them immediately.
              </p>
            </div>

            <form className="mt-4 space-y-4" onSubmit={handleQuickAddPlayer}>
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
                  onChange={(event) => {
                    clearError();
                    setNewPlayerName(event.target.value);
                  }}
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
                  onChange={(event) => {
                    clearError();
                    setNewPlayerNickname(event.target.value);
                  }}
                />
              </div>

              <Button type="submit" disabled={!canQuickAdd} className="w-full">
                {isPending ? "Adding player..." : "Add and seat player"}
              </Button>
            </form>
          </div>
        </div>
      </SetupSection>

      <SetupSection
        step="Step 3"
        title="Set opening buy-ins"
        description="Choose one shared amount for the whole table or enter each player&apos;s first buy-in individually."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <SummaryCard
            label="Opening bankroll"
            value={formatCurrency(selectedTotals.totalInitialBuyin)}
            helper={
              buyinsReady
                ? "This is the total first money on the table."
                : "Only valid amounts are counted until setup is complete."
            }
          />
          <SummaryCard
            label="Buy-ins ready"
            value={`${validBuyinCount}/${selectedTotals.totalPlayers}`}
            helper={
              selectedTotals.totalPlayers === 0
                ? "Seat players first before setting buy-ins."
                : buyinsReady
                  ? "Every seated player has an opening buy-in."
                  : `${missingBuyinCount} player${missingBuyinCount === 1 ? "" : "s"} still need attention.`
            }
          />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => handleBuyinModeChange("shared")}
            className={`rounded-[22px] border px-4 py-4 text-left transition ${
              buyinMode === "shared"
                ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--ink-1)]"
                : "border-[var(--line)] bg-white text-[var(--ink-2)]"
            }`}
          >
            <span className="block font-semibold">Shared initial buy-in</span>
            <span className="mt-1 block text-sm">Use one opening amount for every seated player.</span>
          </button>

          <button
            type="button"
            onClick={() => handleBuyinModeChange("custom")}
            className={`rounded-[22px] border px-4 py-4 text-left transition ${
              buyinMode === "custom"
                ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--ink-1)]"
                : "border-[var(--line)] bg-white text-[var(--ink-2)]"
            }`}
          >
            <span className="block font-semibold">Custom initial buy-ins</span>
            <span className="mt-1 block text-sm">Set the first buy-in for each seated player.</span>
          </button>
        </div>

        {selectedPlayers.length === 0 ? (
          <div className="mt-6 rounded-[24px] border border-dashed border-[var(--line)] bg-[var(--surface-0)] px-5 py-10 text-center text-sm text-[var(--ink-2)]">
            Seat at least one player in Step 2 before setting opening buy-ins.
          </div>
        ) : buyinMode === "shared" ? (
          <div className="mt-6 rounded-[24px] border border-[var(--line)] bg-white p-5">
            <div className="grid gap-4 md:grid-cols-[minmax(0,260px)_1fr] md:items-end">
              <div className="space-y-2">
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
                  onChange={(event) => {
                    clearError();
                    setSharedInitialBuyin(event.target.value);
                  }}
                />
              </div>

              <p className="text-sm leading-6 text-[var(--ink-2)]">
                This amount becomes the first buy-in for each seated player. Any later rebuys are
                still recorded on the live tracking screen.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {selectedPlayerBuyins.map((player) => (
              <div
                key={player.playerId}
                className="rounded-[24px] border border-[var(--line)] bg-white p-4"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-bold tracking-tight text-[var(--ink-1)]">
                      {player.name}
                    </p>
                    <p className="text-sm text-[var(--ink-3)]">
                      {player.nickname ? player.nickname : "No nickname"}
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-[minmax(0,220px)_auto] md:items-end">
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
                        onChange={(event) => {
                          updatePlayerInitialBuyin(player.playerId, event.target.value);
                        }}
                      />
                    </div>

                    <div className="rounded-[20px] border border-[var(--line)] bg-[var(--surface-0)] px-4 py-3 text-sm text-[var(--ink-2)]">
                      {player.initialBuyinCents === null
                        ? "Needs a valid amount"
                        : `Ready at ${formatCurrency(player.initialBuyinCents)}`}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SetupSection>

      <SetupSection
        step="Step 4"
        title="Review and start"
        description="This creates the draft session and sends you straight into the live table manager."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard
            label="Session"
            value={title.trim() || "Untitled"}
            helper={sessionDate ? `Plays on ${sessionDate}` : "Add a session date in Step 1."}
          />
          <SummaryCard
            label="Players"
            value={String(selectedTotals.totalPlayers)}
            helper={
              selectedTotals.totalPlayers > 0
                ? "Roster locked in for session creation."
                : "Seat players in Step 2 before creating the session."
            }
          />
          <SummaryCard
            label="Opening total"
            value={formatCurrency(selectedTotals.totalInitialBuyin)}
            helper={
              buyinsReady
                ? "Rebuys and current chips continue on the next screen."
                : "Finish Step 3 so the opening money is fully defined."
            }
          />
        </div>

        {selectedPlayers.length === 0 ? (
          <div className="mt-6 rounded-[24px] border border-dashed border-[var(--line)] bg-[var(--surface-0)] px-5 py-10 text-center text-sm text-[var(--ink-2)]">
            Once you seat players, their opening buy-ins will show up here for a final review.
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {selectedPlayerBuyins.map((player) => (
              <div
                key={player.playerId}
                className="flex flex-col gap-3 rounded-[24px] border border-[var(--line)] bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[var(--ink-1)]">{player.name}</p>
                  <p className="text-sm text-[var(--ink-3)]">
                    {player.nickname ? player.nickname : "No nickname"}
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:items-end">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ink-3)]">
                    Opening buy-in
                  </p>
                  <p className="text-lg font-bold tracking-tight text-[var(--ink-1)]">
                    {player.initialBuyinCents === null
                      ? "Needs amount"
                      : formatCurrency(player.initialBuyinCents)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {notes.trim() ? (
          <div className="mt-6 rounded-[24px] border border-[var(--line)] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ink-3)]">
              Session notes
            </p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--ink-2)]">
              {notes.trim()}
            </p>
          </div>
        ) : null}
      </SetupSection>

      {(error || success) && (
        <div className="space-y-3">
          {error ? (
            <div className="rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-[var(--negative)]">
              {error}
            </div>
          ) : null}
          {success ? (
            <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-[var(--positive)]">
              {success}
            </div>
          ) : null}
        </div>
      )}

      <section className="sticky bottom-20 z-20 md:bottom-4">
        <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-1)]/95 p-4 shadow-[0_18px_70px_rgba(24,21,17,0.12)] backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ink-3)]">
                  Next action
                </p>
                <p className="mt-1 text-lg font-bold tracking-tight text-[var(--ink-1)]">
                  {nextActionTitle}
                </p>
              </div>
              <p className="max-w-2xl text-sm leading-6 text-[var(--ink-2)]">
                {nextActionDescription}
              </p>
              <div className="flex flex-wrap gap-2 text-sm font-medium text-[var(--ink-2)]">
                <span className="rounded-full border border-[var(--line)] bg-white px-3 py-1">
                  {selectedTotals.totalPlayers} players
                </span>
                <span className="rounded-full border border-[var(--line)] bg-white px-3 py-1">
                  {formatCurrency(selectedTotals.totalInitialBuyin)} opening total
                </span>
                <span className="rounded-full border border-[var(--line)] bg-white px-3 py-1">
                  {buyinMode === "shared" ? "Shared buy-in mode" : "Custom buy-in mode"}
                </span>
              </div>
            </div>

            <div className="w-full space-y-2 sm:w-auto">
              <Button onClick={handleSubmit} disabled={!canCreateSession} className="w-full sm:w-auto">
                {isPending
                  ? "Creating session..."
                  : reviewReady
                    ? "Create session"
                    : "Finish setup to create"}
              </Button>
              {!reviewReady ? (
                <p className="text-center text-xs font-medium text-[var(--ink-2)] sm:text-right">
                  Complete the required steps above to enable session creation.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
