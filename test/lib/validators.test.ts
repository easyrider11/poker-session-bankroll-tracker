import {
  addBuyinSchema,
  createPlayerSchema,
  createSessionSchema,
  updateCashoutSchema,
} from "@/lib/validators";

describe("validation schemas", () => {
  it("rejects blank player names", () => {
    const result = createPlayerSchema.safeParse({
      name: "   ",
      nickname: "",
    });

    expect(result.success).toBe(false);
  });

  it("normalizes optional nickname values", () => {
    const result = createPlayerSchema.parse({
      name: "Alex Rivera",
      nickname: "   ",
    });

    expect(result.nickname).toBeNull();
  });

  it("parses session payloads into dates and cents", () => {
    const result = createSessionSchema.parse({
      title: "Friday Night $1/$3",
      sessionDate: "2026-03-20",
      notes: "Home game",
      players: [
        {
          playerId: 1,
          buyins: ["100", "50.25"],
          cashout: "210.50",
        },
      ],
    });

    expect(result.sessionDate).toBeInstanceOf(Date);
    expect(result.players[0]?.buyins).toEqual([10000, 5025]);
    expect(result.players[0]?.cashout).toBe(21050);
  });

  it("rejects duplicate players in the same session payload", () => {
    const result = createSessionSchema.safeParse({
      title: "Duplicate test",
      sessionDate: "2026-03-20",
      players: [
        { playerId: 1, buyins: ["100"], cashout: "0" },
        { playerId: 1, buyins: ["50"], cashout: "0" },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("requires positive buy-ins and non-negative cash-outs", () => {
    expect(addBuyinSchema.safeParse({ amount: "0" }).success).toBe(false);
    expect(updateCashoutSchema.safeParse({ cashout: "-1" }).success).toBe(false);
    expect(updateCashoutSchema.parse({ cashout: "0" }).cashout).toBe(0);
  });
});
