"use client";

import { useCurrency } from "@/components/currency-provider";
import { cn } from "@/lib/cn";
import { CURRENCIES, CURRENCY_SYMBOL, type Currency } from "@/lib/currency";

export function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrency();

  return (
    <div
      role="radiogroup"
      aria-label="Currency"
      className="inline-flex items-center gap-0.5 rounded-md border border-border bg-surface p-0.5"
    >
      {CURRENCIES.map((c: Currency) => {
        const isActive = currency === c;
        return (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={c}
            title={c}
            onClick={() => setCurrency(c)}
            className={cn(
              // fixed width reserves space so switching never shifts layout
              "num grid h-7 w-7 place-items-center rounded text-sm transition-colors",
              "text-muted hover:text-text",
              isActive && "bg-surface-2 text-signal",
            )}
          >
            {CURRENCY_SYMBOL[c]}
          </button>
        );
      })}
    </div>
  );
}
