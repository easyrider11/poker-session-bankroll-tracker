import { NextResponse } from "next/server";

import { handleRouteError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { serializePlayer } from "@/lib/serializers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";

  try {
    if (!q) {
      return NextResponse.json({
        players: [],
      });
    }

    const players = await prisma.player.findMany({
      where: {
        OR: [
          {
            name: {
              contains: q,
            },
          },
          {
            nickname: {
              contains: q,
            },
          },
        ],
      },
      take: 12,
      orderBy: [{ lifetimeProfit: "desc" }, { name: "asc" }],
    });

    return NextResponse.json({
      players: players.map(serializePlayer),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
