import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { payments } from "@/lib/db/schema";
import { ensureWallet, postTransaction } from "@/lib/wallet/ledger";

export type CreditOutcome =
  | { status: "credited"; paymentId: string; balanceAfter: string }
  | { status: "already_credited"; paymentId: string }
  | { status: "not_pending"; paymentId: string; paymentStatus: string }
  | { status: "not_found"; providerRef: string };

/**
 * Marks a pending payment as paid and credits the user's wallet in a single
 * transaction. Idempotent on two levels: the payment row is locked and only a
 * `pending` payment transitions to `paid`, and the ledger entry is keyed by
 * `payment:<id>` so a redelivered webhook can never double-credit.
 */
export async function creditDepositByRef(
  providerRef: string,
  raw?: unknown,
): Promise<CreditOutcome> {
  return db.transaction(async (tx) => {
    const [payment] = await tx
      .select()
      .from(payments)
      .where(eq(payments.providerRef, providerRef))
      .for("update");

    if (!payment) return { status: "not_found", providerRef };

    if (payment.status === "paid") {
      return { status: "already_credited", paymentId: payment.id };
    }

    if (payment.status !== "pending") {
      return {
        status: "not_pending",
        paymentId: payment.id,
        paymentStatus: payment.status,
      };
    }

    await tx
      .update(payments)
      .set({
        status: "paid",
        paidAt: new Date(),
        ...(raw !== undefined ? { raw: raw as object } : {}),
      })
      .where(eq(payments.id, payment.id));

    await ensureWallet(tx, payment.userId);

    const { record } = await postTransaction(tx, {
      userId: payment.userId,
      type: "deposit",
      amount: payment.amount,
      idempotencyKey: `payment:${payment.id}`,
      paymentId: payment.id,
      meta: { provider: payment.provider, providerRef },
    });

    return {
      status: "credited",
      paymentId: payment.id,
      balanceAfter: record.balanceAfter,
    };
  });
}
