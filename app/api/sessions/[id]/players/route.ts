import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { handleRouteError, jsonError, parseIdParam, parseJsonBody } from "@/lib/api";
import { serializeSessionPlayer } from "@/lib/serializers";
import { addPlayerToSession } from "@/lib/session-service";
import { createSessionPlayerSchema } from "@/lib/validators";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const routeParams = await params;
  const sessionId = parseIdParam(routeParams.id);

  if (!sessionId) {
    return jsonError("Invalid session id.");
  }

  const parsedBody = await parseJsonBody(request, createSessionPlayerSchema);

  if (!parsedBody.success) {
    return parsedBody.response;
  }

  try {
    const sessionPlayer = await addPlayerToSession(sessionId, parsedBody.data.playerId);

    revalidatePath(`/sessions/${sessionId}`);

    return NextResponse.json(
      {
        sessionPlayer: serializeSessionPlayer(sessionPlayer),
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
