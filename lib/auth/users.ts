import { eq, sql } from "drizzle-orm";

import type { Currency } from "@/lib/currency";
import { db } from "@/lib/db";
import { users, wallets } from "@/lib/db/schema";

export type UserRecord = typeof users.$inferSelect;

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

/** Case-insensitive lookup by email. */
export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(sql`lower(${users.email})`, email.toLowerCase()));
  return user ?? null;
}

export interface EmailUserProfile {
  firstName: string;
  lastName: string;
  dateOfBirth: string; // YYYY-MM-DD
  phone: string;
  streetAddress: string;
  city: string;
  country: string;
  postalCode: string;
  preferredCurrency?: Currency;
}

/** Creates an email/password user and their wallet. Caller pre-hashes. */
export async function createEmailUser(
  email: string,
  passwordHash: string,
  profile: EmailUserProfile,
): Promise<string> {
  const { preferredCurrency = "USD", ...rest } = profile;
  const [created] = await db
    .insert(users)
    .values({ email: email.toLowerCase(), passwordHash, preferredCurrency, ...rest })
    .returning({ id: users.id });

  await db.insert(wallets).values({ userId: created.id }).onConflictDoNothing();

  return created.id;
}

/**
 * Attaches a Steam identity to an existing account. Returns false when that
 * SteamID is already bound to a different user (can't link twice).
 */
export async function linkSteamToUser(
  userId: string,
  steamId64: string,
): Promise<boolean> {
  const [owner] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.steamId64, steamId64));
  if (owner && owner.id !== userId) return false;

  await db.update(users).set({ steamId64 }).where(eq(users.id, userId));
  return true;
}
