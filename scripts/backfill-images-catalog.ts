/**
 * Fallback image backfill from the public ByMykel CS2 item catalog. Unlike
 * scripts/backfill-images.ts (which scrapes Steam Market search and therefore
 * only finds items with active listings), this reads a full item→image map, so
 * it can fill listing-less grails (Dragon Lore, Howl, high knives/gloves) that
 * Market search never returns.
 *
 * The catalog's `image` is a Steam economy URL whose path segment is the exact
 * icon_url hash our SkinImage expects. One hash covers every wear/StatTrak
 * variant of a skin. Idempotent: only touches rows where image_hash IS NULL.
 *
 *   tsx --env-file=.env scripts/backfill-images-catalog.ts
 */
import { eq, isNull } from "drizzle-orm";

import { db, pool } from "@/lib/db";
import { items } from "@/lib/db/schema";

const CATALOG_URL =
  "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json";
const ECON_PREFIX = "/economy/image/";

interface CatalogSkin {
  name?: string;
  image?: string;
}

/** Pull the steam economy icon hash out of a full catalog image URL. */
function hashFromImage(image: string | undefined): string | null {
  if (!image) return null;
  const i = image.indexOf(ECON_PREFIX);
  if (i === -1) return null;
  return image.slice(i + ECON_PREFIX.length).replace(/\/$/, "") || null;
}

/** Reduce a market_hash_name to the catalog's base name (drop wear + prefixes). */
function baseName(marketHashName: string): string {
  return marketHashName
    .replace(/\s*\([^)]*\)\s*$/, "")
    .replace(/StatTrak™ /, "")
    .replace(/Souvenir /, "")
    .trim();
}

async function main() {
  const res = await fetch(CATALOG_URL);
  if (!res.ok) throw new Error(`catalog fetch ${res.status}`);
  const catalog = (await res.json()) as CatalogSkin[];

  // name -> hash. Also index by base name so phase variants ("... (Phase 2)")
  // still resolve to their shared icon.
  const byName = new Map<string, string>();
  for (const s of catalog) {
    const hash = hashFromImage(s.image);
    if (!s.name || !hash) continue;
    if (!byName.has(s.name)) byName.set(s.name, hash);
    const base = baseName(s.name);
    if (!byName.has(base)) byName.set(base, hash);
  }

  const rows = await db
    .select({ name: items.marketHashName })
    .from(items)
    .where(isNull(items.imageHash));

  console.log(`${rows.length} items missing an image; catalog has ${byName.size} names.`);

  let updated = 0;
  const unresolved: string[] = [];
  for (const r of rows) {
    const base = baseName(r.name);
    const hash =
      byName.get(base) ??
      // Prefix fallback: "★ Karambit | Doppler" vs "... (Phase 2)".
      [...byName].find(([k]) => k.startsWith(base))?.[1];
    if (!hash) {
      unresolved.push(r.name);
      continue;
    }
    await db
      .update(items)
      .set({ imageHash: hash })
      .where(eq(items.marketHashName, r.name));
    updated++;
  }

  console.log(`Updated ${updated} rows, ${unresolved.length} unresolved.`);
  if (unresolved.length) console.log(unresolved.map((u) => `  ${u}`).join("\n"));
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
