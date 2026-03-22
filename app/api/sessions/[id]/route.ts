import { NextResponse } from "next/server";

import { handleRouteError, jsonError, parseIdParam } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { serializeSession, sessionDetailInclude } from "@/lib/serializers";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const routeParams = await params;
  const sessionId = parseIdParam(routeParams.id);

  if (!sessionId) {
    return jsonError("Invalid session id.");
  }

  try {
    const session = await prisma.pokerSession.findUnique({
      where: { id: sessionId },
      include: sessionDetailInclude,
    });

    if (!session) {
      return jsonError("Session not found.", 404);
    }

    return NextResponse.json({
      session: serializeSession(session),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
