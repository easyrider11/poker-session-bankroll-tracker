import {
  calculateProfit,
  formatBuyinList,
  parseMoneyToCents,
  sumMoney,
} from "@/lib/amounts";

describe("amount helpers", () => {
  it("parses valid string amounts into cents", () => {
    expect(parseMoneyToCents("100")).toBe(10000);
    expect(parseMoneyToCents("100.5")).toBe(10050);
    expect(parseMoneyToCents("100.50")).toBe(10050);
  });

  it("rejects invalid or negative amounts", () => {
    expect(parseMoneyToCents("")).toBeNull();
    expect(parseMoneyToCents("12.345")).toBeNull();
    expect(parseMoneyToCents("-1")).toBeNull();
    expect(parseMoneyToCents("abc")).toBeNull();
  });

  it("computes session totals and profit correctly", () => {
    expect(sumMoney([10000, 5000, 2500])).toBe(17500);
    expect(calculateProfit(22000, 17500)).toBe(4500);
  });

  it("formats the buy-in record list for display", () => {
    expect(formatBuyinList([])).toBe("—");
    expect(formatBuyinList([10000, 5000])).toContain("$100.00");
    expect(formatBuyinList([10000, 5000])).toContain("$50.00");
  });
});
