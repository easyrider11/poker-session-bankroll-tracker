export function parseMoneyToCents(value: unknown): number | null {
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value < 0) {
      return null;
    }

    const cents = Math.round(value * 100);
    return Math.abs(cents / 100 - value) > 0.000001 ? null : cents;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return null;
  }

  const [whole, fraction = ""] = normalized.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

export function centsToDollars(cents: number) {
  return Number((cents / 100).toFixed(2));
}

export function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function formatSignedCurrency(cents: number) {
  const formatted = formatCurrency(Math.abs(cents));
  return cents > 0 ? `+${formatted}` : cents < 0 ? `-${formatted}` : formatted;
}

export function formatBuyinList(amounts: number[]) {
  if (amounts.length === 0) {
    return "—";
  }

  return amounts.map(formatCurrency).join(", ");
}

export function sumMoney(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

export function calculateProfit(totalCashout: number, totalBuyin: number) {
  return totalCashout - totalBuyin;
}
