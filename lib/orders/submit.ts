import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { orderEvents, orders } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { sih } from "@/lib/sih/client";
import { postTransaction } from "@/lib/wallet/ledger";

import { NoTradeTargetError } from "./errors";
import { syncOrder } from "./sync";

export type SubmitResult =
  | { status: "submitted"; sihOrderId: string | null }
  | { status: "failed"; error: string }
  | { status: "skipped"; reason: string };

/**
 * Submits a `created` order to SIH for fulfillment. Claims the order with an
 * atomic `created → submitted` update so it's sent at most once, then calls
 * SIH. On a hard failure the buyer is refunded (idempotent `order:<id>:refund`)
 * and the order is marked `failed`. On success any order snapshot SIH returns
 * is folded in via `syncOrder`.
 *
 * The authorized `amount` is capped at our cost plus price tolerance, so a
 * live upward move can't make us overpay beyond the margin we planned for.
 */
export async function submitOrder(orderId: string): Promise<SubmitResult> {
  const claimed = await db
    .update(orders)
    .set({ status: "submitted", submittedAt: new Date() })
    .where(and(eq(orders.id, orderId), eq(orders.status, "created")))
    .returning({
      marketHashName: orders.marketHashName,
      shownPrice: orders.shownPrice,
      costPrice: orders.costPrice,
      steamId: orders.steamId,
      tradeToken: orders.tradeToken,
      userId: orders.userId,
    });

  const order = claimed[0];
  if (!order) {
    return { status: "skipped", reason: "order not in 'created' state" };
  }

  if (!order.steamId || !order.tradeToken) {
    throw new NoTradeTargetError(order.userId);
  }

  const authorized = order.costPrice
    ? Number(order.costPrice) * (1 + env.SIH_PRICE_TOLERANCE)
    : Number(order.shownPrice);

  let res;
  try {
    res = await sih.createOrder({
      steamId: order.steamId,
      token: order.tradeToken,
      amount: Number(authorized.toFixed(2)),
      item: order.marketHashName,
      customId: orderId,
    });
  } catch (err) {
    // Transient failure (network/timeout): release the claim so poll-orders can
    // retry. The buyer stays charged; the order is simply not yet sent.
    await db
      .update(orders)
      .set({ status: "created", submittedAt: null })
      .where(and(eq(orders.id, orderId), eq(orders.status, "submitted")));
    throw err;
  }

  if (!res.ok) {
    await db.transaction(async (tx) => {
      await tx
        .update(orders)
        .set({ status: "refunded", sihError: res.error, finishedAt: new Date() })
        .where(eq(orders.id, orderId));

      await postTransaction(tx, {
        userId: order.userId,
        type: "refund",
        amount: order.shownPrice,
        idempotencyKey: `order:${orderId}:refund`,
        orderId,
        meta: { reason: `submit failed: ${res.error}` },
      });

      await tx.insert(orderEvents).values({
        orderId,
        source: "system",
        fromStatus: "submitted",
        toStatus: "refunded",
        payload: { error: res.error, refunded: true },
      });
    });

    return { status: "failed", error: res.error };
  }

  await db
    .update(orders)
    .set({ sihOrderId: res.id, sihStatus: res.order?.status ?? null })
    .where(eq(orders.id, orderId));

  await db.insert(orderEvents).values({
    orderId,
    source: "system",
    fromStatus: "created",
    toStatus: "submitted",
    payload: { sihOrderId: res.id, conflict: res.conflict },
  });

  if (res.order) {
    await syncOrder(orderId, { source: "system", sihOrder: res.order });
  }

  return { status: "submitted", sihOrderId: res.id };
}
