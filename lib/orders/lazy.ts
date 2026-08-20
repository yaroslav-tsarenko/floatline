import { and, eq, inArray } from "drizzle-orm";
import { after } from "next/server";

import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import type { OrderStatus } from "@/lib/sih/status";

import { syncOrder } from "./sync";

// In-flight states worth re-checking against SIH (matches the old `poll-orders`
// selection). Replaces that cron: instead of a fixed tick, an order advances
// when the buyer opens their orders (background) or the order page (inline), on
// top of the SIH webhook. `created` is left to the buy flow's submit step.
const OPEN_STATUSES: OrderStatus[] = ["submitted", "processing", "sent"];
const OPEN_SET = new Set<string>(OPEN_STATUSES);

export function isOpenStatus(status: string): boolean {
  return OPEN_SET.has(status);
}

/** Reconcile all of a user's open orders in the background (non-blocking). */
export function reconcileUserOrders(userId: string): void {
  after(async () => {
    try {
      const open = await db
        .select({ id: orders.id })
        .from(orders)
        .where(
          and(eq(orders.userId, userId), inArray(orders.status, OPEN_STATUSES)),
        )
        .limit(50);

      for (const { id } of open) {
        try {
          await syncOrder(id, { source: "sih_poll" });
        } catch (err) {
          console.error(`[reconcileUserOrders] ${id} failed`, err);
        }
      }
    } catch (err) {
      console.error("[reconcileUserOrders] failed", err);
    }
  });
}

/** Reconcile a single order now; swallows errors so page render never fails. */
export async function reconcileOrderNow(orderId: string): Promise<void> {
  try {
    await syncOrder(orderId, { source: "sih_poll" });
  } catch (err) {
    console.error(`[reconcileOrderNow] ${orderId} failed`, err);
  }
}
