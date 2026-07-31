import { env } from "@/lib/env";

import { getCurrentUser, type SessionUser } from "./session";

function adminIds(): string[] {
  return Array.isArray(env.ADMIN_STEAM_IDS) ? env.ADMIN_STEAM_IDS : [];
}

export function isAdmin(user: Pick<SessionUser, "steamId64"> | null): boolean {
  if (!user?.steamId64) return false;
  return adminIds().includes(user.steamId64);
}

/** Current user if they're an admin, otherwise null. */
export async function getAdminUser(): Promise<SessionUser | null> {
  const user = await getCurrentUser();
  return user && isAdmin(user) ? user : null;
}

/** Like `getAdminUser` but throws — use to guard admin server actions. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getAdminUser();
  if (!user) throw new Error("forbidden");
  return user;
}
