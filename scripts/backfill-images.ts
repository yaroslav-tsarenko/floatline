/**
 * One-off backfill of `items.image_hash` from the Steam Community Market for
 * catalog rows that have none (e.g. seeded dev data, or SIH items that arrived
 * without an image). Idempotent: only touches rows where image_hash IS NULL, so
 * it's safe to re-run after a partial pass (Steam rate-limits aggressively).
 *
 *   tsx --env-file=.env scripts/backfill-images.ts
 */
import { eq, isNull, sql } from "drizzle-orm";

import { db, pool } from "@/lib/db";
import { items } from "@/lib/db/schema";

const SEARCH_URL = "https://steamcommunity.com/market/search/render/";
const APP_ID = 730;
const DELAY_MS = 800;
const MAX_RETRIES = 4;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Strips the StatTrak™/Souvenir prefix so one query returns every variant. */
function searchKey(marketHashName: string): string {
  return marketHashName.replace(/^(StatTrak™ |Souvenir )/, "");
}

interface SearchResult {
  hash_name?: string;
  asset_description?: { icon_url?: string };
}

async function fetchIcons(query: string): Promise<Map<string, string>> {
  const url = new URL(SEARCH_URL);
  url.searchParams.set("appid", String(APP_ID));
  url.searchParams.set("norender", "1");
  url.searchParams.set("count", "20");
  url.searchParams.set("query", query);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0", accept: "application/json" },
    });

    if (res.status === 429 || res.status >= 500) {
      const wait = DELAY_MS * 2 ** attempt;
      console.warn(`  ${res.status} on "${query}" — backing off ${wait}ms`);
      await sleep(wait);
      continue;
    }
    if (!res.ok) throw new Error(`search ${res.status} for "${query}"`);

    const data = (await res.json()) as { results?: SearchResult[] };
    const map = new Map<string, string>();
    for (const r of data.results ?? []) {
      const icon = r.asset_description?.icon_url;
      if (r.hash_name && icon) map.set(r.hash_name, icon);
    }
    return map;
  }

  throw new Error(`exhausted retries for "${query}"`);
}

async function main() {
  const rows = await db
    .select({ name: items.marketHashName })
    .from(items)
    .where(isNull(items.imageHash));

  console.log(`${rows.length} items missing an image.`);
  if (rows.length === 0) {
    await pool.end();
    return;
  }

  // Distinct queries — one search key covers normal/StatTrak/Souvenir variants.
  const wanted = new Set(rows.map((r) => r.name));
  const keys = [...new Set(rows.map((r) => searchKey(r.name)))];

  let updated = 0;
  let failed = 0;

  for (const [i, key] of keys.entries()) {
    try {
      const icons = await fetchIcons(key);
      for (const [hashName, icon] of icons) {
        if (!wanted.has(hashName)) continue;
        await db
          .update(items)
          .set({ imageHash: icon })
          .where(eq(items.marketHashName, hashName));
        updated++;
      }
      console.log(`[${i + 1}/${keys.length}] ${key} — ${icons.size} hits`);
    } catch (err) {
      failed++;
      console.error(`[${i + 1}/${keys.length}] ${key} — ${String(err)}`);
    }
    await sleep(DELAY_MS);
  }

  const [{ remaining }] = await db
    .select({ remaining: sql<number>`count(*) filter (where image_hash is null)` })
    .from(items);

  console.log(`\nUpdated ${updated} rows, ${failed} queries failed, ${remaining} still null.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
