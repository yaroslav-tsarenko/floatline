import { NextResponse, type NextRequest } from "next/server";

import { getSessionUserId, setSessionCookie } from "@/lib/auth/session";
import { verifyCallback } from "@/lib/auth/steam";
import { linkSteamToUser, upsertSteamUser } from "@/lib/auth/users";

export const dynamic = "force-dynamic";

/**
 * Steam redirects here after login. If a session already exists (an email user
 * linking Steam), attach the SteamID to that account; otherwise sign in / create
 * the Steam-native user.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const steamId = await verifyCallback(req.nextUrl.searchParams);

  if (!steamId) {
    return NextResponse.redirect(new URL("/?auth=failed", req.nextUrl.origin));
  }

  const currentUserId = await getSessionUserId();
  if (currentUserId) {
    const linked = await linkSteamToUser(currentUserId, steamId);
    const dest = linked ? "/account" : "/account?link=taken";
    return NextResponse.redirect(new URL(dest, req.nextUrl.origin));
  }

  const userId = await upsertSteamUser(steamId);
  await setSessionCookie(userId);

  return NextResponse.redirect(new URL("/account", req.nextUrl.origin));
}
