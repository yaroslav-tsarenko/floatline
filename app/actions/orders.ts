"use server";

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import { env } from "@/lib/env";
import {
  ItemUnavailableError,
  NoTradeTargetError,
  PriceChangedError,
} from "@/lib/orders/errors";
import { createPurchase } from "@/lib/orders/purchase";
import { submitOrder } from "@/lib/orders/submit";
import { InsufficientFundsError } from "@/lib/wallet/errors";
import { getBalance } from "@/lib/wallet/ledger";

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

  // Up-front site-balance gate so a buyer paying from balance gets the shortfall
  // spelled out instead of a bare failure. `createPurchase` is still the
  // authority: it re-checks under a row lock, which is what stops a race.
  const balance = Number(await getBalance(user.id));
  const price = Number(confirmedPrice);
  if (Number.isFinite(price) && balance < price) {
    return {
      ok: false,
      error: `Not enough balance: you have $${balance.toFixed(2)} and this skin costs $${price.toFixed(2)}. Top up $${(price - balance).toFixed(2)} or pay by card.`,
    };
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
      return {
        ok: false,
        error:
          "Not enough balance for this skin. Top up your balance or pay by card.",
      };
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

export type BuyDirectResult =
  | { ok: true; redirectUrl: string }
  | { ok: false; error: string };

/**
 * Initiates direct card checkout for a specific skin via Transfermit without
 * using wallet balance. Returns redirectUrl to hosted checkout.
 */
export async function buyItemDirect(
  marketHashName: string,
  confirmedPrice?: string,
): Promise<BuyDirectResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in to buy." };
  if (!user.steamId64 || !user.tradeToken) {
    return { ok: false, error: "Link your Steam trade URL before buying." };
  }

  try {
    const res = await fetch(`${env.APP_URL}/api/skins/purchase`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ marketHashName, confirmedPrice }),
    });

    const json = await res.json();
    if (!res.ok || !json.ok) {
      return { ok: false, error: json.error || "Failed to initiate payment." };
    }

    return { ok: true, redirectUrl: json.redirectUrl };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || "Failed to initiate direct payment.",
    };
  }
}
