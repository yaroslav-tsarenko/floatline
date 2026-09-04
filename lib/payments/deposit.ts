import { eq, or } from "drizzle-orm";

import { db } from "@/lib/db";
import { payments, type paymentStatusEnum } from "@/lib/db/schema";
import { ensureWallet, postTransaction } from "@/lib/wallet/ledger";

export type CreditOutcome =
  | { status: "credited"; paymentId: string; balanceAfter: string }
  | { status: "already_credited"; paymentId: string }
  | { status: "not_pending"; paymentId: string; paymentStatus: string }
  | { status: "not_found"; providerRef: string };

export type FailOutcome =
  | { status: "failed"; paymentId: string }
  | { status: "already_final"; paymentId: string; currentStatus: string }
  | { status: "not_found"; providerRef: string };

function isUuid(val: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    val,
  );
}

/**
 * Finds a payment row either by providerRef or by id.
 */
export async function getDepositByRef(providerRef: string) {
  const isId = isUuid(providerRef);
  const whereClause = isId
    ? or(eq(payments.providerRef, providerRef), eq(payments.id, providerRef))
    : eq(payments.providerRef, providerRef);

  const [payment] = await db
    .select()
    .from(payments)
    .where(whereClause)
    .limit(1);

  return payment ?? null;
}

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
  const isId = isUuid(providerRef);

  return db.transaction(async (tx) => {
    const whereClause = isId
      ? or(eq(payments.providerRef, providerRef), eq(payments.id, providerRef))
      : eq(payments.providerRef, providerRef);

    const [payment] = await tx
      .select()
      .from(payments)
      .where(whereClause)
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

/**
 * Marks a pending payment as failed (e.g. DECLINED, ERROR, CANCELLED).
 */
export async function failDepositByRef(
  providerRef: string,
  raw?: unknown,
): Promise<FailOutcome> {
  const isId = isUuid(providerRef);

  return db.transaction(async (tx) => {
    const whereClause = isId
      ? or(eq(payments.providerRef, providerRef), eq(payments.id, providerRef))
      : eq(payments.providerRef, providerRef);

    const [payment] = await tx
      .select()
      .from(payments)
      .where(whereClause)
      .for("update");

    if (!payment) return { status: "not_found", providerRef };

    if (payment.status !== "pending") {
      return {
        status: "already_final",
        paymentId: payment.id,
        currentStatus: payment.status,
      };
    }

    await tx
      .update(payments)
      .set({
        status: "failed",
        ...(raw !== undefined ? { raw: raw as object } : {}),
      })
      .where(eq(payments.id, payment.id));

    return {
      status: "failed",
      paymentId: payment.id,
    };
  });
}
