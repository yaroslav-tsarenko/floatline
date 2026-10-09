import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { isOpenStatus, reconcileOrderNow } from "@/lib/orders/lazy";
import { tradeOfferUrl } from "@/lib/steam/trade-url";

export const dynamic = "force-dynamic";

/**
 * Owner-scoped live status for one order. Reconciles against SIH first when the
 * order is still in flight, so a buyer watching the order page sees the trade
 * offer the moment SIH dispatches it instead of waiting for the next reload.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [before] = await db
    .select({ userId: orders.userId, status: orders.status })
    .from(orders)
    .where(eq(orders.id, id));

  if (!before || before.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (isOpenStatus(before.status)) {
    await reconcileOrderNow(id);
  }

  const [row] = await db
    .select({
      status: orders.status,
      sihStatus: orders.sihStatus,
      sihError: orders.sihError,
      senderOfferId: orders.senderOfferId,
      senderNickname: orders.senderNickname,
    })
    .from(orders)
    .where(eq(orders.id, id));

  return NextResponse.json({
    ok: true,
    id,
    status: row?.status ?? before.status,
    sihStatus: row?.sihStatus ?? null,
    sihError: row?.sihError ?? null,
    senderNickname: row?.senderNickname ?? null,
    tradeOfferUrl: tradeOfferUrl(row?.senderOfferId),
    open: isOpenStatus(row?.status ?? before.status),
  });
}
