"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import type { ActionResult } from "@/components/admin/admin-button";
import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { getJob } from "@/lib/jobs/registry";
import { runJob } from "@/lib/jobs/runner";
import { submitOrder } from "@/lib/orders/submit";
import { syncOrder } from "@/lib/orders/sync";
import { sih } from "@/lib/sih/client";

function fail(err: unknown): ActionResult {
  return { ok: false, error: err instanceof Error ? err.message : String(err) };
}

/**
 * Re-drives a stuck order: a still-`created` order is submitted to SIH, an
 * already-submitted one is re-reconciled against SIH's latest state. Both paths
 * are idempotent, so a double click can't double-charge or double-refund.
 */
export async function retryOrderAction(orderId: string): Promise<ActionResult> {
  try {
    await requireAdmin();

    const [order] = await db
      .select({ status: orders.status })
      .from(orders)
      .where(eq(orders.id, orderId));

    if (!order) return { ok: false, error: "order not found" };

    if (order.status === "created") {
      const res = await submitOrder(orderId);
      revalidatePath("/admin");
      return { ok: true, message: `submit: ${res.status}` };
    }

    const res = await syncOrder(orderId, { source: "system" });
    revalidatePath("/admin");
    return { ok: true, message: `${res.fromStatus} → ${res.toStatus}` };
  } catch (err) {
    return fail(err);
  }
}

export async function runJobAction(name: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    if (!getJob(name)) return { ok: false, error: `unknown job: ${name}` };

    const outcome = await runJob(name);
    revalidatePath("/admin");
    if (outcome.status === "error") return { ok: false, error: outcome.error };
    return { ok: true, message: outcome.status };
  } catch (err) {
    return fail(err);
  }
}

/** Points SIH's webhook at this deployment's ingest URL. */
export async function setWebhookAction(): Promise<ActionResult> {
  try {
    await requireAdmin();
    const url = `${env.APP_URL}/api/webhooks/sih`;
    await sih.setWebhook(url);
    revalidatePath("/admin");
    return { ok: true, message: "webhook set" };
  } catch (err) {
    return fail(err);
  }
}
