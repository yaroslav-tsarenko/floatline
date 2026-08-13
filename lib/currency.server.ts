import { cookies } from "next/headers";

import {
  CURRENCY_COOKIE,
  DEFAULT_CURRENCY,
  isCurrency,
  type Currency,
} from "@/lib/currency";

/**
 * Reads the display currency from the cookie. EUR is the default currency
 * shown to users; USD remains the stored base that everything is converted
 * from for display.
 */
export async function getCurrency(): Promise<Currency> {
  const store = await cookies();
  const value = store.get(CURRENCY_COOKIE)?.value;
  return value && isCurrency(value) ? value : DEFAULT_CURRENCY;
}
