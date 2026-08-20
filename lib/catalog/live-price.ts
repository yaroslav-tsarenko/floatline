import { computeSellPrice, isSellable } from "@/lib/pricing";
import { sih } from "@/lib/sih/client";

export interface LivePrice {
  sellPrice: number;
  count: number;
  isAvailable: boolean;
}

/**
 * Live price for a single item, fetched straight from SIH for the client
 * viewing this skin — no DB writes, no catalog sync. Keeps Neon out of the
 * hot path: only the one item the visitor opened is priced, on demand.
 * Never throws; returns null on any failure so the page falls back to the
 * stored DB price.
 */
export async function getLivePrice(
  marketHashName: string,
): Promise<LivePrice | null> {
  try {
    const min = await sih.getMinItem(marketHashName);
    const cost = min.price;
    const count = min.count ?? 0;
    if (cost == null || !Number.isFinite(cost) || cost <= 0) return null;

    const available = isSellable(cost, count);
    return {
      sellPrice: computeSellPrice(cost),
      count,
      isAvailable: available,
    };
  } catch {
    return null;
  }
}
