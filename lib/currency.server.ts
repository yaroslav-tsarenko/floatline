import { cookies } from "next/headers";

import { CURRENCY_COOKIE, isCurrency, type Currency } from "@/lib/currency";

/**
 * Reads the display currency from the cookie. USD is the base/default —
 * everything is stored in USD and only converted for display.
 */
export async function getCurrency(): Promise<Currency> {
  const store = await cookies();
  const value = store.get(CURRENCY_COOKIE)?.value;
  return value && isCurrency(value) ? value : "USD";
}
