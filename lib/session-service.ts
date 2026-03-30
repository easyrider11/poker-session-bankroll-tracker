import { Prisma } from "@prisma/client";

import { calculateProfit, sumMoney } from "@/lib/amounts";
import { prisma } from "@/lib/prisma";
import { sessionDetailInclude } from "@/lib/serializers";
import { ServiceError } from "@/lib/service-error";

type SessionParticipantInput = {
  playerId: number;
  buyins: number[];
  cashout: number;
};

type CreateSessionInput = {
  title: string;
  sessionDate: Date;
  notes: string | null;
  players: SessionParticipantInput[];
};

function isKnownPrismaError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError;
}

async function getSessionForMutation(tx: Prisma.TransactionClient, sessionId: number) {
  const session = await tx.pokerSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw new ServiceError("Session not found.", 404);
  }

  if (session.finalizedAt) {
    throw new ServiceError("Finalized sessions cannot be modified.", 409);
  }

  return session;
}

async function ensurePlayersExist(tx: Prisma.TransactionClient, playerIds: number[]) {
  if (playerIds.length === 0) {
    return;
  }

  const existingPlayers = await tx.player.findMany({
    where: {
      id: {
        in: playerIds,
      },
    },
    select: {
      id: true,
    },
  });

  if (existingPlayers.length !== new Set(playerIds).size) {
    throw new ServiceError("One or more players were not found.", 404);
  }
}

export async function createSession(input: CreateSessionInput) {
  try {
    return await prisma.$transaction(async (tx) => {
      await ensurePlayersExist(
        tx,
        input.players.map((player) => player.playerId),
      );

      const session = await tx.pokerSession.create({
        data: {
          title: input.title,
          sessionDate: input.sessionDate,
          notes: input.notes,
        },
      });

      for (const participant of input.players) {
        const totalBuyin = sumMoney(participant.buyins);
        const totalCashout = participant.cashout;

        const sessionPlayer = await tx.sessionPlayer.create({
          data: {
            sessionId: session.id,
            playerId: participant.playerId,
            totalBuyin,
            totalCashout,
            profit: calculateProfit(totalCashout, totalBuyin),
          },
        });

        if (participant.buyins.length > 0) {
          await tx.buyinRecord.createMany({
            data: participant.buyins.map((amount) => ({
              sessionPlayerId: sessionPlayer.id,
              amount,
            })),
          });
        }
      }

      return tx.pokerSession.findUniqueOrThrow({
        where: { id: session.id },
        include: sessionDetailInclude,
      });
    });
  } catch (error) {
    if (isKnownPrismaError(error) && error.code === "P2002") {
      throw new ServiceError("A player can only be added once per session.", 409);
    }

    throw error;
  }
}

export async function addPlayerToSession(sessionId: number, playerId: number) {
  try {
    return await prisma.$transaction(async (tx) => {
      await getSessionForMutation(tx, sessionId);

      const player = await tx.player.findUnique({
        where: { id: playerId },
      });

      if (!player) {
        throw new ServiceError("Player not found.", 404);
      }

      const sessionPlayer = await tx.sessionPlayer.create({
        data: {
          sessionId,
          playerId,
        },
        include: {
          player: true,
          buyinRecords: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

      return sessionPlayer;
    });
  } catch (error) {
    if (isKnownPrismaError(error) && error.code === "P2002") {
      throw new ServiceError("That player is already in the session.", 409);
    }

    throw error;
  }
}

export async function addBuyinToSessionPlayer(sessionPlayerId: number, amount: number) {
  return prisma.$transaction(async (tx) => {
    const sessionPlayer = await tx.sessionPlayer.findUnique({
      where: { id: sessionPlayerId },
      include: {
        session: true,
      },
    });

    if (!sessionPlayer) {
      throw new ServiceError("Session player not found.", 404);
    }

    if (sessionPlayer.session.finalizedAt) {
      throw new ServiceError("Finalized sessions cannot be modified.", 409);
    }

    await tx.buyinRecord.create({
      data: {
        sessionPlayerId,
        amount,
      },
    });

    const totalBuyin = sessionPlayer.totalBuyin + amount;
    const updated = await tx.sessionPlayer.update({
      where: { id: sessionPlayerId },
      data: {
        totalBuyin,
        profit: calculateProfit(sessionPlayer.totalCashout, totalBuyin),
      },
      include: {
        player: true,
        buyinRecords: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    return updated;
  });
}

export async function updateSessionPlayerCashout(sessionPlayerId: number, cashout: number) {
  return prisma.$transaction(async (tx) => {
    const sessionPlayer = await tx.sessionPlayer.findUnique({
      where: { id: sessionPlayerId },
      include: {
        session: true,
      },
    });

    if (!sessionPlayer) {
      throw new ServiceError("Session player not found.", 404);
    }

    if (sessionPlayer.session.finalizedAt) {
      throw new ServiceError("Finalized sessions cannot be modified.", 409);
    }

    return tx.sessionPlayer.update({
      where: { id: sessionPlayerId },
      data: {
        totalCashout: cashout,
        profit: calculateProfit(cashout, sessionPlayer.totalBuyin),
      },
      include: {
        player: true,
        buyinRecords: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });
  });
}

export async function deleteSession(sessionId: number) {
  return prisma.$transaction(async (tx) => {
    const session = await tx.pokerSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new ServiceError("Session not found.", 404);
    }

    if (session.finalizedAt) {
      throw new ServiceError(
        "Finalized sessions cannot be deleted. Their results are already applied to player lifetime stats.",
        409,
      );
    }

    await tx.pokerSession.delete({
      where: { id: sessionId },
    });

    return session;
  });
}

export async function finalizeSession(sessionId: number) {
  return prisma.$transaction(async (tx) => {
    const session = await tx.pokerSession.findUnique({
      where: { id: sessionId },
      include: sessionDetailInclude,
    });

    if (!session) {
      throw new ServiceError("Session not found.", 404);
    }

    if (session.finalizedAt) {
      throw new ServiceError("Session has already been finalized.", 409);
    }

    if (session.sessionPlayers.length === 0) {
      throw new ServiceError("Add at least one player before finalizing the session.", 400);
    }

    for (const sessionPlayer of session.sessionPlayers) {
      const totalBuyin = sumMoney(sessionPlayer.buyinRecords.map((record) => record.amount));
      const profit = calculateProfit(sessionPlayer.totalCashout, totalBuyin);

      await tx.sessionPlayer.update({
        where: { id: sessionPlayer.id },
        data: {
          totalBuyin,
          profit,
        },
      });

      await tx.player.update({
        where: { id: sessionPlayer.playerId },
        data: {
          lifetimeBuyin: {
            increment: totalBuyin,
          },
          lifetimeCashout: {
            increment: sessionPlayer.totalCashout,
          },
          lifetimeProfit: {
            increment: profit,
          },
          totalSessions: {
            increment: 1,
          },
        },
      });
    }

    await tx.pokerSession.update({
      where: { id: sessionId },
      data: {
        finalizedAt: new Date(),
      },
    });

    return tx.pokerSession.findUniqueOrThrow({
      where: { id: sessionId },
      include: sessionDetailInclude,
    });
  });
}
