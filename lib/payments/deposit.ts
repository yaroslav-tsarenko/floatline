import { eq, or } from "drizzle-orm";

import { db } from "@/lib/db";
import { payments, type paymentStatusEnum } from "@/lib/db/schema";
import { createPurchase } from "@/lib/orders/purchase";
import { submitOrder } from "@/lib/orders/submit";
import { ensureWallet, postTransaction } from "@/lib/wallet/ledger";

export type CreditOutcome =
  | {
      status: "credited";
      paymentId: string;
      balanceAfter: string;
      orderId?: string;
      fulfillError?: string;
    }
  | {
      status: "already_credited";
      paymentId: string;
      orderId?: string;
    }
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
 * transaction. If the payment was created for a direct skin purchase
 * (payment.raw.type === "item_purchase"), it automatically creates and submits
 * the order for the item.
 *
 * Idempotent on two levels: the payment row is locked and only a `pending`
 * payment transitions to `paid`, and the ledger entry is keyed by `payment:<id>`
 * so a redelivered webhook can never double-credit.
 */
export async function creditDepositByRef(
  providerRef: string,
  raw?: unknown,
): Promise<CreditOutcome> {
  const isId = isUuid(providerRef);

  // 1. Credit deposit to wallet inside transaction
  const creditResult = await db.transaction(async (tx) => {
    const whereClause = isId
      ? or(eq(payments.providerRef, providerRef), eq(payments.id, providerRef))
      : eq(payments.providerRef, providerRef);

    const [payment] = await tx
      .select()
      .from(payments)
      .where(whereClause)
      .for("update");

    if (!payment) return { status: "not_found" as const, providerRef };

    const paymentRaw = (payment.raw ?? {}) as Record<string, any>;

    if (payment.status === "paid") {
      return {
        status: "already_credited" as const,
        paymentId: payment.id,
        orderId: paymentRaw.orderId as string | undefined,
      };
    }

    if (payment.status !== "pending") {
      return {
        status: "not_pending" as const,
        paymentId: payment.id,
        paymentStatus: payment.status,
      };
    }

    const mergedRaw = {
      ...paymentRaw,
      ...(raw && typeof raw === "object" ? (raw as Record<string, any>) : {}),
    };

    await tx
      .update(payments)
      .set({
        status: "paid",
        paidAt: new Date(),
        raw: mergedRaw,
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
      status: "credited" as const,
      paymentId: payment.id,
      userId: payment.userId,
      balanceAfter: record.balanceAfter,
      paymentRaw: mergedRaw,
    };
  });

  if (creditResult.status !== "credited") {
    return creditResult;
  }

  // 2. If this is a direct item purchase, fulfill the order
  let orderId: string | undefined;
  let fulfillError: string | undefined;

  if (
    creditResult.paymentRaw?.type === "item_purchase" &&
    creditResult.paymentRaw?.marketHashName
  ) {
    try {
      const purchase = await createPurchase({
        userId: creditResult.userId,
        marketHashName: creditResult.paymentRaw.marketHashName,
        confirmedPrice: creditResult.paymentRaw.confirmedPrice,
      });

      orderId = purchase.orderId;

      // Update payment record with the created orderId
      await db
        .update(payments)
        .set({
          raw: {
            ...creditResult.paymentRaw,
            orderId,
          },
        })
        .where(eq(payments.id, creditResult.paymentId));

      // Submit the order to SIH
      try {
        await submitOrder(orderId);
      } catch (err: any) {
        console.error(
          `[deposit:fulfill] Order submission error for ${orderId}:`,
          err,
        );
        // swallow — poll-orders will pick up the submitted order
      }
    } catch (err: any) {
      fulfillError = err?.message ?? "Order fulfillment error";
      console.error(
        `[deposit:fulfill] Direct purchase fulfillment failed for payment ${creditResult.paymentId}:`,
        err,
      );

      await db
        .update(payments)
        .set({
          raw: {
            ...creditResult.paymentRaw,
            fulfillError,
          },
        })
        .where(eq(payments.id, creditResult.paymentId));
    }
  }

  return {
    status: "credited",
    paymentId: creditResult.paymentId,
    balanceAfter: creditResult.balanceAfter,
    orderId,
    fulfillError,
  };
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

    const mergedRaw = {
      ...((payment.raw as Record<string, any>) ?? {}),
      ...(raw && typeof raw === "object" ? (raw as Record<string, any>) : {}),
    };

    await tx
      .update(payments)
      .set({
        status: "failed",
        raw: mergedRaw,
      })
      .where(eq(payments.id, payment.id));

    return {
      status: "failed",
      paymentId: payment.id,
    };
  });
}
