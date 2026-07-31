import { NextResponse, type NextRequest } from "next/server";

import { buildAuthUrl } from "@/lib/auth/steam";

export const dynamic = "force-dynamic";

/** Kicks off Steam OpenID: redirect the user to Steam to authenticate. */
export function GET(req: NextRequest): NextResponse {
  const origin = req.nextUrl.origin;
  const returnTo = `${origin}/api/auth/steam/callback`;
  return NextResponse.redirect(buildAuthUrl(returnTo, origin));
}
