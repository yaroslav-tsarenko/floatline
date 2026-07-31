import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { users, wallets } from "@/lib/db/schema";

/**
 * Finds or creates the user for a Steam login and ensures their wallet exists.
 * Steam is the identity, so we match on `steamId64`. Email is a synthetic
 * placeholder (the schema requires one) until the user provides a real address.
 */
export async function upsertSteamUser(steamId64: string): Promise<string> {
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.steamId64, steamId64));

  if (existing) return existing.id;

  const [created] = await db
    .insert(users)
    .values({
      email: `steam-${steamId64}@users.floatline.gg`,
      steamId64,
    })
    .returning({ id: users.id });

  await db.insert(wallets).values({ userId: created.id }).onConflictDoNothing();

  return created.id;
}
