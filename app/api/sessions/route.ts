import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { handleRouteError, parseJsonBody } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { serializeSession } from "@/lib/serializers";
import { createSession } from "@/lib/session-service";
import { createSessionSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sessions = await prisma.pokerSession.findMany({
      include: {
        _count: {
          select: {
            sessionPlayers: true,
          },
        },
        sessionPlayers: {
          select: {
            totalBuyin: true,
            totalCashout: true,
            profit: true,
          },
        },
      },
      orderBy: [{ sessionDate: "desc" }, { id: "desc" }],
    });

    return NextResponse.json({
      sessions: sessions.map((session) => ({
        id: session.id,
        title: session.title,
        sessionDate: session.sessionDate.toISOString(),
        notes: session.notes,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
        finalizedAt: session.finalizedAt?.toISOString() ?? null,
        participantCount: session._count.sessionPlayers,
        totalBuyin: session.sessionPlayers.reduce((total, player) => total + player.totalBuyin, 0),
        totalCashout: session.sessionPlayers.reduce(
          (total, player) => total + player.totalCashout,
          0,
        ),
        totalProfit: session.sessionPlayers.reduce((total, player) => total + player.profit, 0),
      })),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  const parsedBody = await parseJsonBody(request, createSessionSchema);

  if (!parsedBody.success) {
    return parsedBody.response;
  }

  try {
    const session = await createSession(parsedBody.data);

    revalidatePath("/");
    revalidatePath("/players");
    revalidatePath("/sessions/new");
    revalidatePath(`/sessions/${session.id}`);

    return NextResponse.json(
      {
        session: serializeSession(session),
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
