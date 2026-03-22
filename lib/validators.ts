import { z } from "zod";

import { parseMoneyToCents } from "@/lib/amounts";

const optionalTextSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (typeof value !== "string") {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  });

const moneyCentsSchema = z.union([z.string(), z.number()]).transform((value, ctx) => {
  const cents = parseMoneyToCents(value);

  if (cents === null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Amount must be a non-negative number with up to 2 decimals.",
    });
    return z.NEVER;
  }

  return cents;
});

const buyinAmountSchema = moneyCentsSchema.refine((value) => value > 0, {
  message: "Buy-ins must be greater than zero.",
});

export const createPlayerSchema = z.object({
  name: z.string().trim().min(1, "Player name is required."),
  nickname: optionalTextSchema,
});

export const createSessionPlayerSchema = z.object({
  playerId: z.coerce.number().int().positive(),
});

const sessionParticipantSchema = z.object({
  playerId: z.coerce.number().int().positive(),
  buyins: z.array(buyinAmountSchema).default([]),
  cashout: z.preprocess(
    (value) => (value === "" || value === undefined || value === null ? 0 : value),
    moneyCentsSchema,
  ),
});

export const createSessionSchema = z
  .object({
    title: z.string().trim().min(1, "Session title is required."),
    sessionDate: z.coerce.date(),
    notes: optionalTextSchema,
    players: z.array(sessionParticipantSchema).default([]),
  })
  .superRefine((value, ctx) => {
    const seenPlayerIds = new Set<number>();

    value.players.forEach((player, index) => {
      if (seenPlayerIds.has(player.playerId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "A player can only be added once per session.",
          path: ["players", index, "playerId"],
        });
      }

      seenPlayerIds.add(player.playerId);
    });
  });

export const addBuyinSchema = z.object({
  amount: buyinAmountSchema,
});

export const updateCashoutSchema = z.object({
  cashout: z.preprocess(
    (value) => (value === "" || value === undefined || value === null ? 0 : value),
    moneyCentsSchema,
  ),
});
