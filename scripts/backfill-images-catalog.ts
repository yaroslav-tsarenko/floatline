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

// ByMykel splits the catalog across one endpoint per item family. skins.json
// covers weapons/knives/gloves; the rest carry stickers, graffiti, music kits,
// pins, cases, capsules, etc. — everything that otherwise renders "no image".
const API_BASE =
  "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/";
const ENDPOINTS = [
  "skins",
  "stickers",
  "collectibles",
  "keychains",
  "graffiti",
  "patches",
  "music_kits",
  "agents",
  "crates",
];
const ECON_PREFIX = "/economy/image/";

interface CatalogSkin {
  name?: string;
  image?: string;
  phase?: string | null;
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

const WEAR = /\s*\((?:Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)\s*$/;

/**
 * Normalize a name so a phase variant matches its catalog entry while keeping
 * the phase distinct. ByMykel writes "Doppler (Phase 2)"; our market_hash_name
 * writes "Doppler Phase 2 (Minimal Wear)". Dropping only the wear paren and the
 * parens *around* the phase/gem (not the phase itself) makes both collapse to
 * "Doppler Phase 2", preserving per-phase images that baseName would lose.
 */
function normalize(name: string): string {
  return name
    .replace(WEAR, "")
    .replace(/StatTrak™ /, "")
    .replace(/Souvenir /, "")
    .replace(/[★()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  const catalog: CatalogSkin[] = [];
  for (const ep of ENDPOINTS) {
    const res = await fetch(API_BASE + ep + ".json");
    if (!res.ok) throw new Error(`catalog fetch ${ep} ${res.status}`);
    const part = (await res.json()) as CatalogSkin[];
    catalog.push(...part);
  }

  // Two indexes: `byNorm` keeps the phase/gem distinct (Doppler Phase 2 vs Ruby
  // resolve to different icons); `byName` on base name is the looser fallback
  // for anything the normalized form misses.
  const byNorm = new Map<string, string>();
  const byName = new Map<string, string>();
  for (const s of catalog) {
    const hash = hashFromImage(s.image);
    if (!s.name || !hash) continue;
    // ByMykel keeps the phase/gem in a separate field with the name identical
    // across phases. Fold it into the name so "Doppler" + "Phase 2" indexes as
    // "Doppler Phase 2", matching how our market_hash_name spells it.
    const withPhase = s.phase ? `${s.name} ${s.phase}` : s.name;
    const norm = normalize(withPhase);
    if (!byNorm.has(norm)) byNorm.set(norm, hash);
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
      // Phase/gem-precise first, then base name, then prefix scan.
      byNorm.get(normalize(r.name)) ??
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
