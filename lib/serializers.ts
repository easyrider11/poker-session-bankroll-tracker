import { Player, Prisma } from "@prisma/client";

import { formatBuyinList, sumMoney } from "@/lib/amounts";

export const sessionDetailInclude = {
  sessionPlayers: {
    include: {
      player: true,
      buyinRecords: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  },
} satisfies Prisma.PokerSessionInclude;

export const sessionPlayerInclude = {
  player: true,
  buyinRecords: {
    orderBy: {
      createdAt: "asc",
    },
  },
} satisfies Prisma.SessionPlayerInclude;

export type SessionDetailRecord = Prisma.PokerSessionGetPayload<{
  include: typeof sessionDetailInclude;
}>;

export type SessionPlayerRecord = Prisma.SessionPlayerGetPayload<{
  include: typeof sessionPlayerInclude;
}>;

export type PlayerSessionHistoryRecord = Prisma.SessionPlayerGetPayload<{
  include: {
    session: true;
  };
}>;

export type SerializedPlayer = {
  id: number;
  name: string;
  nickname: string | null;
  createdAt: string;
  updatedAt: string;
  lifetimeBuyin: number;
  lifetimeCashout: number;
  lifetimeProfit: number;
  totalSessions: number;
};

export type SerializedSession = {
  id: number;
  title: string;
  sessionDate: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  finalizedAt: string | null;
  totalBuyin: number;
  totalCashout: number;
  totalProfit: number;
  sessionPlayers: SerializedSessionPlayer[];
};

export type SerializedPlayerSessionHistory = {
  id: number;
  sessionId: number;
  title: string;
  sessionDate: string;
  finalizedAt: string | null;
  totalBuyin: number;
  totalCashout: number;
  profit: number;
};

export type SerializedSessionPlayer = {
  id: number;
  sessionId: number;
  playerId: number;
  playerName: string;
  playerNickname: string | null;
  totalBuyin: number;
  totalCashout: number;
  profit: number;
  initialBuyin: number;
  additionalBuyinTotal: number;
  buyinDisplay: string;
  buyinRecords: Array<{
    id: number;
    amount: number;
    createdAt: string;
  }>;
  additionalBuyins: Array<{
    id: number;
    amount: number;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

export function serializePlayer(player: Player): SerializedPlayer {
  return {
    id: player.id,
    name: player.name,
    nickname: player.nickname,
    createdAt: player.createdAt.toISOString(),
    updatedAt: player.updatedAt.toISOString(),
    lifetimeBuyin: player.lifetimeBuyin,
    lifetimeCashout: player.lifetimeCashout,
    lifetimeProfit: player.lifetimeProfit,
    totalSessions: player.totalSessions,
  };
}

export function serializeSessionPlayer(sessionPlayer: SessionPlayerRecord): SerializedSessionPlayer {
  const [initialBuyinRecord, ...additionalBuyinRecords] = sessionPlayer.buyinRecords;

  return {
    id: sessionPlayer.id,
    sessionId: sessionPlayer.sessionId,
    playerId: sessionPlayer.playerId,
    playerName: sessionPlayer.player.name,
    playerNickname: sessionPlayer.player.nickname,
    totalBuyin: sessionPlayer.totalBuyin,
    totalCashout: sessionPlayer.totalCashout,
    profit: sessionPlayer.profit,
    initialBuyin: initialBuyinRecord?.amount ?? 0,
    additionalBuyinTotal: sumMoney(additionalBuyinRecords.map((record) => record.amount)),
    buyinDisplay: formatBuyinList(sessionPlayer.buyinRecords.map((record) => record.amount)),
    buyinRecords: sessionPlayer.buyinRecords.map((record) => ({
      id: record.id,
      amount: record.amount,
      createdAt: record.createdAt.toISOString(),
    })),
    additionalBuyins: additionalBuyinRecords.map((record) => ({
      id: record.id,
      amount: record.amount,
      createdAt: record.createdAt.toISOString(),
    })),
    createdAt: sessionPlayer.createdAt.toISOString(),
    updatedAt: sessionPlayer.updatedAt.toISOString(),
  };
}

export function serializeSession(session: SessionDetailRecord): SerializedSession {
  return {
    id: session.id,
    title: session.title,
    sessionDate: session.sessionDate.toISOString(),
    notes: session.notes,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    finalizedAt: session.finalizedAt?.toISOString() ?? null,
    totalBuyin: sumMoney(session.sessionPlayers.map((player) => player.totalBuyin)),
    totalCashout: sumMoney(session.sessionPlayers.map((player) => player.totalCashout)),
    totalProfit: sumMoney(session.sessionPlayers.map((player) => player.profit)),
    sessionPlayers: session.sessionPlayers.map(serializeSessionPlayer),
  };
}

export function serializePlayerSessionHistory(
  sessionPlayer: PlayerSessionHistoryRecord,
): SerializedPlayerSessionHistory {
  return {
    id: sessionPlayer.id,
    sessionId: sessionPlayer.sessionId,
    title: sessionPlayer.session.title,
    sessionDate: sessionPlayer.session.sessionDate.toISOString(),
    finalizedAt: sessionPlayer.session.finalizedAt?.toISOString() ?? null,
    totalBuyin: sessionPlayer.totalBuyin,
    totalCashout: sessionPlayer.totalCashout,
    profit: sessionPlayer.profit,
  };
}
