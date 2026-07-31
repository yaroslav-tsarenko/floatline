"use server";

import { cookies } from "next/headers";

import {
  CURRENCY_COOKIE,
  CURRENCY_MAX_AGE,
  isCurrency,
  type Currency,
} from "@/lib/currency";

export async function setCurrencyAction(currency: Currency): Promise<void> {
  if (!isCurrency(currency)) return;
  const store = await cookies();
  store.set(CURRENCY_COOKIE, currency, {
    maxAge: CURRENCY_MAX_AGE,
    sameSite: "lax",
    path: "/",
  });
}
