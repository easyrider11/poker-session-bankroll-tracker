import { prisma } from "@/lib/prisma";
import { deletePlayer } from "@/lib/player-service";
import { ServiceError } from "@/lib/service-error";
import { createSession } from "@/lib/session-service";

describe("player service", () => {
  it("deletes an unused player from the roster", async () => {
    const player = await prisma.player.create({
      data: {
        name: "Delete Me",
      },
    });

    await deletePlayer(player.id);

    const deletedPlayer = await prisma.player.findUnique({
      where: { id: player.id },
    });

    expect(deletedPlayer).toBeNull();
  });

  it("blocks deleting a player that is attached to a session", async () => {
    const player = await prisma.player.create({
      data: {
        name: "Protected Player",
      },
    });

    await createSession({
      title: "History Session",
      sessionDate: new Date("2026-03-20T00:00:00.000Z"),
      notes: null,
      players: [
        {
          playerId: player.id,
          buyins: [10000],
          cashout: 10000,
        },
      ],
    });

    await expect(deletePlayer(player.id)).rejects.toMatchObject<Partial<ServiceError>>({
      message: "Players already attached to a session cannot be deleted.",
      status: 409,
    });
  });
});
