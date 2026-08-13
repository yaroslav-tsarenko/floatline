import { sql } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";

import { db } from "@/lib/db";
import { syncRuns } from "@/lib/db/schema";
import { isCronAuthorized } from "@/lib/jobs/cron-auth";
import { listJobs } from "@/lib/jobs/registry";
import { runJob } from "@/lib/jobs/runner";
import type { JobRunOutcome } from "@/lib/jobs/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// A single dispatcher that runs every registered job whose own interval has
// elapsed, based on the last start recorded in sync_runs. This lets one
// frequent external trigger (GitHub Actions every ~5m, plus a daily Vercel
// cron) drive all jobs at their individual cadences — so a Vercel Hobby plan
// (max 2 crons, once/day) never sees more than a single daily cron.

// Fire a little early so a job due at exactly N minutes isn't pushed to the
// next tick by a few seconds of scheduler drift.
const EARLY_TOLERANCE_MS = 90_000;

// Money-critical and quick jobs first, so the heavy catalog sync can't eat the
// function's time budget before orders are polled.
const PRIORITY = [
  "poll-orders",
  "expire-payments",
  "check-balance",
  "sync-fx-rates",
  "sync-catalog",
];

async function handle(req: NextRequest): Promise<NextResponse> {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select({
      job: syncRuns.job,
      last: sql<string | null>`max(${syncRuns.startedAt})`,
    })
    .from(syncRuns)
    .groupBy(syncRuns.job);

  const lastStart = new Map<string, number>();
  for (const r of rows) {
    if (r.last) lastStart.set(r.job, new Date(r.last).getTime());
  }

  const now = Date.now();
  const jobs = listJobs().sort(
    (a, b) => PRIORITY.indexOf(a.name) - PRIORITY.indexOf(b.name),
  );

  const results: Record<string, JobRunOutcome | { status: "not-due" }> = {};
  for (const job of jobs) {
    const last = lastStart.get(job.name);
    const dueAfter = job.everyMinutes * 60_000 - EARLY_TOLERANCE_MS;
    const due = last === undefined || now - last >= dueAfter;
    results[job.name] = due ? await runJob(job.name) : { status: "not-due" };
  }

  return NextResponse.json({ ranAt: new Date(now).toISOString(), results });
}

export const GET = handle;
export const POST = handle;
