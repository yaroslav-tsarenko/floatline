/**
 * Development seed for the catalog. Generates real-shaped CS2 items (real skin
 * names, real Valve rarity colors, exterior + StatTrak variants) and inserts
 * them exactly the way the SIH sync would, so every page has DB-backed data to
 * render before a live SIH_API_KEY is wired up. Also seeds a week of
 * price_history per priced item and current FX rates.
 *
 * Run with: npm run db:seed
 *
 * Not used in production — the real catalog comes from lib/jobs/sync-catalog.ts.
 */
import { inArray, sql } from "drizzle-orm";

import { parseName } from "@/lib/cs2/parseName";
import { colorForRarity, resolveRarity } from "@/lib/cs2/rarity";
import { db, pool } from "@/lib/db";
import { fxRates, items, priceHistory } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { computeSellPrice, isSellable, round2 } from "@/lib/pricing";

type ExteriorLabel =
  | "Factory New"
  | "Minimal Wear"
  | "Field-Tested"
  | "Well-Worn"
  | "Battle-Scarred";

// Relative price factor vs. the Field-Tested reference cost (FN most expensive).
// Tuned to real FN/FT spreads (~1.9x) rather than an exaggerated jump.
const WEAR_FACTOR: Record<ExteriorLabel, number> = {
  "Factory New": 1.9,
  "Minimal Wear": 1.4,
  "Field-Tested": 1.0,
  "Well-Worn": 0.82,
  "Battle-Scarred": 0.7,
};

// Representative float used purely to place the axis marker on a card. SIH is
// aggregated per market_hash_name (no per-listing float), so this is the middle
// of each wear band — enough to make the signature axis meaningful.
const WEAR_FLOAT: Record<ExteriorLabel, number> = {
  "Factory New": 0.03,
  "Minimal Wear": 0.11,
  "Field-Tested": 0.26,
  "Well-Worn": 0.41,
  "Battle-Scarred": 0.72,
};

const ALL_WEARS: ExteriorLabel[] = [
  "Factory New",
  "Minimal Wear",
  "Field-Tested",
  "Well-Worn",
  "Battle-Scarred",
];

interface SkinDef {
  /** Base name without wear/StatTrak, e.g. "AK-47 | Redline" or "★ Karambit | Doppler". */
  base: string;
  /** SIH rarity_color; null for knives/gloves (resolved to contraband). */
  color: string | null;
  /** Reference SIH cost at Field-Tested (USD). */
  ftCost: number;
  /** Steam price ≈ our sell * (1 + this). Keeps us cheaper than Steam. */
  steamEdge: number;
  /** Whether a StatTrak line also exists. */
  stattrak?: boolean;
  /** Souvenir-only listing (mutually exclusive with StatTrak). */
  souvenir?: boolean;
  /** Restrict to a subset of wears (knives/some skins don't span all). */
  wears?: ExteriorLabel[];
  phase?: string;
}

// Real skins with realistic Field-Tested reference costs (USD), spanning every
// rarity tier from consumer to the four-figure grails. Colors drive the rarity
// tier (see resolveRarity), so each must match the skin's real Valve rarity.
// FN/FT etc. are derived from ftCost via WEAR_FACTOR.
const CO = {
  consumer: "#B0C3D9",
  industrial: "#5E98D9",
  milspec: "#4B69FF",
  restricted: "#8847FF",
  classified: "#D32CE6",
  covert: "#EB4B4B",
  contraband: "#E4AE39",
} as const;

const FN_MW: ExteriorLabel[] = ["Factory New", "Minimal Wear"];
const FT_DOWN: ExteriorLabel[] = ["Field-Tested", "Well-Worn", "Battle-Scarred"];
const MW_DOWN: ExteriorLabel[] = [
  "Minimal Wear",
  "Field-Tested",
  "Well-Worn",
  "Battle-Scarred",
];

