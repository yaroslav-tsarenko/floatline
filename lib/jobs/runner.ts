import { eq } from "drizzle-orm";

import { alert } from "@/lib/alerts";
import { db } from "@/lib/db";
import { withAdvisoryLock } from "@/lib/db/lock";
import { syncRuns } from "@/lib/db/schema";

import { getJob } from "./registry";
import type { JobRunOutcome } from "./types";

/**
 * Executes a registered job with a per-job advisory lock (no parallel runs of
 * the same job) and records the outcome in `sync_runs`. Errors are captured,
 * alerted, and returned — never thrown — so schedulers and the cron route stay
 * resilient.
 */
export async function runJob(name: string): Promise<JobRunOutcome> {
  const job = getJob(name);
  if (!job) {
    return { status: "error", error: `unknown job: ${name}` };
  }

  const lockName = `job:${name}`;

  const outcome = await withAdvisoryLock(lockName, async (): Promise<JobRunOutcome> => {
    const [run] = await db
      .insert(syncRuns)
      .values({ job: name, status: "running" })
      .returning({ id: syncRuns.id });

    try {
      const stats = await job.run();
      await db
        .update(syncRuns)
        .set({ status: "ok", finishedAt: new Date(), stats })
        .where(eq(syncRuns.id, run.id));
      return { status: "ok", stats };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await db
        .update(syncRuns)
        .set({ status: "error", finishedAt: new Date(), error: message })
        .where(eq(syncRuns.id, run.id));
      await alert(`Job "${name}" failed: ${message}`);
      return { status: "error", error: message };
    }
  });

  if (outcome.skipped) {
    return { status: "skipped" };
  }
  return outcome.result;
}
