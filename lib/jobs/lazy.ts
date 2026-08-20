import { eq, sql } from "drizzle-orm";
import { after } from "next/server";

import { memoTtl } from "@/lib/cache";
import { db } from "@/lib/db";
import { syncRuns } from "@/lib/db/schema";

import { runJob } from "./runner";

// How long an instance trusts its own freshness check before touching
// sync_runs again. Keeps visitor traffic from turning the freshness probe into
// its own per-request query while still reacting within a job's cadence.
const CHECK_TTL_MS = 30_000;

async function lastRunMs(job: string): Promise<number | null> {
  const [row] = await db
    .select({ last: sql<string | null>`max(${syncRuns.startedAt})` })
    .from(syncRuns)
    .where(eq(syncRuns.job, job));
  return row?.last ? new Date(row.last).getTime() : null;
}

/**
 * Runs `job` in the background if its last recorded start is older than
 * `everyMinutes`. Replaces the scheduled cron: freshness is driven by real
 * visitor traffic instead of a fixed tick. Non-blocking (`after`) so the
 * response isn't delayed, deduped per-instance for CHECK_TTL_MS, and the
 * advisory lock inside `runJob` prevents concurrent instances from doubling up.
 */
export function ensureFresh(job: string, everyMinutes: number): void {
  after(() => {
    void memoTtl(`ensure:${job}`, CHECK_TTL_MS, async () => {
      const last = await lastRunMs(job);
      if (last === null || Date.now() - last >= everyMinutes * 60_000) {
        await runJob(job);
      }
      return Date.now();
    }).catch((err) => console.error(`[ensureFresh:${job}] failed`, err));
  });
}

/** Keep display-only FX rates current on visit (12h cadence). */
export function ensureFxFresh(): void {
  ensureFresh("sync-fx-rates", 720);
}
