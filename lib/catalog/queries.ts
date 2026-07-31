import { and, eq, gte, ilike, inArray, lte, sql, type SQL } from "drizzle-orm";

import { db } from "@/lib/db";
import { items } from "@/lib/db/schema";
import type { Category, Exterior } from "@/lib/cs2/parseName";
import type { Rarity } from "@/lib/cs2/rarity";
import type { CatalogFilter } from "./params";

export const PAGE_SIZE = 24;

export interface CatalogItem {
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
  discount: number | null;
}

type Dimension = "category" | "rarity" | "wear" | "stattrak" | "price";

// Matches the exterior enum order used by the float sort's array_position.
const WEAR_ORDER: Record<string, number> = {
  FN: 1,
  MW: 2,
  FT: 3,
  WW: 4,
  BS: 5,
};

/**
 * Builds the set of WHERE conditions for a filter. `exclude` drops one
 * dimension so facet counts for that dimension reflect every *other* active
 * filter (standard faceted-search behavior).
 */
function conditions(f: CatalogFilter, exclude?: Dimension): SQL[] {
  const c: SQL[] = [];

  if (f.available) c.push(eq(items.isAvailable, true));
  if (f.q) c.push(ilike(items.name, `%${f.q}%`));

  if (exclude !== "category" && f.category) {
    c.push(eq(items.category, f.category));
  }
  if (f.weapon) c.push(eq(items.weapon, f.weapon));

  if (exclude !== "wear" && f.wears.length) {
    c.push(inArray(items.exterior, f.wears));
  }
  if (exclude !== "rarity" && f.rarities.length) {
    c.push(inArray(items.rarity, f.rarities));
  }
  if (exclude !== "stattrak" && f.stattrak != null) {
    c.push(eq(items.isStattrak, f.stattrak));
  }
  if (f.souvenir != null) c.push(eq(items.isSouvenir, f.souvenir));

  if (exclude !== "price") {
    if (f.priceMin != null) c.push(gte(items.sellPrice, String(f.priceMin)));
    if (f.priceMax != null) c.push(lte(items.sellPrice, String(f.priceMax)));
  }

  return c;
}

const discountExpr = sql<number>`
  case when ${items.steamPrice} > 0
    then (${items.steamPrice} - ${items.sellPrice}) / ${items.steamPrice}
    else 0 end
`;

interface Cursor {
  v: string;
  k: string;
}

function encodeCursor(c: Cursor): string {
  return Buffer.from(JSON.stringify(c)).toString("base64url");
}

function decodeCursor(raw: string | null): Cursor | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString());
    if (typeof parsed?.v === "string" && typeof parsed?.k === "string") {
      return parsed as Cursor;
    }
  } catch {
    // ignore malformed cursor
  }
  return null;
}

/** Order expression + value getter + comparison direction per sort key. */
function sortConfig(f: CatalogFilter) {
  switch (f.sort) {
    case "price_asc":
      return {
        expr: sql`${items.sellPrice}`,
        cast: "numeric" as const,
        dir: "asc" as const,
        value: (r: CatalogItem) => String(r.sellPrice ?? 0),
      };
    case "price_desc":
      return {
        expr: sql`${items.sellPrice}`,
        cast: "numeric" as const,
        dir: "desc" as const,
        value: (r: CatalogItem) => String(r.sellPrice ?? 0),
      };
    case "new":
      return {
        expr: sql`${items.firstSeenAt}`,
        cast: "timestamptz" as const,
        dir: "desc" as const,
        value: (r: CatalogItem & { firstSeenAt?: string }) =>
          String(r.firstSeenAt ?? ""),
      };
    case "float":
      // Exterior enum order (FN→BS) is ascending float; NULLs sort last.
      return {
        expr: sql`array_position(enum_range(null::exterior), ${items.exterior})`,
        cast: "int" as const,
        dir: "asc" as const,
        value: (r: CatalogItem) =>
          String(WEAR_ORDER[r.exterior ?? ""] ?? 99),
      };
    case "discount":
    default:
      return {
        expr: discountExpr,
        cast: "numeric" as const,
        dir: "desc" as const,
        value: (r: CatalogItem) => String(r.discount ?? 0),
      };
  }
}

