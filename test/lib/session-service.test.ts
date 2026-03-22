import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/service-error";
import {
  addBuyinToSessionPlayer,
  createSession,
  finalizeSession,
  updateSessionPlayerCashout,
} from "@/lib/session-service";

describe("session service", () => {
  it("creates a session with computed totals from buy-ins and cash-out", async () => {
    const player = await prisma.player.create({
      data: {
        name: "Alex Rivera",
      },
    });

    const session = await createSession({
      title: "Friday Night",
      sessionDate: new Date("2026-03-20T00:00:00.000Z"),
      notes: "QA session",
      players: [
        {
          playerId: player.id,
          buyins: [10000, 5000],
          cashout: 18000,
        },
      ],
    });

    expect(session.sessionPlayers).toHaveLength(1);
    expect(session.sessionPlayers[0]?.totalBuyin).toBe(15000);
    expect(session.sessionPlayers[0]?.totalCashout).toBe(18000);
    expect(session.sessionPlayers[0]?.profit).toBe(3000);
    expect(session.sessionPlayers[0]?.buyinRecords).toHaveLength(2);
  });

  it("updates session-player totals when adding a buy-in and cash-out", async () => {
    const player = await prisma.player.create({
      data: {
        name: "Jordan Lee",
      },
    });

    const session = await createSession({
      title: "Saturday Session",
      sessionDate: new Date("2026-03-21T00:00:00.000Z"),
      notes: null,
      players: [
        {
          playerId: player.id,
          buyins: [10000],
          cashout: 8000,
        },
      ],
    });

    const sessionPlayerId = session.sessionPlayers[0]!.id;

    const afterBuyin = await addBuyinToSessionPlayer(sessionPlayerId, 2500);
    expect(afterBuyin.totalBuyin).toBe(12500);
    expect(afterBuyin.profit).toBe(-4500);

    const afterCashout = await updateSessionPlayerCashout(sessionPlayerId, 15000);
    expect(afterCashout.totalCashout).toBe(15000);
    expect(afterCashout.profit).toBe(2500);
  });

  it("finalizes a session and updates lifetime player stats transactionally", async () => {
    const player = await prisma.player.create({
      data: {
        name: "Chris Parker",
      },
    });

    const session = await createSession({
      title: "Main Game",
      sessionDate: new Date("2026-03-22T00:00:00.000Z"),
      notes: null,
      players: [
        {
          playerId: player.id,
          buyins: [10000, 5000],
          cashout: 22000,
        },
      ],
    });

    const finalized = await finalizeSession(session.id);
    const updatedPlayer = await prisma.player.findUniqueOrThrow({
      where: { id: player.id },
    });

    expect(finalized.finalizedAt).not.toBeNull();
    expect(updatedPlayer.lifetimeBuyin).toBe(15000);
    expect(updatedPlayer.lifetimeCashout).toBe(22000);
    expect(updatedPlayer.lifetimeProfit).toBe(7000);
    expect(updatedPlayer.totalSessions).toBe(1);
  });

  it("blocks modifying finalized sessions", async () => {
    const player = await prisma.player.create({
      data: {
        name: "Taylor Brooks",
      },
    });

    const session = await createSession({
      title: "Locked Session",
      sessionDate: new Date("2026-03-23T00:00:00.000Z"),
      notes: null,
      players: [
        {
          playerId: player.id,
          buyins: [10000],
          cashout: 10000,
        },
      ],
    });

    const sessionPlayerId = session.sessionPlayers[0]!.id;
    await finalizeSession(session.id);

    await expect(addBuyinToSessionPlayer(sessionPlayerId, 1000)).rejects.toMatchObject<
      Partial<ServiceError>
    >({
      message: "Finalized sessions cannot be modified.",
      status: 409,
    });
  });
});
