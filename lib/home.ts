import { cache } from "react";
import { and, desc, eq, gte, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { items, orders, priceHistory } from "@/lib/db/schema";
import type { CatalogItem } from "@/lib/catalog/queries";
import type { Category, Exterior } from "@/lib/cs2/parseName";
import type { Rarity } from "@/lib/cs2/rarity";

const discountExpr = sql<number>`case when ${items.steamPrice} > 0 then (${items.steamPrice} - ${items.sellPrice}) / ${items.steamPrice} else 0 end`;

const CARD_COLUMNS = {
  marketHashName: items.marketHashName,
  name: items.name,
  weapon: items.weapon,
  skinName: items.skinName,
  exterior: items.exterior,
  isStattrak: items.isStattrak,
  isSouvenir: items.isSouvenir,
  category: items.category,
  rarity: items.rarity,
  rarityColor: items.rarityColor,
  phase: items.phase,
  imageHash: items.imageHash,
  sellPrice: items.sellPrice,
  steamPrice: items.steamPrice,
  count: items.count,
  isAvailable: items.isAvailable,
  discount: discountExpr,
};

type CardRow = {
  marketHashName: string;
  name: string;
  weapon: string | null;
  skinName: string | null;
  exterior: string | null;
  isStattrak: boolean;
  isSouvenir: boolean;
  category: string;
  rarity: string | null;
  rarityColor: string | null;
  phase: string | null;
  imageHash: string | null;
  sellPrice: string | null;
  steamPrice: string | null;
  count: number;
  isAvailable: boolean;
  discount: number | null;
};

function toCard(r: CardRow): CatalogItem {
  return {
    marketHashName: r.marketHashName,
    name: r.name,
    weapon: r.weapon,
    skinName: r.skinName,
    exterior: r.exterior as Exterior | null,
    isStattrak: r.isStattrak,
    isSouvenir: r.isSouvenir,
    category: r.category as Category,
    rarity: r.rarity as Rarity | null,
    rarityColor: r.rarityColor,
    phase: r.phase,
    imageHash: r.imageHash,
    sellPrice: r.sellPrice != null ? Number(r.sellPrice) : null,
    steamPrice: r.steamPrice != null ? Number(r.steamPrice) : null,
    count: r.count,
    isAvailable: r.isAvailable,
    discount: r.discount != null ? Number(r.discount) : null,
  };
}

export interface HomeStats {
  inStock: number;
  avgDiscount: number | null;
  avgDeliveryMinutes: number | null;
}

// Cached per request so the header and homepage share one execution instead
// of both firing these full-table aggregates in parallel against the pool.
export const getHomeStats = cache(async (): Promise<HomeStats> => {
  const [agg] = await db
    .select({
      inStock: sql<number>`count(*)::int`,
      avgDiscount: sql<number>`avg(${discountExpr}) filter (where ${items.steamPrice} > 0)`,
    })
    .from(items)
    .where(eq(items.isAvailable, true));

  // Avg delivery over the last 24h of finished orders (null until we have data).
  const [delivery] = await db
    .select({
      minutes: sql<number | null>`avg(extract(epoch from (${orders.finishedAt} - ${orders.createdAt})) / 60)`,
    })
    .from(orders)
    .where(
      and(
        eq(orders.status, "finished"),
        gte(orders.finishedAt, sql`now() - interval '24 hours'`),
      ),
    );

  return {
    inStock: agg?.inStock ?? 0,
    avgDiscount: agg?.avgDiscount != null ? Number(agg.avgDiscount) : null,
    avgDeliveryMinutes:
      delivery?.minutes != null ? Number(delivery.minutes) : null,
  };
});

export async function getBestValue(limit = 8): Promise<CatalogItem[]> {
  const rows = await db
    .select(CARD_COLUMNS)
    .from(items)
    .where(and(eq(items.isAvailable, true), sql`${items.steamPrice} > 0`))
    .orderBy(desc(discountExpr))
    .limit(limit);
  return rows.map(toCard);
}

export async function getNewArrivals(limit = 8): Promise<CatalogItem[]> {
  const rows = await db
    .select(CARD_COLUMNS)
    .from(items)
    .where(
      and(
        eq(items.isAvailable, true),
        gte(items.firstSeenAt, sql`now() - interval '24 hours'`),
      ),
    )
    .orderBy(desc(items.firstSeenAt))
    .limit(limit);
  return rows.map(toCard);
}

export interface CategoryCount {
  category: Category;
  count: number;
}

export async function getCategoryCounts(): Promise<CategoryCount[]> {
  const rows = await db
    .select({ category: items.category, count: sql<number>`count(*)::int` })
    .from(items)
    .where(eq(items.isAvailable, true))
    .groupBy(items.category)
    .orderBy(desc(sql`count(*)`));
  return rows.map((r) => ({ category: r.category as Category, count: r.count }));
}

/** Most expensive in-stock listings — the homepage "High-Tier Vault". */
export async function getVaultItems(limit = 6): Promise<CatalogItem[]> {
  const rows = await db
    .select(CARD_COLUMNS)
    .from(items)
    .where(and(eq(items.isAvailable, true), sql`${items.sellPrice} is not null`))
    .orderBy(desc(items.sellPrice))
    .limit(limit);
  return rows.map(toCard);
}

export interface MarketPoint {
  date: string;
  index: number;
  volume: number;
}

/** Daily average-price index and tracked-listing volume for the last 30 days. */
export async function getMarketSeries(): Promise<MarketPoint[]> {
  const bucket = sql`date_trunc('day', ${priceHistory.capturedAt})`;
  const rows = await db
    .select({
      day: sql<string>`to_char(${bucket}, 'YYYY-MM-DD')`,
      index: sql<number>`avg(${priceHistory.costPrice})`,
      volume: sql<number>`sum(${priceHistory.count})::int`,
    })
    .from(priceHistory)
    .where(gte(priceHistory.capturedAt, sql`now() - interval '30 days'`))
    .groupBy(bucket)
    .orderBy(bucket);

  return rows.map((r) => ({
    date: r.day,
    index: r.index != null ? Number(r.index) : 0,
    volume: r.volume ?? 0,
  }));
}

const RARITY_ORDER: Record<Rarity, number> = {
  consumer: 0,
  industrial: 1,
  milspec: 2,
  restricted: 3,
  classified: 4,
  covert: 5,
  contraband: 6,
};

export interface RaritySlice {
  rarity: Rarity;
  count: number;
  color: string | null;
}

/** In-stock counts per rarity tier — powers the rarity explorer. */
export async function getRarityDistribution(): Promise<RaritySlice[]> {
  const rows = await db
    .select({
      rarity: items.rarity,
      color: sql<string | null>`max(${items.rarityColor})`,
      count: sql<number>`count(*)::int`,
    })
    .from(items)
    .where(and(eq(items.isAvailable, true), sql`${items.rarity} is not null`))
    .groupBy(items.rarity);

  return rows
    .map((r) => ({
      rarity: r.rarity as Rarity,
      count: r.count,
      color: r.color,
    }))
    .sort((a, b) => RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity]);
}

