import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/lib/env";
import { getJob } from "@/lib/jobs/registry";
import { runJob } from "@/lib/jobs/runner";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

function isAuthorized(req: NextRequest): boolean {
  const header = req.headers.get("authorization") ?? "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : "";
  const query = req.nextUrl.searchParams.get("secret") ?? "";
  return (
    (bearer.length > 0 && safeEqual(bearer, env.CRON_SECRET)) ||
    (query.length > 0 && safeEqual(query, env.CRON_SECRET))
  );
}

async function handle(
  req: NextRequest,
  ctx: { params: Promise<{ job: string }> },
): Promise<NextResponse> {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { job } = await ctx.params;
  if (!getJob(job)) {
    return NextResponse.json({ error: `unknown job: ${job}` }, { status: 404 });
  }

  const outcome = await runJob(job);
  const status = outcome.status === "error" ? 500 : 200;
  return NextResponse.json({ job, ...outcome }, { status });
}

export const GET = handle;
export const POST = handle;
