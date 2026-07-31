"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { parseTradeUrl } from "@/lib/steam/trade-url";

export type SaveTradeUrlResult = { ok: true } | { ok: false; error: string };

/** Validates and stores the user's Steam trade URL (and delivery token). */
export async function saveTradeUrl(
  formData: FormData,
): Promise<SaveTradeUrlResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in." };

  const raw = String(formData.get("tradeUrl") ?? "");
  const parsed = parseTradeUrl(raw);
  if (!parsed) {
    return { ok: false, error: "That doesn't look like a Steam trade URL." };
  }

  await db
    .update(users)
    .set({
      tradeUrl: raw.trim(),
      tradeToken: parsed.token,
      tradeUrlUpdatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  revalidatePath("/account");
  return { ok: true };
}