export interface NavCategory {
  category: Category;
  count: number;
  weapons: { name: string; count: number }[];
}

/** Categories with their top weapons — powers the header mega-menu. */
export const getNavCategories = cache(async (): Promise<NavCategory[]> => {
  const rows = await db
    .select({
      category: items.category,
      weapon: items.weapon,
      count: sql<number>`count(*)::int`,
    })
    .from(items)
    .where(eq(items.isAvailable, true))
    .groupBy(items.category, items.weapon);

  const byCat = new Map<Category, NavCategory>();
  for (const r of rows) {
    const cat = r.category as Category;
    const entry =
      byCat.get(cat) ?? { category: cat, count: 0, weapons: [] };
    entry.count += r.count;
    if (r.weapon) entry.weapons.push({ name: r.weapon, count: r.count });
    byCat.set(cat, entry);
  }

  for (const entry of byCat.values()) {
    entry.weapons.sort((a, b) => b.count - a.count);
    entry.weapons = entry.weapons.slice(0, 10);
  }

  return [...byCat.values()].sort((a, b) => b.count - a.count);
});

export interface PriceMover {
  marketHashName: string;
  name: string;
  weapon: string | null;
  skinName: string | null;
  rarityColor: string | null;
  changePct: number;
  points: number[];
}

/** Top gainers/losers over the last 7 days, with a sparkline series. */
export async function getPriceMovers(
  perSide = 5,
): Promise<{ up: PriceMover[]; down: PriceMover[] }> {
  const rows = await db
    .select({
      marketHashName: priceHistory.marketHashName,
      cost: priceHistory.costPrice,
      capturedAt: priceHistory.capturedAt,
      name: items.name,
      weapon: items.weapon,
      skinName: items.skinName,
      rarityColor: items.rarityColor,
      isAvailable: items.isAvailable,
    })
    .from(priceHistory)
    .innerJoin(items, eq(items.marketHashName, priceHistory.marketHashName))
    .where(
      and(
        gte(priceHistory.capturedAt, sql`now() - interval '7 days'`),
        eq(items.isAvailable, true),
      ),
    )
    .orderBy(priceHistory.marketHashName, priceHistory.capturedAt);

  const byItem = new Map<
    string,
    { meta: Omit<PriceMover, "changePct" | "points">; costs: number[] }
  >();

  for (const r of rows) {
    if (r.cost == null) continue;
    const cost = Number(r.cost);
    const entry = byItem.get(r.marketHashName) ?? {
      meta: {
        marketHashName: r.marketHashName,
        name: r.name,
        weapon: r.weapon,
        skinName: r.skinName,
        rarityColor: r.rarityColor,
      },
      costs: [],
    };
    entry.costs.push(cost);
    byItem.set(r.marketHashName, entry);
  }

  const movers: PriceMover[] = [];
  for (const { meta, costs } of byItem.values()) {
    if (costs.length < 2) continue;
    const first = costs[0];
    const last = costs[costs.length - 1];
    if (first <= 0) continue;
    movers.push({ ...meta, changePct: (last - first) / first, points: costs });
  }

  const up = movers
    .filter((m) => m.changePct > 0)
    .sort((a, b) => b.changePct - a.changePct)
    .slice(0, perSide);
  const down = movers
    .filter((m) => m.changePct < 0)
    .sort((a, b) => a.changePct - b.changePct)
    .slice(0, perSide);

  return { up, down };
}

export interface LivePurchase {
  id: string;
  itemName: string;
  price: number;
  finishedAt: string;
}

/** Recent successful purchases for the live feed (no personal data). */
export async function getLivePurchases(limit = 12): Promise<LivePurchase[]> {
  const rows = await db
    .select({
      id: orders.id,
      snapshot: orders.itemSnapshot,
      shownPrice: orders.shownPrice,
      finishedAt: orders.finishedAt,
    })
    .from(orders)
    .where(eq(orders.status, "finished"))
    .orderBy(desc(orders.finishedAt))
    .limit(limit);

  return rows.map((r) => {
    const snap = (r.snapshot ?? {}) as { name?: string };
    return {
      id: r.id,
      itemName: snap.name ?? "CS2 skin",
      price: Number(r.shownPrice),
      finishedAt:
        r.finishedAt instanceof Date
          ? r.finishedAt.toISOString()
          : String(r.finishedAt ?? ""),
    };
  });
}
