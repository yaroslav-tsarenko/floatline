"use client";

import { createContext, useCallback, useContext, useState } from "react";

import { setCurrencyAction } from "@/app/actions/currency";
import { type Currency, type FxRates } from "@/lib/currency";

interface CurrencyContextValue {
  currency: Currency;
  rates: FxRates;
  setCurrency: (currency: Currency) => void;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

/**
 * Holds the display currency and USD-based rates client-side so switching
 * re-formats every <Money> instantly, with no server round-trip. The choice is
 * persisted to a cookie (fire-and-forget) so SSR renders the right currency on
 * the next request. Rates are public, so exposing them to the client is fine.
 */
export function CurrencyProvider({
  initialCurrency,
  rates,
  children,
}: {
  initialCurrency: Currency;
  rates: FxRates;
  children: React.ReactNode;
}) {
  const [currency, setCurrencyState] = useState(initialCurrency);

  const setCurrency = useCallback((next: Currency) => {
    setCurrencyState(next);
    void setCurrencyAction(next);
  }, []);

  return (
    <CurrencyContext.Provider value={{ currency, rates, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return ctx;
}