export interface CatalogPage {
  items: CatalogItem[];
  nextCursor: string | null;
}

export async function queryCatalog(f: CatalogFilter): Promise<CatalogPage> {
  const conds = conditions(f);
  const { expr, dir, cast } = sortConfig(f);
  const cursor = decodeCursor(f.cursor);

  // Keyset: continue strictly after the last (orderValue, marketHashName).
  // Expanded (not a row-tuple) so the parameter can carry an explicit cast.
  if (cursor) {
    const castType = sql.raw(cast); // cast is a fixed whitelist value
    const cv = sql`${cursor.v}::${castType}`;
    if (dir === "asc") {
      conds.push(
        sql`(${expr} > ${cv} or (${expr} = ${cv} and ${items.marketHashName} > ${cursor.k}))`,
      );
    } else {
      conds.push(
        sql`(${expr} < ${cv} or (${expr} = ${cv} and ${items.marketHashName} < ${cursor.k}))`,
      );
    }
  }

  const order =
    dir === "asc"
      ? sql`${expr} asc, ${items.marketHashName} asc`
      : sql`${expr} desc, ${items.marketHashName} desc`;

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
      firstSeenAt: items.firstSeenAt,
      discount: discountExpr,
    })
    .from(items)
    .where(and(...conds))
    .orderBy(order)
    .limit(PAGE_SIZE + 1);

  const mapped: (CatalogItem & { firstSeenAt: string })[] = rows.map((r) => ({
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
    firstSeenAt:
      r.firstSeenAt instanceof Date
        ? r.firstSeenAt.toISOString()
        : String(r.firstSeenAt),
  }));

  const hasMore = mapped.length > PAGE_SIZE;
  const pageItems = hasMore ? mapped.slice(0, PAGE_SIZE) : mapped;

  let nextCursor: string | null = null;
  if (hasMore && pageItems.length > 0) {
    const last = pageItems[pageItems.length - 1];
    const { value } = sortConfig(f);
    nextCursor = encodeCursor({ v: value(last), k: last.marketHashName });
  }

  return { items: pageItems, nextCursor };
}

export interface Facets {
  total: number;
  category: Record<string, number>;
  rarity: Record<string, number>;
  wear: Record<string, number>;
  stattrak: number;
  weapons: string[];
}

async function facetGroup(
  f: CatalogFilter,
  exclude: Dimension,
  column: SQL,
): Promise<Record<string, number>> {
  const rows = await db
    .select({ key: column, n: sql<number>`count(*)::int` })
    .from(items)
    .where(and(...conditions(f, exclude)))
    .groupBy(column);

  const out: Record<string, number> = {};
  for (const r of rows) {
    if (r.key != null) out[String(r.key)] = r.n;
  }
  return out;
}

export async function catalogFacets(f: CatalogFilter): Promise<Facets> {
  const [total, category, rarity, wear, stCount, weaponRows] = await Promise.all([
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(items)
      .where(and(...conditions(f)))
      .then((r) => r[0]?.n ?? 0),
    facetGroup(f, "category", sql`${items.category}`),
    facetGroup(f, "rarity", sql`${items.rarity}`),
    facetGroup(f, "wear", sql`${items.exterior}`),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(items)
      .where(and(...conditions(f, "stattrak"), eq(items.isStattrak, true)))
      .then((r) => r[0]?.n ?? 0),
    // Weapons available within the current category (drives the weapon filter).
    f.category
      ? db
          .selectDistinct({ weapon: items.weapon })
          .from(items)
          .where(
            and(eq(items.category, f.category), eq(items.isAvailable, true)),
          )
          .orderBy(items.weapon)
      : Promise.resolve([] as { weapon: string | null }[]),
  ]);

  return {
    total,
    category,
    rarity,
    wear,
    stattrak: stCount,
    weapons: weaponRows.map((w) => w.weapon).filter((w): w is string => !!w),
  };
}
