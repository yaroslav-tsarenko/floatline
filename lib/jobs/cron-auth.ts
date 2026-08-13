import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

import { env } from "@/lib/env";

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/**
 * Authorizes a cron request against CRON_SECRET, accepting either a
 * `Authorization: Bearer <secret>` header (used by Vercel Cron and GitHub
 * Actions) or a `?secret=` query param. Constant-time comparison.
 */
export function isCronAuthorized(req: NextRequest): boolean {
  const header = req.headers.get("authorization") ?? "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : "";
  const query = req.nextUrl.searchParams.get("secret") ?? "";
  return (
    (bearer.length > 0 && safeEqual(bearer, env.CRON_SECRET)) ||
    (query.length > 0 && safeEqual(query, env.CRON_SECRET))
  );
}
