import { NextResponse, type NextRequest } from "next/server";

import { isCronAuthorized } from "@/lib/jobs/cron-auth";
import { getJob } from "@/lib/jobs/registry";
import { runJob } from "@/lib/jobs/runner";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function handle(
  req: NextRequest,
  ctx: { params: Promise<{ job: string }> },
): Promise<NextResponse> {
  if (!isCronAuthorized(req)) {
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