const SKINS: SkinDef[] = [
  // --- Grails / four-figure vault pieces -------------------------------
  { base: "AWP | Dragon Lore", color: CO.covert, ftCost: 8200, steamEdge: 0.05 },
  { base: "AWP | Gungnir", color: CO.covert, ftCost: 7600, steamEdge: 0.05, wears: ["Factory New", "Minimal Wear", "Field-Tested"] },
  { base: "M4A4 | Howl", color: CO.contraband, ftCost: 3600, steamEdge: 0.05 },
  { base: "AK-47 | Wild Lotus", color: CO.covert, ftCost: 2100, steamEdge: 0.06 },
  { base: "AK-47 | Fire Serpent", color: CO.covert, ftCost: 760, steamEdge: 0.07 },
  // --- Knives & gloves (contraband) ------------------------------------
  { base: "★ Karambit | Fade", color: null, ftCost: 1050, steamEdge: 0.05, wears: FN_MW },
  { base: "★ Butterfly Knife | Fade", color: null, ftCost: 1080, steamEdge: 0.05, wears: FN_MW },
  { base: "★ Karambit | Doppler", color: null, ftCost: 720, steamEdge: 0.06, phase: "Phase 2", wears: FN_MW },
  { base: "★ Butterfly Knife | Doppler", color: null, ftCost: 780, steamEdge: 0.06, phase: "Sapphire", wears: ["Factory New"] },
  { base: "★ Karambit | Case Hardened", color: null, ftCost: 820, steamEdge: 0.07 },
  { base: "★ M9 Bayonet | Marble Fade", color: null, ftCost: 470, steamEdge: 0.07, wears: FN_MW },
  { base: "★ Flip Knife | Doppler", color: null, ftCost: 240, steamEdge: 0.08, phase: "Phase 4", wears: FN_MW },
  { base: "★ Sport Gloves | Pandora's Box", color: null, ftCost: 1650, steamEdge: 0.05, wears: MW_DOWN },
  { base: "★ Sport Gloves | Vice", color: null, ftCost: 1500, steamEdge: 0.05, wears: MW_DOWN },
  { base: "★ Specialist Gloves | Crimson Kimono", color: null, ftCost: 1350, steamEdge: 0.06, wears: FT_DOWN },
  { base: "★ Driver Gloves | King Snake", color: null, ftCost: 780, steamEdge: 0.06, wears: MW_DOWN },
  { base: "★ Hand Wraps | Cobalt Skulls", color: null, ftCost: 640, steamEdge: 0.07, wears: MW_DOWN },
  // --- Covert weapons ($15–$800) ---------------------------------------
  { base: "M4A1-S | Printstream", color: CO.covert, ftCost: 88, steamEdge: 0.07, stattrak: true },
  { base: "AWP | Asiimov", color: CO.covert, ftCost: 92, steamEdge: 0.07, stattrak: true, wears: FT_DOWN },
  { base: "AK-47 | Vulcan", color: CO.covert, ftCost: 58, steamEdge: 0.08 },
  { base: "AWP | Wildfire", color: CO.covert, ftCost: 56, steamEdge: 0.08 },
  { base: "AWP | Containment Breach", color: CO.covert, ftCost: 46, steamEdge: 0.08, stattrak: true },
  { base: "USP-S | Kill Confirmed", color: CO.covert, ftCost: 38, steamEdge: 0.09, stattrak: true },
  { base: "AK-47 | Asiimov", color: CO.covert, ftCost: 34, steamEdge: 0.09, wears: MW_DOWN },
  { base: "AWP | Neo-Noir", color: CO.covert, ftCost: 32, steamEdge: 0.1 },
  { base: "Desert Eagle | Printstream", color: CO.covert, ftCost: 31, steamEdge: 0.1 },
  { base: "M4A4 | The Emperor", color: CO.covert, ftCost: 30, steamEdge: 0.1 },
  { base: "USP-S | Printstream", color: CO.covert, ftCost: 39, steamEdge: 0.09 },
  { base: "M4A1-S | Hyper Beast", color: CO.covert, ftCost: 19, steamEdge: 0.12, stattrak: true },
  { base: "AK-47 | Neon Rider", color: CO.covert, ftCost: 18, steamEdge: 0.12 },
  { base: "Glock-18 | Neo-Noir", color: CO.covert, ftCost: 15, steamEdge: 0.13 },
  // --- Classified ($8–$150) --------------------------------------------
  { base: "Glock-18 | Fade", color: CO.classified, ftCost: 340, steamEdge: 0.05, wears: FN_MW },
  { base: "Desert Eagle | Blaze", color: CO.classified, ftCost: 250, steamEdge: 0.06, wears: FN_MW },
  { base: "AK-47 | Redline", color: CO.classified, ftCost: 13, steamEdge: 0.12, stattrak: true },
  { base: "M4A4 | Desolate Space", color: CO.classified, ftCost: 9.4, steamEdge: 0.13 },
  { base: "AWP | Mortis", color: CO.classified, ftCost: 8.2, steamEdge: 0.13 },
  { base: "Five-SeveN | Fowl Play", color: CO.classified, ftCost: 8.3, steamEdge: 0.13 },
  // --- Restricted ($3–$20) ---------------------------------------------
  { base: "SSG 08 | Dragonfire", color: CO.restricted, ftCost: 14.2, steamEdge: 0.1 },
  { base: "M4A1-S | Guardian", color: CO.restricted, ftCost: 6.3, steamEdge: 0.16, stattrak: true },
  { base: "USP-S | Cortex", color: CO.restricted, ftCost: 6.7, steamEdge: 0.11, stattrak: true },
  { base: "Glock-18 | Water Elemental", color: CO.restricted, ftCost: 5.9, steamEdge: 0.12, stattrak: true },
  { base: "AK-47 | Slate", color: CO.restricted, ftCost: 4.2, steamEdge: 0.12 },
  { base: "P90 | Asiimov", color: CO.restricted, ftCost: 6.1, steamEdge: 0.13, stattrak: true },
  // --- Mil-spec ($1–$8) ------------------------------------------------
  { base: "AK-47 | Blue Laminate", color: CO.milspec, ftCost: 6.8, steamEdge: 0.1 },
  { base: "M4A1-S | Basilisk", color: CO.milspec, ftCost: 3.4, steamEdge: 0.12 },
  { base: "Glock-18 | Moonrise", color: CO.milspec, ftCost: 4.1, steamEdge: 0.13 },
  { base: "Desert Eagle | Light Rail", color: CO.milspec, ftCost: 2.6, steamEdge: 0.14 },
  { base: "XM1014 | Tranquility", color: CO.milspec, ftCost: 2.3, steamEdge: 0.18 },
  // --- Industrial / consumer (<$3) -------------------------------------
  { base: "AWP | Atheris", color: CO.industrial, ftCost: 5.1, steamEdge: 0.14, stattrak: true },
  { base: "Desert Eagle | Trigger Discipline", color: CO.industrial, ftCost: 3.2, steamEdge: 0.17, stattrak: true },
  { base: "AK-47 | Safari Mesh", color: CO.consumer, ftCost: 1.1, steamEdge: 0.2 },
  { base: "MP9 | Storm", color: CO.consumer, ftCost: 0.8, steamEdge: 0.22 },
  { base: "P250 | Sand Dune", color: CO.consumer, ftCost: 0.5, steamEdge: 0.25 },
  // --- Souvenir listings (dropped from tournament packages) -------------
  { base: "AWP | Worm God", color: CO.milspec, ftCost: 7.5, steamEdge: 0.12, souvenir: true },
  { base: "M4A4 | Griffin", color: CO.restricted, ftCost: 22, steamEdge: 0.1, souvenir: true },
  { base: "AK-47 | Safari Mesh", color: CO.consumer, ftCost: 9.5, steamEdge: 0.14, souvenir: true },
  { base: "P90 | Sand Spray", color: CO.consumer, ftCost: 5.5, steamEdge: 0.16, souvenir: true },
];

