import { cache } from "react";

import { db } from "@/lib/db";
import { fxRates } from "@/lib/db/schema";
import type { FxRates } from "@/lib/currency";

const MAX_AGE_MS = 24 * 60 * 60 * 1000; // rates older than 24h are unusable

export type { FxRates };

/**
 * Fresh USD-based FX rates from the DB, memoized per request. Stale (>24h) or
 * missing rates are omitted so callers fall back to USD rather than showing a
 * price at an unknown rate. Never throws — on any DB error returns {}.
 */
export const getFxRates = cache(async (): Promise<FxRates> => {
  try {
    const rows = await db
      .select({
        quote: fxRates.quote,
        rate: fxRates.rate,
        fetchedAt: fxRates.fetchedAt,
      })
      .from(fxRates);

    const now = Date.now();
    const out: FxRates = {};
    for (const row of rows) {
      if (row.quote === "USD") continue;
      const fresh = now - row.fetchedAt.getTime() <= MAX_AGE_MS;
      const rate = Number(row.rate);
      if (fresh && Number.isFinite(rate) && rate > 0) {
        out[row.quote] = rate;
      }
    }
    return out;
  } catch {
    return {};
  }
});
