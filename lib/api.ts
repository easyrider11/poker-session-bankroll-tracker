import { NextResponse } from "next/server";
import { ZodType } from "zod";

import { isServiceError } from "@/lib/service-error";

export function jsonError(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    {
      error: message,
      details,
    },
    { status },
  );
}

export function parseIdParam(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function parseJsonBody<T>(request: Request, schema: ZodType<T>) {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return {
        success: false as const,
        response: jsonError("Invalid request payload.", 400, result.error.flatten()),
      };
    }

    return {
      success: true as const,
      data: result.data,
    };
  } catch {
    return {
      success: false as const,
      response: jsonError("Invalid JSON body."),
    };
  }
}

export function handleRouteError(error: unknown) {
  if (isServiceError(error)) {
    return jsonError(error.message, error.status);
  }

  console.error(error);
  return jsonError("Internal server error.", 500);
}
