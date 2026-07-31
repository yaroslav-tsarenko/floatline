import type { Category } from "./parseName";

export type Rarity =
  | "consumer"
  | "industrial"
  | "milspec"
  | "restricted"
  | "classified"
  | "covert"
  | "contraband";

// Canonical Valve rarity colors as delivered by SIH in `rarity_color`.
const COLOR_TO_RARITY: Record<string, Rarity> = {
  B0C3D9: "consumer",
  "5E98D9": "industrial",
  "4B69FF": "milspec",
  "8847FF": "restricted",
  D32CE6: "classified",
  EB4B4B: "covert",
  E4AE39: "contraband",
};

function normalizeHex(color: string): string {
  return color.trim().replace(/^#/, "").toUpperCase();
}

export function rarityFromColor(color: string | null | undefined): Rarity | null {
  if (!color) return null;
  return COLOR_TO_RARITY[normalizeHex(color)] ?? null;
}

// Canonical rarity color for a level (used when SIH omits it, e.g. knives).
const RARITY_TO_COLOR: Record<Rarity, string> = {
  consumer: "#B0C3D9",
  industrial: "#5E98D9",
  milspec: "#4B69FF",
  restricted: "#8847FF",
  classified: "#D32CE6",
  covert: "#EB4B4B",
  contraband: "#E4AE39",
};

export function colorForRarity(rarity: Rarity | null): string | null {
  return rarity ? RARITY_TO_COLOR[rarity] : null;
}

// Knives/gloves are always the special (★ / gold) tier regardless of the base
// color SIH may report for the underlying skin.
export function resolveRarity(
  color: string | null | undefined,
  category: Category,
): Rarity | null {
  if (category === "knife" || category === "gloves") return "contraband";
  return rarityFromColor(color);
}
