"use server";

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import {
  ItemUnavailableError,
  NoTradeTargetError,
  PriceChangedError,
} from "@/lib/orders/errors";
import { createPurchase } from "@/lib/orders/purchase";
import { submitOrder } from "@/lib/orders/submit";
import { InsufficientFundsError } from "@/lib/wallet/errors";

export type BuyResult =
  | { ok: false; error: string }
  | { ok: true; orderId: string };

/**
 * Buys one item for the signed-in user, then hands the order to SIH. The charge
 * and order creation are atomic in `createPurchase`; submission is best-effort
 * here and, if it fails transiently, `poll-orders` picks the order up. Redirects
 * to the order page on success.
 */
export async function buyItem(
  marketHashName: string,
  confirmedPrice: string,
): Promise<BuyResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in to buy." };
  if (!user.steamId64) {
    return { ok: false, error: "Link your Steam account before buying." };
  }

  let orderId: string;
  try {
    const purchase = await createPurchase({
      userId: user.id,
      marketHashName,
      confirmedPrice,
    });
    orderId = purchase.orderId;
  } catch (err) {
    if (err instanceof NoTradeTargetError) {
      return { ok: false, error: "Add your Steam trade link before buying." };
    }
    if (err instanceof InsufficientFundsError) {
      return { ok: false, error: "Not enough balance. Top up and try again." };
    }
    if (err instanceof PriceChangedError) {
      return { ok: false, error: "The price just changed. Refresh and retry." };
    }
    if (err instanceof ItemUnavailableError) {
      return { ok: false, error: "This item just went out of stock." };
    }
    throw err;
  }

  // Best-effort submit; poll-orders is the safety net if this throws.
  try {
    await submitOrder(orderId);
  } catch {
    // swallow — the order exists and will be retried by the poller
  }

  redirect(`/orders/${orderId}`);
}
