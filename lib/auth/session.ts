import { cookies } from "next/headers";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { env } from "@/lib/env";

import { createToken, DEFAULT_MAX_AGE_SEC, verifyToken } from "./token";

const COOKIE_NAME = "fl_session";

export type SessionUser = typeof users.$inferSelect;

export async function setSessionCookie(userId: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, createToken(userId, env.SESSION_SECRET), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DEFAULT_MAX_AGE_SEC,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

/** Returns the authenticated user id from the signed cookie, or null. */
export async function getSessionUserId(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  return verifyToken(token, env.SESSION_SECRET)?.uid ?? null;
}

/** Loads the current user, or null when not signed in. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const uid = await getSessionUserId();
  if (!uid) return null;
  const [user] = await db.select().from(users).where(eq(users.id, uid));
  return user ?? null;
}

/** Like `getCurrentUser` but throws when unauthenticated. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("unauthenticated");
  return user;
}
