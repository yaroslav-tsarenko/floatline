import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { orderEvents, orders } from "@/lib/db/schema";
import { sih } from "@/lib/sih/client";
import type { SihOrder } from "@/lib/sih/schemas";
import type { OrderStatus } from "@/lib/sih/status";
import { postTransaction } from "@/lib/wallet/ledger";

import { reconcileOrder } from "./reconcile";

type EventSource = "sih_webhook" | "sih_poll" | "system";

const TERMINAL = new Set<OrderStatus>(["refunded", "rolled_back", "finished"]);
const FINAL_TIMESTAMP = new Set<OrderStatus>([
  "finished",
  "refunded",
  "rolled_back",
]);

export interface SyncResult {
  orderId: string;
  changed: boolean;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  refunded: boolean;
}

export interface SyncOptions {
  source?: EventSource;
  /** Pre-fetched SIH order (e.g. a webhook payload); skips the GET when set. */
  sihOrder?: SihOrder;
}

/**
 * Reconciles one order against SIH and applies the resulting transition, plus
 * any owed refund, in a single transaction. The order row is locked and its
 * status re-checked under the lock, so concurrent webhook + poll runs converge
 * without double-applying. Refunds post through the idempotent ledger
 * (`order:<id>:refund`), so a repeated refund is a no-op.
 */
export async function syncOrder(
  orderId: string,
  opts: SyncOptions = {},
): Promise<SyncResult> {
  const source: EventSource = opts.source ?? "sih_poll";

  const [pre] = await db
    .select({ status: orders.status, sihOrderId: orders.sihOrderId })
    .from(orders)
    .where(eq(orders.id, orderId));

  if (!pre) throw new Error(`order not found: ${orderId}`);

  if (TERMINAL.has(pre.status) && pre.status !== "finished") {
    return {
      orderId,
      changed: false,
      fromStatus: pre.status,
      toStatus: pre.status,
      refunded: false,
    };
  }

  const sihOrder =
    opts.sihOrder ??
    (await sih.getOrder(
      pre.sihOrderId ? { id: pre.sihOrderId } : { customId: orderId },
    ));

  return db.transaction(async (tx) => {
    const [current] = await tx
      .select({
        status: orders.status,
        shownPrice: orders.shownPrice,
        userId: orders.userId,
      })
      .from(orders)
      .where(eq(orders.id, orderId))
      .for("update");

    if (!current) throw new Error(`order not found: ${orderId}`);

    const plan = reconcileOrder({
      currentStatus: current.status,
      sih: {
        status: sihOrder.status,
        error: sihOrder.error,
        protection: sihOrder.protection ?? null,
      },
    });

    const noStatusChange = plan.nextStatus === current.status;

    const sender = sihOrder.sender ?? null;
    const protection = sihOrder.protection ?? null;

    await tx
      .update(orders)
      .set({
        status: plan.nextStatus,
        sihOrderId: sihOrder.id != null ? String(sihOrder.id) : pre.sihOrderId,
        sihStatus: sihOrder.status,
        sihError: sihOrder.error ?? null,
        senderOfferId: sender?.offerId != null ? String(sender.offerId) : null,
        senderNickname: sender?.nickname ?? null,
        senderAvatar: sender?.avatar ?? null,
        senderTimeout: sender?.timeout ?? null,
        protectionStatus: protection?.status ?? null,
        protectionError: protection?.error ?? null,
        protectionRollbackAmount:
          protection?.rollbackAmount != null
            ? String(protection.rollbackAmount)
            : null,
        ...(FINAL_TIMESTAMP.has(plan.nextStatus) ? { finishedAt: new Date() } : {}),
      })
      .where(eq(orders.id, orderId));

    let refunded = false;
    if (plan.refund) {
      const { created } = await postTransaction(tx, {
        userId: current.userId,
        type: "refund",
        amount: current.shownPrice,
        idempotencyKey: `order:${orderId}:refund`,
        orderId,
        meta: { reason: plan.note },
      });
      refunded = created;
    }

    if (!noStatusChange || refunded) {
      await tx.insert(orderEvents).values({
        orderId,
        source,
        fromStatus: current.status,
        toStatus: plan.nextStatus,
        payload: { sihStatus: sihOrder.status, note: plan.note, refunded },
      });
    }

    return {
      orderId,
      changed: !noStatusChange || refunded,
      fromStatus: current.status,
      toStatus: plan.nextStatus,
      refunded,
    };
  });
}