const IMAGE_HASH_MAP: Record<string, string> = {};

type Variant = "normal" | "stattrak" | "souvenir";

function marketHashName(
  base: string,
  wear: ExteriorLabel,
  variant: Variant,
): string {
  const star = base.startsWith("★");
  const body = star ? base.slice(1).trim() : base;
  const tag =
    variant === "stattrak"
      ? "StatTrak™ "
      : variant === "souvenir"
        ? "Souvenir "
        : "";
  const prefix = `${star ? "★ " : ""}${tag}`;
  return `${prefix}${body} (${wear})`;
}

type ItemRow = typeof items.$inferInsert;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function toNumeric(value: number | null): string | null {
  return value == null || !Number.isFinite(value) ? null : String(value);
}

function buildRows(now: Date): { rows: ItemRow[]; floats: Map<string, number> } {
  const rows: ItemRow[] = [];
  const floats = new Map<string, number>();

  for (const skin of SKINS) {
    const wears = skin.wears ?? ALL_WEARS;
    const variants: Variant[] = skin.souvenir
      ? ["souvenir"]
      : skin.stattrak
        ? ["normal", "stattrak"]
        : ["normal"];

    for (const wear of wears) {
      for (const variant of variants) {
        const mhn = marketHashName(skin.base, wear, variant);
        const parsed = parseName(mhn);
        const rarity = resolveRarity(skin.color, parsed.category);
        // StatTrak carries a premium; wear scales the base cost.
        const cost = round2(
          skin.ftCost * WEAR_FACTOR[wear] * (variant === "stattrak" ? 1.35 : 1),
        );
        // Pricier pieces are scarcer — grails show as one-of-a-kind stock.
        const maxStock = cost > 1000 ? 2 : cost > 150 ? 6 : cost > 30 ? 18 : 40;
        const count = Math.floor(1 + Math.random() * maxStock);
        const sellPrice = computeSellPrice(cost);
        const steam = round2(sellPrice * (1 + skin.steamEdge));
        const sellable = isSellable(cost, count);

        floats.set(mhn, WEAR_FLOAT[wear]);
        rows.push({
          marketHashName: mhn,
          appId: env.SIH_APP_ID,
          name: mhn,
          weapon: parsed.weapon,
          skinName: parsed.skinName,
          exterior: parsed.exterior,
          isStattrak: parsed.isStattrak,
          isSouvenir: parsed.isSouvenir,
          category: parsed.category,
          rarity,
          rarityColor: skin.color ?? colorForRarity(rarity),
          phase: skin.phase ?? parsed.phase,
          imageHash: IMAGE_HASH_MAP[mhn] ?? null,
          costPrice: toNumeric(cost),
          sellPrice: toNumeric(sellPrice),
          steamPrice: toNumeric(steam),
          count,
          market: "seed",
          isAvailable: sellable,
          syncedAt: now,
          // Stagger first-seen across the last 5 days so "new arrivals" has data.
          firstSeenAt: new Date(now.getTime() - Math.random() * 5 * 864e5),
        });
      }
    }
  }

  return { rows, floats };
}

