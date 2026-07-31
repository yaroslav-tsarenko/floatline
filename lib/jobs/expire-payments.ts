import { and, eq, lt } from "drizzle-orm";

import { db } from "@/lib/db";
import { payments } from "@/lib/db/schema";

import type { JobStats } from "./types";

// Deposits that stay `pending` past this window are abandoned checkouts. They
// were never credited (crediting only happens on a paid webhook), so expiring
// them is purely cosmetic bookkeeping — no ledger effect.
const PAYMENT_TTL_MINUTES = 60;

export async function expirePayments(): Promise<JobStats> {
  const cutoff = new Date(Date.now() - PAYMENT_TTL_MINUTES * 60_000);

  const expired = await db
    .update(payments)
    .set({ status: "expired" })
    .where(and(eq(payments.status, "pending"), lt(payments.createdAt, cutoff)))
    .returning({ id: payments.id });

  return { expired: expired.length };
}
