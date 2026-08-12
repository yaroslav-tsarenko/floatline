import { and, inArray, lt, or, isNull, sql } from "drizzle-orm";

import { parseName } from "@/lib/cs2/parseName";
import { colorForRarity, resolveRarity } from "@/lib/cs2/rarity";
import { db } from "@/lib/db";
import { items, priceHistory } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { computeSellPrice, isSellable } from "@/lib/pricing";
import { sih } from "@/lib/sih/client";
import type { JobStats } from "./types";

const UPSERT_CHUNK = 500;
const HISTORY_CHUNK = 1_000;

function toNumeric(value: number | null | undefined): string | null {
  return value == null || !Number.isFinite(value) ? null : String(value);
}

/**
 * SIH returns either a Steam icon hash or a full URL to its own hotlink-blocked
 * CDN. Only keep bare Steam hashes; URLs are dropped so the image backfill can
 * fill a usable Steam hash instead.
 */
function steamHashOnly(image: string | null | undefined): string | null {
  if (!image || /^https?:\/\//i.test(image)) return null;
  return image;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

type ItemRow = typeof items.$inferInsert;

/**
 * Pulls the full SIH catalog, parses each market_hash_name, computes our sell
 * price, and upserts. Items no longer present are marked out of stock (never
 * deleted). Also snapshots price_history at most once per item per hour.
 */
export async function syncCatalog(): Promise<JobStats> {
  const runStart = new Date();
  const catalog = await sih.getItems({ extended: true });
  const entries = Object.entries(catalog);

  const rows: ItemRow[] = [];
  let availableCount = 0;

  for (const [marketHashName, v] of entries) {
    const parsed = parseName(marketHashName);
    const rarity = resolveRarity(v.color ?? null, parsed.category);
    const cost = v.price ?? null;
    const count = v.count ?? 0;
    const sellable = cost != null && isSellable(cost, count);
    if (sellable) availableCount++;

    rows.push({
      marketHashName,
      appId: env.SIH_APP_ID,
      name: marketHashName,
      weapon: parsed.weapon,
      skinName: parsed.skinName,
      exterior: parsed.exterior,
      isStattrak: parsed.isStattrak,
      isSouvenir: parsed.isSouvenir,
      category: parsed.category,
      rarity,
      rarityColor: v.color ?? colorForRarity(rarity),
      phase: v.phase ?? parsed.phase,
      imageHash: steamHashOnly(v.image),
      costPrice: toNumeric(cost),
      sellPrice: cost != null ? toNumeric(computeSellPrice(cost)) : null,
      steamPrice: toNumeric(v.steam ?? null),
      count,
      market: v.market ?? null,
      isAvailable: sellable,
      syncedAt: runStart,
    });
  }

  // Upsert everything present in this sync.
  for (const part of chunk(rows, UPSERT_CHUNK)) {
    await db
      .insert(items)
      .values(part)
      .onConflictDoUpdate({
        target: items.marketHashName,
        set: {
          appId: sql`excluded.app_id`,
          name: sql`excluded.name`,
          weapon: sql`excluded.weapon`,
          skinName: sql`excluded.skin_name`,
          exterior: sql`excluded.exterior`,
          isStattrak: sql`excluded.is_stattrak`,
          isSouvenir: sql`excluded.is_souvenir`,
          category: sql`excluded.category`,
          rarity: sql`excluded.rarity`,
          rarityColor: sql`excluded.rarity_color`,
          phase: sql`excluded.phase`,
          imageHash: sql`coalesce(excluded.image_hash, ${items.imageHash})`,
          costPrice: sql`excluded.cost_price`,
          sellPrice: sql`excluded.sell_price`,
          steamPrice: sql`excluded.steam_price`,
          count: sql`excluded.count`,
          market: sql`excluded.market`,
          isAvailable: sql`excluded.is_available`,
          syncedAt: sql`excluded.synced_at`,
        },
      });
  }

  // Anything not touched this run is no longer offered by SIH -> out of stock.
  const stale = await db
    .update(items)
    .set({ count: 0, isAvailable: false })
    .where(
      and(
        or(isNull(items.syncedAt), lt(items.syncedAt, runStart)),
        sql`(${items.count} <> 0 OR ${items.isAvailable} = true)`,
      ),
    )
    .returning({ marketHashName: items.marketHashName });

  const historyWritten = await writePriceHistory(rows, runStart);

  return {
    fetched: entries.length,
    upserted: rows.length,
    available: availableCount,
    markedUnavailable: stale.length,
    historyRows: historyWritten,
    durationMs: Date.now() - runStart.getTime(),
  };
}

async function writePriceHistory(
  rows: ItemRow[],
  runStart: Date,
): Promise<number> {
  const priced = rows.filter((r) => r.costPrice != null);
  const names = priced.map((r) => r.marketHashName);
  const recent = new Set<string>();

  for (const part of chunk(names, HISTORY_CHUNK)) {
    const found = await db
      .select({ name: priceHistory.marketHashName })
      .from(priceHistory)
      .where(
        and(
          inArray(priceHistory.marketHashName, part),
          sql`${priceHistory.capturedAt} > now() - interval '1 hour'`,
        ),
      );
    for (const r of found) recent.add(r.name);
  }

  const toInsert = priced
    .filter((r) => !recent.has(r.marketHashName))
    .map((r) => ({
      marketHashName: r.marketHashName,
      costPrice: r.costPrice ?? null,
      steamPrice: r.steamPrice ?? null,
      count: r.count ?? 0,
      capturedAt: runStart,
    }));

  for (const part of chunk(toInsert, HISTORY_CHUNK)) {
    await db.insert(priceHistory).values(part);
  }

  return toInsert.length;
}
