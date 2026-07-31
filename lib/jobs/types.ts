export type JobStats = Record<string, unknown>;

export type JobFn = () => Promise<JobStats>;

export interface JobDef {
  name: string;
  run: JobFn;
  /** Scheduling period for the in-process scheduler, in minutes. */
  everyMinutes: number;
  /** Longest expected duration; used to set route maxDuration. */
  maxDurationSec: number;
}

export type JobRunOutcome =
  | { status: "ok"; stats: JobStats }
  | { status: "skipped" }
  | { status: "error"; error: string };
