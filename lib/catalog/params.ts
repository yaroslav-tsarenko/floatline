import type { Exterior, Category } from "@/lib/cs2/parseName";
import type { Rarity } from "@/lib/cs2/rarity";

export const SORTS = [
  "price_asc",
  "price_desc",
  "discount",
  "new",
  "float",
] as const;
export type SortKey = (typeof SORTS)[number];

export const SORT_LABELS: Record<SortKey, string> = {
  price_asc: "Price · low to high",
  price_desc: "Price · high to low",
  discount: "Biggest discount",
  new: "Newest",
  float: "Float · low to high",
};

export const CATEGORIES: Category[] = [
  "rifle",
  "pistol",
  "knife",
  "gloves",
  "smg",
  "heavy",
  "agent",
  "sticker",
  "other",
];

export const WEARS: Exterior[] = ["FN", "MW", "FT", "WW", "BS"];

export const RARITIES: Rarity[] = [
  "consumer",
  "industrial",
  "milspec",
  "restricted",
  "classified",
  "covert",
  "contraband",
];

export interface CatalogFilter {
  q: string;
  category: Category | null;
  weapon: string | null;
  wears: Exterior[];
  rarities: Rarity[];
  stattrak: boolean | null; // null = any
  souvenir: boolean | null;
  priceMin: number | null;
  priceMax: number | null;
  available: boolean;
  sort: SortKey;
  cursor: string | null;
}

export type SearchParamsInput = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function csv<T extends string>(
  v: string | string[] | undefined,
  allowed: readonly T[],
): T[] {
  const raw = first(v);
  if (!raw) return [];
  const set = new Set(allowed as readonly string[]);
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is T => set.has(s));
}

function num(v: string | string[] | undefined): number | null {
  const raw = first(v);
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function tri(v: string | string[] | undefined): boolean | null {
  const raw = first(v);
  if (raw === "1" || raw === "true") return true;
  if (raw === "0" || raw === "false") return false;
  return null;
}

export function parseFilter(sp: SearchParamsInput): CatalogFilter {
  const category = (first(sp.category) as Category) ?? null;
  const validCategory = category && CATEGORIES.includes(category) ? category : null;
  const sort = first(sp.sort) as SortKey;

  return {
    q: (first(sp.q) ?? "").trim().slice(0, 80),
    category: validCategory,
    weapon: first(sp.weapon) ?? null,
    wears: csv(sp.wear, WEARS),
    rarities: csv(sp.rarity, RARITIES),
    stattrak: tri(sp.st),
    souvenir: tri(sp.souvenir),
    priceMin: num(sp.min),
    priceMax: num(sp.max),
    available: tri(sp.all) === true ? false : true, // ?all=1 shows out of stock too
    sort: SORTS.includes(sort) ? sort : "new",
    cursor: first(sp.cursor) ?? null,
  };
}

/**
 * Serializes a filter back to a query string. `patch` overrides fields; passing
 * a field resets the cursor unless the patch itself sets one.
 */
export function toQuery(
  filter: CatalogFilter,
  patch: Partial<CatalogFilter> = {},
): string {
  const f = { ...filter, ...patch };
  if (!("cursor" in patch)) f.cursor = null;

  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.category) p.set("category", f.category);
  if (f.weapon) p.set("weapon", f.weapon);
  if (f.wears.length) p.set("wear", f.wears.join(","));
  if (f.rarities.length) p.set("rarity", f.rarities.join(","));
  if (f.stattrak != null) p.set("st", f.stattrak ? "1" : "0");
  if (f.souvenir != null) p.set("souvenir", f.souvenir ? "1" : "0");
  if (f.priceMin != null) p.set("min", String(f.priceMin));
  if (f.priceMax != null) p.set("max", String(f.priceMax));
  if (!f.available) p.set("all", "1");
  if (f.sort !== "new") p.set("sort", f.sort);
  if (f.cursor) p.set("cursor", f.cursor);

  const s = p.toString();
  return s ? `?${s}` : "";
}

export function activeFilterCount(f: CatalogFilter): number {
  let n = 0;
  if (f.q) n++;
  if (f.category) n++;
  if (f.weapon) n++;
  n += f.wears.length;
  n += f.rarities.length;
  if (f.stattrak != null) n++;
  if (f.souvenir != null) n++;
  if (f.priceMin != null || f.priceMax != null) n++;
  return n;
}
