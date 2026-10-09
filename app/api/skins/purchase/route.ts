import { NextResponse, type NextRequest } from "next/server";
import { eq, or } from "drizzle-orm";

import { getCurrentUser } from "@/lib/auth/session";
import { getItem } from "@/lib/catalog/item";
import { slugToMarketHashName } from "@/lib/catalog/slug";
import { db } from "@/lib/db";
import { items, payments } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { createTransfermitDeposit } from "@/lib/payments/transfermit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Please sign in to buy." },
      { status: 401 },
    );
  }

  if (!user.steamId64 || !user.tradeToken) {
    return NextResponse.json(
      {
        ok: false,
        error: "Link your Steam account and trade URL before buying.",
      },
      { status: 400 },
    );
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    // ignore
  }

  const marketHashNameInput: string | undefined =
    body.marketHashName || body.market_hash_name;
  const listingIdInput: string | undefined = body.listingId || body.listing_id;
  const slugInput: string | undefined = body.slug;

  let marketHashName = marketHashNameInput;

  if (!marketHashName && slugInput) {
    marketHashName = slugToMarketHashName(slugInput);
  } else if (!marketHashName && listingIdInput) {
    // Check if listingId is directly a marketHashName or a slug
    marketHashName = slugToMarketHashName(listingIdInput);
  }

  if (!marketHashName) {
    return NextResponse.json(
      { ok: false, error: "Missing item identifier (marketHashName or listingId required)" },
      { status: 400 },
    );
  }

  // 1. Fetch item details
  let item = await getItem(marketHashName);
  if (!item && listingIdInput && listingIdInput !== marketHashName) {
    item = await getItem(listingIdInput);
  }

  if (!item || !item.isAvailable || item.count <= 0 || item.sellPrice == null) {
    return NextResponse.json(
      { ok: false, error: "This item is currently unavailable." },
      { status: 400 },
    );
  }

  const itemPrice = Number(item.sellPrice);
  const currency = (body.currency || "USD").toUpperCase();

  // Extract client IP
  const ip =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null;

  const initialRef = `buy_${crypto.randomUUID()}`;

  // 2. Insert pending payment record
  const [paymentRow] = await db
    .insert(payments)
    .values({
      userId: user.id,
      provider: "transfermit",
      providerRef: initialRef,
      amount: itemPrice.toFixed(2),
      currency: currency as any,
      status: "pending",
      raw: {
        type: "item_purchase",
        marketHashName: item.marketHashName,
        confirmedPrice: item.sellPrice,
      },
    })
    .returning();

  const returnUrl = `${env.APP_URL}/orders/checkout-return?ref=${initialRef}`;

  // 3. Request Transfermit checkout session
  try {
    const depositResult = await createTransfermitDeposit({
      referenceId: initialRef,
      amount: itemPrice,
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

    if (depositResult.paymentId && depositResult.paymentId !== initialRef) {
      await db
        .update(payments)
        .set({
          providerRef: depositResult.paymentId,
          raw: {
            type: "item_purchase",
            marketHashName: item.marketHashName,
            confirmedPrice: item.sellPrice,
            providerDetails: depositResult.raw,
          },
        })
        .where(eq(payments.id, paymentRow.id));
    }

    return NextResponse.json({
      ok: true,
      redirectUrl: depositResult.redirectUrl,
      purchase: {
        id: paymentRow.id,
        status: "pending",
        skinName: item.name,
        currency,
        fees: {
          itemPrice,
          serviceFee: 0,
          total: itemPrice,
        },
      },
    });
  } catch (err: any) {
    console.error("[api:skins:purchase] Transfermit session creation failed:", err);

    await db
      .update(payments)
      .set({ status: "failed" })
      .where(eq(payments.id, paymentRow.id));

    return NextResponse.json(
      {
        ok: false,
        error:
          err?.message && !err.message.toLowerCase().includes("transfermit")
            ? err.message
            : "Payment provider is temporarily unavailable. Please try again.",
      },
      { status: 502 },
    );
  }
}
