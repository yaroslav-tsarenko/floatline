import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { items, orderEvents, orders, users } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { toCents } from "@/lib/wallet/amount";
import { ensureWallet, postTransaction } from "@/lib/wallet/ledger";

import {
  ItemUnavailableError,
  NoTradeTargetError,
  PriceChangedError,
} from "./errors";

export interface PurchaseInput {
  userId: string;
  marketHashName: string;
  /** Price the buyer confirmed in the UI, used only for the tolerance check. */
  confirmedPrice?: string | number;
}

export interface PurchaseResult {
  orderId: string;
  chargedPrice: string;
  balanceAfter: string;
}

/**
 * Buys one item for a user: re-reads the live price, re-checks it against the
 * confirmed price within tolerance, debits the wallet, and creates the order —
 * all in one transaction. The wallet debit takes a `FOR UPDATE` row lock (see
 * `postTransaction`), so concurrent purchases for the same user serialize and
 * can't overdraw. The order id is minted up front so the debit's idempotency
 * key (`order:<id>:purchase`) is stable.
 */
export async function createPurchase(input: PurchaseInput): Promise<PurchaseResult> {
  const orderId = randomUUID();

  return db.transaction(async (tx) => {
    const [user] = await tx
      .select({
        steamId64: users.steamId64,
        tradeToken: users.tradeToken,
      })
      .from(users)
      .where(eq(users.id, input.userId));

    if (!user?.steamId64 || !user.tradeToken) {
      throw new NoTradeTargetError(input.userId);
    }

    const [item] = await tx
      .select()
      .from(items)
      .where(eq(items.marketHashName, input.marketHashName));

    if (!item || !item.isAvailable || item.count <= 0 || !item.sellPrice) {
      throw new ItemUnavailableError(input.marketHashName);
    }

    const currentCents = toCents(item.sellPrice);

    if (input.confirmedPrice != null) {
      const confirmedCents = toCents(input.confirmedPrice);
      const drift = Math.abs(currentCents - confirmedCents);
      const tolerance = confirmedCents * env.SIH_PRICE_TOLERANCE;
      if (drift > tolerance) {
        throw new PriceChangedError(
          input.marketHashName,
          String(input.confirmedPrice),
          item.sellPrice,
        );
      }
    }

    await ensureWallet(tx, input.userId);

    const { record } = await postTransaction(tx, {
      userId: input.userId,
      type: "purchase",
      amount: `-${item.sellPrice}`,
      idempotencyKey: `order:${orderId}:purchase`,
      orderId,
      meta: { marketHashName: item.marketHashName },
    });

    const cost = item.costPrice ? Number(item.costPrice) : null;
    const margin = cost != null ? Number(item.sellPrice) - cost : null;

    await tx.insert(orders).values({
      id: orderId,
      userId: input.userId,
      marketHashName: item.marketHashName,
      itemSnapshot: {
        name: item.name,
        weapon: item.weapon,
        skinName: item.skinName,
        exterior: item.exterior,
        rarity: item.rarity,
        rarityColor: item.rarityColor,
        phase: item.phase,
        imageHash: item.imageHash,
        isStattrak: item.isStattrak,
        isSouvenir: item.isSouvenir,
        market: item.market,
      },
      shownPrice: item.sellPrice,
      costPrice: item.costPrice,
      margin: margin != null ? margin.toFixed(4) : null,
      status: "created",
      steamId: user.steamId64,
      tradeToken: user.tradeToken,
    });

    await tx.insert(orderEvents).values({
      orderId,
      source: "system",
      fromStatus: null,
      toStatus: "created",
      payload: { chargedPrice: item.sellPrice },
    });

    return {
      orderId,
      chargedPrice: item.sellPrice,
      balanceAfter: record.balanceAfter,
    };
  });
}
