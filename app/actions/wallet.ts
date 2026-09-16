"use server";

import { headers } from "next/headers";
import { eq } from "drizzle-orm";

import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { payments } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { createTransfermitDeposit } from "@/lib/payments/transfermit";

export type TopUpResult =
  | { ok: true; redirectUrl: string }
  | { ok: false; error: string };

const MIN_TOPUP_AMOUNT = 5;
const MAX_TOPUP_AMOUNT = 2000;

export async function createTopUpSession(
  amountNum: number,
  currency: "USD" | "EUR" | "GBP" = "USD",
): Promise<TopUpResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Please sign in to top up your wallet." };
  }

  if (
    typeof amountNum !== "number" ||
    isNaN(amountNum) ||
    amountNum < MIN_TOPUP_AMOUNT ||
    amountNum > MAX_TOPUP_AMOUNT
  ) {
    return {
      ok: false,
      error: `Amount must be between $${MIN_TOPUP_AMOUNT} and $${MAX_TOPUP_AMOUNT}.`,
    };
  }

  // Extract client IP
  let ip: string | null = null;
  try {
    const h = await headers();
    ip =
      h.get("cf-connecting-ip") ||
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      h.get("x-real-ip") ||
      null;
  } catch {
    // ignore
  }

  const initialRef = `topup_${crypto.randomUUID()}`;

  // Create pending payment in database
  const [paymentRow] = await db
    .insert(payments)
    .values({
      userId: user.id,
      provider: "transfermit",
      providerRef: initialRef,
      amount: amountNum.toFixed(2),
      currency,
      status: "pending",
    })
    .returning();

  const returnUrl = `${env.APP_URL}/account?status=return&ref=${initialRef}`;

  try {
    const depositResult = await createTransfermitDeposit({
      referenceId: initialRef,
      amount: amountNum,
      currency,
      customer: {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        steamId64: user.steamId64,
        ip,
      },
      billingAddress: {
        addressLine1: user.streetAddress,
        city: user.city,
        countryCode: user.country,
        postalCode: user.postalCode,
      },
      returnUrl,
    });

    // Update payment record with provider's payment ID
    if (depositResult.paymentId && depositResult.paymentId !== initialRef) {
      await db
        .update(payments)
        .set({
          providerRef: depositResult.paymentId,
          raw: depositResult.raw as object,
        })
        .where(eq(payments.id, paymentRow.id));
    }

    return { ok: true, redirectUrl: depositResult.redirectUrl };
  } catch (err: any) {
    console.error("[topup:create] Transfermit checkout creation failed:", err);

    // Mark as failed locally so it doesn't linger indefinitely
    await db
      .update(payments)
      .set({ status: "failed" })
      .where(eq(payments.id, paymentRow.id));

    const errorMsg =
      err?.message && !err.message.toLowerCase().includes("transfermit")
        ? err.message
        : "Payment provider is temporarily unavailable. Please try again.";

    return {
      ok: false,
      error: errorMsg,
    };
  }
}
