import { NextResponse, type NextRequest } from "next/server";

import { setSessionCookie } from "@/lib/auth/session";
import { verifyCallback } from "@/lib/auth/steam";
import { upsertSteamUser } from "@/lib/auth/users";

export const dynamic = "force-dynamic";

/** Steam redirects here after login. Validate, then start a session. */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const steamId = await verifyCallback(req.nextUrl.searchParams);

  if (!steamId) {
    return NextResponse.redirect(new URL("/?auth=failed", req.nextUrl.origin));
  }

  const userId = await upsertSteamUser(steamId);
  await setSessionCookie(userId);

  return NextResponse.redirect(new URL("/account", req.nextUrl.origin));
}
