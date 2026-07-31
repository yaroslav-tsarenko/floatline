export type Exterior = "FN" | "MW" | "FT" | "WW" | "BS";

export type Category =
  | "rifle"
  | "pistol"
  | "knife"
  | "gloves"
  | "smg"
  | "heavy"
  | "agent"
  | "sticker"
  | "other";

export interface ParsedName {
  weapon: string | null;
  skinName: string | null;
  exterior: Exterior | null;
  isStattrak: boolean;
  isSouvenir: boolean;
  isStar: boolean;
  category: Category;
  phase: string | null;
}

const EXTERIOR_MAP: Record<string, Exterior> = {
  "Factory New": "FN",
  "Minimal Wear": "MW",
  "Field-Tested": "FT",
  "Well-Worn": "WW",
  "Battle-Scarred": "BS",
};

// SIH does not provide weapon/category separately — everything is parsed from
// the market_hash_name. Snipers are folded into `rifle` since the DB enum has
// no dedicated sniper category.
const RIFLES = new Set([
  "AK-47",
  "M4A4",
  "M4A1-S",
  "Galil AR",
  "FAMAS",
  "AUG",
  "SG 553",
  "AWP",
  "SSG 08",
  "SCAR-20",
  "G3SG1",
]);

const PISTOLS = new Set([
  "Glock-18",
  "USP-S",
  "P2000",
  "P250",
  "Five-SeveN",
  "Tec-9",
  "CZ75-Auto",
  "Desert Eagle",
  "Dual Berettas",
  "R8 Revolver",
]);

const SMGS = new Set([
  "MAC-10",
  "MP9",
  "MP7",
  "MP5-SD",
  "UMP-45",
  "P90",
  "PP-Bizon",
]);

const HEAVY = new Set([
  "Nova",
  "XM1014",
  "Sawed-Off",
  "MAG-7",
  "M249",
  "Negev",
]);

const KNIVES = new Set([
  "Karambit",
  "Bayonet",
  "M9 Bayonet",
  "Flip Knife",
  "Gut Knife",
  "Huntsman Knife",
  "Falchion Knife",
  "Bowie Knife",
  "Butterfly Knife",
  "Shadow Daggers",
  "Navaja Knife",
  "Stiletto Knife",
  "Ursus Knife",
  "Talon Knife",
  "Classic Knife",
  "Paracord Knife",
  "Survival Knife",
  "Nomad Knife",
  "Skeleton Knife",
  "Kukri Knife",
]);

function categoryFor(weapon: string | null, isStar: boolean): Category {
  if (!weapon) return "other";
  if (/Gloves$/.test(weapon) || /Hand Wraps/.test(weapon)) return "gloves";
  if (isStar || KNIVES.has(weapon) || /Knife/.test(weapon)) return "knife";
  if (RIFLES.has(weapon)) return "rifle";
  if (PISTOLS.has(weapon)) return "pistol";
  if (SMGS.has(weapon)) return "smg";
  if (HEAVY.has(weapon)) return "heavy";
  return "other";
}

export function parseName(marketHashName: string): ParsedName {
  let s = marketHashName.trim();

  const isStar = s.startsWith("★");
  if (isStar) s = s.replace(/^★\s*/, "");

  const isSouvenir = /^Souvenir\s+/.test(s);
  if (isSouvenir) s = s.replace(/^Souvenir\s+/, "");

  const isStattrak = /StatTrak™|StatTrak\b/.test(s);
  if (isStattrak) s = s.replace(/StatTrak™\s*/, "").replace(/StatTrak\s*/, "");

  s = s.trim();

  // Non-weapon item classes carry a leading keyword.
  if (/^Sticker\s*\|/.test(s)) {
    const rest = s.replace(/^Sticker\s*\|\s*/, "");
    const first = rest.split(" | ")[0] ?? rest;
    const skin = first.replace(/\s*\([^)]*\)\s*$/, "").trim();
    return {
      weapon: null,
      skinName: skin || null,
      exterior: null,
      isStattrak,
      isSouvenir,
      isStar,
      category: "sticker",
      phase: null,
    };
  }

  // Trailing "(Wear)" — only strip when it is an actual exterior.
  let exterior: Exterior | null = null;
  const m = s.match(/\(([^)]+)\)\s*$/);
  if (m && EXTERIOR_MAP[m[1]]) {
    exterior = EXTERIOR_MAP[m[1]];
    s = s.slice(0, m.index).trim();
  }

  const parts = s.split(" | ");
  const weapon = parts[0]?.trim() || null;
  const skinName =
    parts.length > 1 ? parts.slice(1).join(" | ").trim() || null : null;

  const phaseMatch = skinName?.match(/\b(Phase\s*\d|Sapphire|Ruby|Black Pearl|Emerald)\b/);
  const phase = phaseMatch ? phaseMatch[1] : null;

  return {
    weapon,
    skinName,
    exterior,
    isStattrak,
    isSouvenir,
    isStar,
    category: categoryFor(weapon, isStar),
    phase,
  };
}
