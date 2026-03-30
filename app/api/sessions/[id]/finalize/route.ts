import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { handleRouteError, jsonError, parseIdParam } from "@/lib/api";
import { serializeSession } from "@/lib/serializers";
import { finalizeSession } from "@/lib/session-service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const routeParams = await params;
  const sessionId = parseIdParam(routeParams.id);

  if (!sessionId) {
    return jsonError("Invalid session id.");
  }

  try {
    const session = await finalizeSession(sessionId);

    revalidatePath("/");
    revalidatePath("/players");
    revalidatePath("/sessions");
    revalidatePath(`/sessions/${sessionId}`);

    session.sessionPlayers.forEach((sessionPlayer) => {
      revalidatePath(`/players/${sessionPlayer.playerId}`);
    });

    return NextResponse.json({
      session: serializeSession(session),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
