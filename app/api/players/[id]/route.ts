import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { handleRouteError, jsonError, parseIdParam } from "@/lib/api";
import { deletePlayer } from "@/lib/player-service";
import { prisma } from "@/lib/prisma";
import { serializePlayer, serializePlayerSessionHistory } from "@/lib/serializers";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const routeParams = await params;
  const playerId = parseIdParam(routeParams.id);

  if (!playerId) {
    return jsonError("Invalid player id.");
  }

  try {
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: {
        sessionPlayers: {
          include: {
            session: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        },
      },
    });

    if (!player) {
      return jsonError("Player not found.", 404);
    }

    return NextResponse.json({
      player: serializePlayer(player),
      recentSessions: player.sessionPlayers.map(serializePlayerSessionHistory),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const routeParams = await params;
  const playerId = parseIdParam(routeParams.id);

  if (!playerId) {
    return jsonError("Invalid player id.");
  }

  try {
    const player = await deletePlayer(playerId);

    revalidatePath("/");
    revalidatePath("/players");
    revalidatePath("/sessions/new");

    return NextResponse.json({
      player: serializePlayer(player),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
