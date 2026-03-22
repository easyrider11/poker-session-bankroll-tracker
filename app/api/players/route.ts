import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { handleRouteError, parseJsonBody } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { serializePlayer } from "@/lib/serializers";
import { createPlayerSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const q = searchParams.get("q")?.trim();

  try {
    const players = await prisma.player.findMany({
      where: q
        ? {
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
          }
        : undefined,
      orderBy: [{ lifetimeProfit: "desc" }, { name: "asc" }],
    });

    return NextResponse.json({
      players: players.map(serializePlayer),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  const parsedBody = await parseJsonBody(request, createPlayerSchema);

  if (!parsedBody.success) {
    return parsedBody.response;
  }

  try {
    const player = await prisma.player.create({
      data: {
        name: parsedBody.data.name,
        nickname: parsedBody.data.nickname,
      },
    });

    revalidatePath("/");
    revalidatePath("/players");

    return NextResponse.json(
      {
        player: serializePlayer(player),
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
