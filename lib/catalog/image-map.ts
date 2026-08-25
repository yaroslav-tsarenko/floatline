/**
 * Resolves a Steam economy icon hash for a market_hash_name using the public
 * ByMykel CS2 catalog. This is our only usable image source: SIH's own catalog
 * returns Cloudflare-hosted image URLs that are WAF-blocked (403) for both
 * server fetches and browser <img> hotlinks, so we can never render them. The
 * ByMykel `image` field is a Steam economy URL whose path segment is the exact
 * icon hash SkinImage feeds to community.steamstatic.com — which serves to
 * anyone. One hash covers every wear/StatTrak/Souvenir variant of a skin.
 */

const API_BASE =
  "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/";

// One endpoint per item family: skins/knives/gloves plus everything else that
// otherwise renders "no image" (stickers, charms, graffiti, patches, etc.).
const ENDPOINTS = [
  "skins",
  "skins_not_grouped",
  "stickers",
  "collectibles",
  "keychains",
  "graffiti",
  "patches",
  "music_kits",
  "agents",
  "crates",
  "keys",
];

const ECON_PREFIX = "/economy/image/";
const WEAR =
  /\s*\((?:Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)\s*$/;

// The catalog is effectively static; cache the built index per instance.
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

interface CatalogEntry {
  name?: string;
  market_hash_name?: string;
  image?: string;
  phase?: string | null;
}

export interface ImageMap {
  /** Steam icon hash for a market_hash_name, or null if the catalog lacks it. */
  resolve(marketHashName: string): string | null;
  /** Number of indexed catalog names — for job stats/logging. */
  size: number;
}

/** Pull the Steam economy icon hash out of a full catalog image URL. */
function hashFromImage(image: string | undefined | null): string | null {
  if (!image) return null;
  const i = image.indexOf(ECON_PREFIX);
  if (i === -1) return null;
  return image.slice(i + ECON_PREFIX.length).replace(/\/$/, "") || null;
}

/** Reduce a market_hash_name to its base skin name (drop wear + prefixes). */
function baseName(name: string): string {
  return name
    .replace(/\s*\([^)]*\)\s*$/, "")
    .replace(/StatTrak™ /, "")
    .replace(/Souvenir /, "")
    .trim();
}

/**
 * Normalize a name so a phase/gem variant matches its catalog entry while
 * staying distinct: ByMykel writes "Doppler (Phase 2)" with the phase in a
 * separate field; our name writes "Doppler Phase 2 (Minimal Wear)". Dropping
 * the wear paren and the parens *around* the phase collapses both to
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

/**
 * SIH mislabels sticker names as "Sticker Slab | X"; the real market_hash_name
 * (and ByMykel's) is "Sticker | X". Only used to look up the image — the stored
 * name (which SIH also uses for orders) is left untouched.
 */
function deslab(name: string): string {
  return name.replace(/^Sticker Slab \| /, "Sticker | ");
}

async function fetchCatalog(): Promise<CatalogEntry[]> {
  const out: CatalogEntry[] = [];
  for (const ep of ENDPOINTS) {
    const res = await fetch(API_BASE + ep + ".json");
    if (!res.ok) {
      throw new Error(`ByMykel catalog fetch ${ep} -> ${res.status}`);
    }
    const part = (await res.json()) as CatalogEntry[] | Record<string, CatalogEntry>;
    out.push(...(Array.isArray(part) ? part : Object.values(part)));
  }
  return out;
}

function buildIndex(catalog: CatalogEntry[]): ImageMap {
  // byNorm keeps phase/gem precision; byName (base) is the looser fallback.
  const byNorm = new Map<string, string>();
  const byName = new Map<string, string>();

  for (const e of catalog) {
    const name = e.market_hash_name ?? e.name;
    const hash = hashFromImage(e.image);
    if (!name || !hash) continue;

    const withPhase = e.phase ? `${name} ${e.phase}` : name;
    const norm = normalize(withPhase);
    if (!byNorm.has(norm)) byNorm.set(norm, hash);
    if (!byName.has(name)) byName.set(name, hash);
    const base = baseName(name);
    if (!byName.has(base)) byName.set(base, hash);
  }

  function lookup(name: string): string | null {
    return byNorm.get(normalize(name)) ?? byName.get(baseName(name)) ?? null;
  }

  return {
    size: byName.size,
    resolve(marketHashName: string): string | null {
      const direct = lookup(marketHashName);
      if (direct) return direct;
      const deslabbed = deslab(marketHashName);
      return deslabbed !== marketHashName ? lookup(deslabbed) : null;
    },
  };
}

let cached: { map: ImageMap; at: number } | null = null;
let inflight: Promise<ImageMap> | null = null;

/**
 * Loads (and per-instance caches) the ByMykel image index. Concurrent callers
 * share one fetch. Throws if the catalog can't be fetched — callers decide
 * whether that's fatal (backfill) or ignorable (sync keeps existing hashes).
 */
export async function loadImageMap(): Promise<ImageMap> {
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.map;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const map = buildIndex(await fetchCatalog());
      cached = { map, at: Date.now() };
      return map;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}
