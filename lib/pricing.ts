import { env } from "@/lib/env";

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Our sell price is the SIH cost plus a relative margin, but never less than a
 * fixed absolute margin (so cheap items still earn something). Result is
 * rounded to cents.
 */
export function computeSellPrice(
  cost: number,
  opts: { margin?: number; minMarginAbs?: number } = {},
): number {
  const margin = opts.margin ?? env.SIH_MARGIN;
  const minMarginAbs = opts.minMarginAbs ?? env.SIH_MIN_MARGIN_ABS;
  const relative = cost * (1 + margin);
  const absolute = cost + minMarginAbs;
  return round2(Math.max(relative, absolute));
}

/**
 * Whether an item may be shown/sold: it must be in stock and within the price
 * cap that limits our risk exposure.
 */
export function isSellable(
  cost: number,
  count: number,
  opts: { maxItemPrice?: number } = {},
): boolean {
  const maxItemPrice = opts.maxItemPrice ?? env.SIH_MAX_ITEM_PRICE;
  return count > 0 && cost > 0 && cost <= maxItemPrice;
}
