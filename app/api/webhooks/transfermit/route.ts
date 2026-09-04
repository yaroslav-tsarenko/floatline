import { NextResponse, type NextRequest } from "next/server";

import { creditDepositByRef, failDepositByRef } from "@/lib/payments/deposit";
import { verifyTransfermitWebhookSignature } from "@/lib/payments/transfermit";
import { logWebhook } from "@/lib/webhooks/log";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SIGNATURE_HEADERS = [
  "signature",
  "Signature",
  "x-signature",
  "x-transfermit-signature",
];

function readSignature(req: NextRequest): string | null {
  for (const h of SIGNATURE_HEADERS) {
    const v = req.headers.get(h);
    if (v) return v;
  }
  return null;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const raw = await req.text();

  const signature = readSignature(req);
  const isValid = verifyTransfermitWebhookSignature(raw, signature);

  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: any;
  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    body = raw;
  }

  await logWebhook({
    source: "transfermit",
    method: req.method,
    url: req.url,
    headers: req.headers,
    body,
  });

  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: true, ignored: true });
  }

  // Extract payment details
  const candidate = body.result || body;
  const paymentId: string | undefined = candidate.id;
  const referenceId: string | undefined = candidate.referenceId;
  const state: string = (candidate.state || candidate.status || "").toUpperCase();
  const paymentType: string = (candidate.paymentType || "DEPOSIT").toUpperCase();

  if (paymentType !== "DEPOSIT") {
    // Other payment types (e.g. REFUND) can be logged / handled
    return NextResponse.json({ ok: true, type: paymentType });
  }

  // Match by providerRef (id) first, then fallback to referenceId (e.g. topup_<uuid> or <uuid>)
  const refKeys: string[] = [];
  if (paymentId) refKeys.push(paymentId);
  if (referenceId) {
    refKeys.push(referenceId);
    if (referenceId.startsWith("topup_")) {
      refKeys.push(referenceId.replace(/^topup_/, ""));
    }
  }

  if (state === "COMPLETED") {
    for (const ref of refKeys) {
      const outcome = await creditDepositByRef(ref, body);
      if (outcome.status === "credited" || outcome.status === "already_credited") {
        return NextResponse.json({ ok: true, outcome });
      }
    }
    return NextResponse.json({ ok: true, status: "pending_resolution" });
  }

  if (state === "DECLINED" || state === "ERROR" || state === "CANCELLED") {
    for (const ref of refKeys) {
      const outcome = await failDepositByRef(ref, body);
      if (outcome.status === "failed" || outcome.status === "already_final") {
        return NextResponse.json({ ok: true, outcome });
      }
    }
    return NextResponse.json({ ok: true, status: "not_found" });
  }

  // Pending / Checkout / 3DS states
  return NextResponse.json({ ok: true, state });
}
