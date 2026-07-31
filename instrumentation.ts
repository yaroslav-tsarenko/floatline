// In-process cron scheduler for self-hosted / local dev. Enabled only when
// CRON_IN_PROCESS=true and running in the Node.js runtime. Multiple instances
// are safe: each job takes a Postgres advisory lock in runJob, so only one
// instance actually runs a given job at a time. On Vercel, use vercel.json
// crons instead and leave CRON_IN_PROCESS=false.
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { env } = await import("@/lib/env");
  if (!env.CRON_IN_PROCESS) return;

  const { listJobs } = await import("@/lib/jobs/registry");
  const { runJob } = await import("@/lib/jobs/runner");

  for (const job of listJobs()) {
    const ms = Math.max(job.everyMinutes, 1) * 60_000;
    setInterval(() => {
      void runJob(job.name).catch((err) =>
        console.error(`[scheduler] ${job.name} failed`, err),
      );
    }, ms);
  }

  console.log(
    `[scheduler] in-process cron enabled for: ${listJobs()
      .map((j) => j.name)
      .join(", ")}`,
  );
}