async function upsertItems(rows: ItemRow[]) {
  for (const part of chunk(rows, 500)) {
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
}

/** Seven daily snapshots per priced item, gently trending toward today's price. */
async function seedPriceHistory(rows: ItemRow[], now: Date) {
  const priced = rows.filter((r) => r.costPrice != null);
  const names = priced.map((r) => r.marketHashName);

  if (names.length > 0) {
    await db
      .delete(priceHistory)
      .where(inArray(priceHistory.marketHashName, names));
  }

  const history: (typeof priceHistory.$inferInsert)[] = [];
  for (const r of priced) {
    const finalCost = Number(r.costPrice);
    const finalSteam = r.steamPrice ? Number(r.steamPrice) : null;
    // Start ±12% away 6 days ago, converge to today.
    const drift = (Math.random() - 0.5) * 0.24;
    for (let d = 6; d >= 0; d--) {
      const t = (6 - d) / 6; // 0 → 1 across the week
      const factor = 1 + drift * (1 - t) + (Math.random() - 0.5) * 0.03;
      history.push({
        marketHashName: r.marketHashName,
        costPrice: toNumeric(round2(finalCost * factor)),
        steamPrice: finalSteam != null ? toNumeric(round2(finalSteam * factor)) : null,
        count: r.count ?? 0,
        capturedAt: new Date(now.getTime() - d * 864e5),
      });
    }
  }

  for (const part of chunk(history, 1000)) {
    await db.insert(priceHistory).values(part);
  }
  return history.length;
}

async function seedFx(now: Date) {
  const rates: { quote: "EUR" | "GBP"; rate: string }[] = [
    { quote: "EUR", rate: "0.924000" },
    { quote: "GBP", rate: "0.786000" },
  ];
  for (const r of rates) {
    await db
      .insert(fxRates)
      .values({ quote: r.quote, rate: r.rate, fetchedAt: now })
      .onConflictDoUpdate({
        target: fxRates.quote,
        set: { rate: sql`excluded.rate`, fetchedAt: sql`excluded.fetched_at` },
      });
  }
}

async function main() {
  const now = new Date();
  const { rows } = buildRows(now);

  await upsertItems(rows);
  const historyCount = await seedPriceHistory(rows, now);
  await seedFx(now);

  const available = rows.filter((r) => r.isAvailable).length;
  console.log(
    `Seeded ${rows.length} items (${available} available), ` +
      `${historyCount} price_history rows, 2 fx rates.`,
  );
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
