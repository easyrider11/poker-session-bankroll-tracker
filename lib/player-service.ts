import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/service-error";

export async function deletePlayer(playerId: number) {
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: {
      _count: {
        select: {
          sessionPlayers: true,
        },
      },
    },
  });

  if (!player) {
    throw new ServiceError("Player not found.", 404);
  }

  if (player._count.sessionPlayers > 0) {
    throw new ServiceError(
      "Players already attached to a session cannot be deleted.",
      409,
    );
  }

  await prisma.player.delete({
    where: { id: playerId },
  });

  return player;
}
