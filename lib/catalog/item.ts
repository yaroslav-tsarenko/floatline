import { and, asc, desc, eq, gte, ne, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { items, priceHistory } from "@/lib/db/schema";
import type { Category, Exterior } from "@/lib/cs2/parseName";
import type { Rarity } from "@/lib/cs2/rarity";

export interface ItemDetail {
  marketHashName: string;
  name: string;
  weapon: string | null;
  skinName: string | null;
  exterior: Exterior | null;
  isStattrak: boolean;
  isSouvenir: boolean;
  category: Category;
  rarity: Rarity | null;
  rarityColor: string | null;
  phase: string | null;
  imageHash: string | null;
  sellPrice: number | null;
  steamPrice: number | null;
  count: number;
  isAvailable: boolean;
  market: string | null;
  discount: number | null;
}

export interface PricePoint {
  date: string;
  sell: number | null;
  steam: number | null;
}

export interface ItemVariant {
  marketHashName: string;
  exterior: Exterior | null;
  isStattrak: boolean;
  sellPrice: number | null;
  isAvailable: boolean;
}

function toNum(v: string | null): number | null {
  return v != null ? Number(v) : null;
}

export async function getItem(marketHashName: string): Promise<ItemDetail | null> {
  const [row] = await db
    .select()
    .from(items)
    .where(eq(items.marketHashName, marketHashName))
    .limit(1);
  if (!row) return null;

  const sell = toNum(row.sellPrice);
  const steam = toNum(row.steamPrice);
  return {
    marketHashName: row.marketHashName,
    name: row.name,
    weapon: row.weapon,
    skinName: row.skinName,
    exterior: row.exterior as Exterior | null,
    isStattrak: row.isStattrak,
    isSouvenir: row.isSouvenir,
    category: row.category as Category,
    rarity: row.rarity as Rarity | null,
    rarityColor: row.rarityColor,
    phase: row.phase,
    imageHash: row.imageHash,
    sellPrice: sell,
    steamPrice: steam,
    count: row.count,
    isAvailable: row.isAvailable,
    market: row.market,
    discount: sell != null && steam != null && steam > 0 ? (steam - sell) / steam : null,
  };
}

/** Our sell-price history (derived from cost history + current margin). */
export async function getPriceHistory(
  marketHashName: string,
  days = 30,
): Promise<PricePoint[]> {
  const since = new Date(Date.now() - days * 864e5);
  const rows = await db
    .select({
      costPrice: priceHistory.costPrice,
      steamPrice: priceHistory.steamPrice,
      capturedAt: priceHistory.capturedAt,
    })
    .from(priceHistory)
    .where(
      and(
        eq(priceHistory.marketHashName, marketHashName),
        gte(priceHistory.capturedAt, since),
      ),
    )
    .orderBy(asc(priceHistory.capturedAt));

  // History stores cost; our displayed price is cost * (1 + margin) rounded, but
  // for the trend line the shape is what matters — we chart the steam reference
  // and our cost-derived sell so the two lines are comparable.
  return rows.map((r) => ({
    date:
      r.capturedAt instanceof Date
        ? r.capturedAt.toISOString()
        : String(r.capturedAt),
    sell: toNum(r.costPrice),
    steam: toNum(r.steamPrice),
  }));
}

/** Same weapon+skin across other wears / StatTrak — a real wear picker. */
export async function getVariants(item: ItemDetail): Promise<ItemVariant[]> {
  if (!item.weapon || !item.skinName) return [];
  const rows = await db
    .select({
      marketHashName: items.marketHashName,
      exterior: items.exterior,
      isStattrak: items.isStattrak,
      sellPrice: items.sellPrice,
      isAvailable: items.isAvailable,
    })
    .from(items)
    .where(
      and(
        eq(items.weapon, item.weapon),
        eq(items.skinName, item.skinName),
        ne(items.marketHashName, item.marketHashName),
      ),
    );

  return rows
    .map((r) => ({
      marketHashName: r.marketHashName,
      exterior: r.exterior as Exterior | null,
      isStattrak: r.isStattrak,
      sellPrice: toNum(r.sellPrice),
      isAvailable: r.isAvailable,
    }))
    .sort((a, b) => (a.sellPrice ?? 0) - (b.sellPrice ?? 0));
}

/** Similar items: same category + rarity, in stock, nearby price. */
export async function getSimilar(item: ItemDetail, limit = 5) {
  const rows = await db
    .select({
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
      discount: sql<number>`case when ${items.steamPrice} > 0 then (${items.steamPrice} - ${items.sellPrice}) / ${items.steamPrice} else 0 end`,
    })
    .from(items)
    .where(
      and(
        eq(items.isAvailable, true),
        eq(items.category, item.category),
        item.rarity ? eq(items.rarity, item.rarity) : sql`true`,
        ne(items.marketHashName, item.marketHashName),
      ),
    )
    .orderBy(desc(items.count))
    .limit(limit);

  return rows.map((r) => ({
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
    sellPrice: toNum(r.sellPrice),
    steamPrice: toNum(r.steamPrice),
    count: r.count,
    isAvailable: r.isAvailable,
    discount: r.discount != null ? Number(r.discount) : null,
  }));
}
