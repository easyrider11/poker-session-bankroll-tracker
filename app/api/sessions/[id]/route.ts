import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { handleRouteError, jsonError, parseIdParam } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { serializeSession, sessionDetailInclude } from "@/lib/serializers";
import { deleteSession } from "@/lib/session-service";

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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const routeParams = await params;
  const sessionId = parseIdParam(routeParams.id);

  if (!sessionId) {
    return jsonError("Invalid session id.");
  }

  try {
    await deleteSession(sessionId);

    revalidatePath("/");
    revalidatePath("/sessions");

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
