import type { Exterior } from "./parseName";

export interface FloatZone {
  key: Exterior;
  label: string;
  start: number;
  end: number;
}

// The five wear zones on the 0.00 -> 1.00 float axis.
export const FLOAT_ZONES: FloatZone[] = [
  { key: "FN", label: "FN", start: 0, end: 0.07 },
  { key: "MW", label: "MW", start: 0.07, end: 0.15 },
  { key: "FT", label: "FT", start: 0.15, end: 0.38 },
  { key: "WW", label: "WW", start: 0.38, end: 0.45 },
  { key: "BS", label: "BS", start: 0.45, end: 1 },
];

export function clampFloat(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function zoneForFloat(value: number): Exterior | null {
  const v = clampFloat(value);
  for (const zone of FLOAT_ZONES) {
    if (v >= zone.start && v < zone.end) return zone.key;
  }
  return v === 1 ? "BS" : null;
}

// Catalog is aggregated per market_hash_name (no per-listing float). For cards
// we place the axis marker at the middle of the item's wear band.
export function midFloatForExterior(exterior: Exterior | null): number | null {
  if (!exterior) return null;
  const zone = FLOAT_ZONES.find((z) => z.key === exterior);
  return zone ? (zone.start + zone.end) / 2 : null;
}
