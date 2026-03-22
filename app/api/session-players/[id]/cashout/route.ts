import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { handleRouteError, jsonError, parseIdParam, parseJsonBody } from "@/lib/api";
import { serializeSessionPlayer } from "@/lib/serializers";
import { updateSessionPlayerCashout } from "@/lib/session-service";
import { updateCashoutSchema } from "@/lib/validators";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const routeParams = await params;
  const sessionPlayerId = parseIdParam(routeParams.id);

  if (!sessionPlayerId) {
    return jsonError("Invalid session player id.");
  }

  const parsedBody = await parseJsonBody(request, updateCashoutSchema);

  if (!parsedBody.success) {
    return parsedBody.response;
  }

  try {
    const sessionPlayer = await updateSessionPlayerCashout(
      sessionPlayerId,
      parsedBody.data.cashout,
    );

    revalidatePath(`/sessions/${sessionPlayer.sessionId}`);

    return NextResponse.json({
      sessionPlayer: serializeSessionPlayer(sessionPlayer),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
