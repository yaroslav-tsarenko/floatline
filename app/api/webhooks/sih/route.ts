import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/lib/env";
import { syncOrder } from "@/lib/orders/sync";
import { orderSchema } from "@/lib/sih/schemas";
import { logWebhook } from "@/lib/webhooks/log";
import { verifyHmac } from "@/lib/webhooks/verify";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ASSUMPTION: SIH signs the raw body with HMAC-SHA256 (hex) using
// SIH_WEBHOOK_SECRET, delivered in `x-signature`. Confirm against SIH docs.
// This fails closed — a mismatch rejects the delivery, and the `poll-orders`
// job remains the source of truth, so no order is lost while it's tuned.
const SIGNATURE_HEADERS = ["x-signature", "x-sih-signature", "signature"];

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
  if (!verifyHmac(raw, signature, env.SIH_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    body = raw;
  }

  await logWebhook({
    source: "sih",
    method: req.method,
    url: req.url,
    headers: req.headers,
    body,
  });

  // The payload may be the order itself or wrapped under `order`.
  const candidate =
    body && typeof body === "object" && "order" in body
      ? (body as { order: unknown }).order
      : body;

  const parsed = orderSchema.safeParse(candidate);
  if (!parsed.success || !parsed.data.customId) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  try {
    const result = await syncOrder(parsed.data.customId, {
      source: "sih_webhook",
      sihOrder: parsed.data,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    // Ack anyway: poll-orders will retry. Avoids a webhook retry storm.
    console.error("[webhook:sih] sync failed", err);
    return NextResponse.json({ ok: true, deferred: true });
  }
}
