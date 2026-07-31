export type Currency = "USD" | "EUR" | "GBP";

export const CURRENCIES = ["USD", "EUR", "GBP"] as const;

export const CURRENCY_SYMBOL: Record<Currency, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
};

export const CURRENCY_COOKIE = "currency";
export const CURRENCY_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export function isCurrency(value: string): value is Currency {
  return (CURRENCIES as readonly string[]).includes(value);
}

/** USD-based conversion rates, keyed by quote currency. USD is always 1. */
export type FxRates = Partial<Record<Exclude<Currency, "USD">, number>>;

function intlFormat(amount: number, currency: Currency): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    amount,
  );
}

/**
 * Formats a USD amount in the given display currency. When the rate for a
 * non-USD currency is missing/stale, falls back to the USD amount so we never
 * show a price at an unknown rate. Pure — safe on client and server.
 */
export function formatMoney(
  usd: number,
  currency: Currency,
  rates: FxRates,
): string {
  if (currency !== "USD") {
    const rate = rates[currency];
    if (rate) return intlFormat(usd * rate, currency);
  }
  return intlFormat(usd, "USD");
}
