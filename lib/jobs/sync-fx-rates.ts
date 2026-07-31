import { sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { fxRates } from "@/lib/db/schema";
import { isCurrency } from "@/lib/currency";
import { env } from "@/lib/env";

import type { JobStats } from "./types";

const TIMEOUT_MS = 10_000;

/**
 * Refreshes USD-based FX rates from the configured provider (Frankfurter shape:
 * `{ rates: { EUR, GBP } }`) and upserts them. Only currencies in our enum are
 * stored; USD is the base and never a quote. Rates older than 24h are ignored
 * downstream, so this must run at least daily.
 */
export async function syncFxRates(): Promise<JobStats> {
  const quotes = env.FX_QUOTES.filter((q) => isCurrency(q) && q !== env.FX_BASE);

  const url = new URL("/latest", env.FX_API_URL);
  url.searchParams.set("from", env.FX_BASE);
  url.searchParams.set("to", quotes.join(","));

  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`FX API ${res.status}`);

  const data = (await res.json()) as { rates?: Record<string, number> };
  const rates = data.rates ?? {};
  const now = new Date();

  let updated = 0;
  for (const quote of quotes) {
    const rate = rates[quote];
    if (!isCurrency(quote) || typeof rate !== "number" || !(rate > 0)) continue;

    await db
      .insert(fxRates)
      .values({ quote, rate: String(rate), fetchedAt: now })
      .onConflictDoUpdate({
        target: fxRates.quote,
        set: { rate: sql`excluded.rate`, fetchedAt: sql`excluded.fetched_at` },
      });
    updated++;
  }

  return { requested: quotes.length, updated };
}
