import { NextResponse, type NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import {
  creditDepositByRef,
  failDepositByRef,
  getDepositByRef,
} from "@/lib/payments/deposit";
import { getTransfermitPayment } from "@/lib/payments/transfermit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const pmt = url.searchParams.get("pmt");
  const ref = url.searchParams.get("ref");

  const queryRef = pmt || ref;
  if (!queryRef) {
    return NextResponse.json(
      { error: "Missing payment reference (pmt or ref parameter required)" },
      { status: 400 },
    );
  }

  // 1. Check local payment record
  let localPayment = await getDepositByRef(queryRef);
  if (!localPayment && ref && ref !== queryRef) {
    localPayment = await getDepositByRef(ref);
  }

  if (localPayment) {
    // Ensure the payment belongs to the current user
    if (localPayment.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (localPayment.status === "paid") {
      return NextResponse.json({
        ok: true,
        status: "paid",
        paymentId: localPayment.id,
      });
    }

    if (localPayment.status === "failed" || localPayment.status === "expired") {
      return NextResponse.json({
        ok: false,
        status: localPayment.status,
        paymentId: localPayment.id,
      });
    }
  }

  // 2. Query Transfermit API if paymentId (pmt) is available
  if (pmt) {
    try {
      const details = await getTransfermitPayment(pmt);
      const state = details.state.toUpperCase();

      if (state === "COMPLETED") {
        const creditOutcome = await creditDepositByRef(pmt, details.raw);
        if (
          creditOutcome.status === "credited" ||
          creditOutcome.status === "already_credited"
        ) {
          return NextResponse.json({
            ok: true,
            status: "paid",
            paymentId: creditOutcome.paymentId,
          });
        }
      } else if (
        state === "DECLINED" ||
        state === "ERROR" ||
        state === "CANCELLED"
      ) {
        await failDepositByRef(pmt, details.raw);
        return NextResponse.json({
          ok: false,
          status: "failed",
          reason: state,
        });
      }

      return NextResponse.json({
        ok: true,
        status: "pending",
        providerState: state,
      });
    } catch (err: any) {
      console.error("[topup:verify] Transfermit verification query failed:", err);
      // Fallback: return current local status if available
      if (localPayment) {
        return NextResponse.json({
          ok: true,
          status: localPayment.status,
          paymentId: localPayment.id,
        });
      }
      return NextResponse.json(
        { error: "Could not verify payment with provider" },
        { status: 502 },
      );
    }
  }

  return NextResponse.json({
    ok: true,
    status: localPayment?.status ?? "unknown",
  });
}
