import { and, eq, inArray, lt } from "drizzle-orm";

import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { submitOrder } from "@/lib/orders/submit";
import { syncOrder } from "@/lib/orders/sync";
import { sih } from "@/lib/sih/client";

import type { JobStats } from "./types";

const BATCH = 100;
// Give a freshly-created order a moment for the buy action to submit it before
// the poller adopts it as a stuck order.
const STUCK_CREATED_SEC = 60;

/**
 * Drives in-flight orders forward. First submits any `created` order that the
 * buy action left behind, then batch-fetches SIH state for all open orders and
 * reconciles each (advancing status, issuing refunds via `syncOrder`).
 */
export async function pollOrders(): Promise<JobStats> {
  const cutoff = new Date(Date.now() - STUCK_CREATED_SEC * 1000);

  const stuck = await db
    .select({ id: orders.id })
    .from(orders)
    .where(and(eq(orders.status, "created"), lt(orders.createdAt, cutoff)))
    .limit(BATCH);

  let submitted = 0;
  for (const { id } of stuck) {
    try {
      const res = await submitOrder(id);
      if (res.status !== "skipped") submitted++;
    } catch (err) {
      console.error(`[poll-orders] submit ${id} failed`, err);
    }
  }

  const open = await db
    .select({ id: orders.id })
    .from(orders)
    .where(inArray(orders.status, ["submitted", "processing", "sent"]))
    .limit(BATCH);

  const ids = open.map((o) => o.id);
  let reconciled = 0;
  let changed = 0;
  let refunded = 0;

  if (ids.length > 0) {
    const sihOrders = await sih.getOrders({ customIds: ids });
    const byCustomId = new Map(
      sihOrders
        .filter((o) => o.customId)
        .map((o) => [o.customId as string, o]),
    );

    for (const id of ids) {
      const sihOrder = byCustomId.get(id);
      if (!sihOrder) continue;
      try {
        const res = await syncOrder(id, { source: "sih_poll", sihOrder });
        reconciled++;
        if (res.changed) changed++;
        if (res.refunded) refunded++;
      } catch (err) {
        console.error(`[poll-orders] sync ${id} failed`, err);
      }
    }
  }

  return {
    stuckSubmitted: submitted,
    open: ids.length,
    reconciled,
    changed,
    refunded,
  };
}
