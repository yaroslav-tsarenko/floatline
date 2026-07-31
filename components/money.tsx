"use client";

import { useCurrency } from "@/components/currency-provider";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/currency";

/**
 * The only way to render money on the site. Amounts are always passed in USD
 * (the storage/base currency); conversion happens here, reading the live
 * currency + rates from context so a switch re-formats every price instantly.
 */
export function Money({ usd, className }: { usd: number; className?: string }) {
  const { currency, rates } = useCurrency();
  return (
    <span className={cn("num tabular-nums", className)}>
      {formatMoney(usd, currency, rates)}
    </span>
  );
}
