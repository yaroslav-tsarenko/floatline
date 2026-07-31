import { env } from "@/lib/env";

import { checkBalance } from "./check-balance";
import { expirePayments } from "./expire-payments";
import { pollOrders } from "./poll-orders";
import { syncCatalog } from "./sync-catalog";
import { syncFxRates } from "./sync-fx-rates";
import type { JobDef } from "./types";

export const JOBS: Record<string, JobDef> = {
  "sync-catalog": {
    name: "sync-catalog",
    run: syncCatalog,
    everyMinutes: env.SIH_SYNC_INTERVAL_MIN,
    maxDurationSec: 300,
  },
  "poll-orders": {
    name: "poll-orders",
    run: pollOrders,
    everyMinutes: 1,
    maxDurationSec: 120,
  },
  "sync-fx-rates": {
    name: "sync-fx-rates",
    run: syncFxRates,
    everyMinutes: 720,
    maxDurationSec: 60,
  },
  "check-balance": {
    name: "check-balance",
    run: checkBalance,
    everyMinutes: 30,
    maxDurationSec: 60,
  },
  "expire-payments": {
    name: "expire-payments",
    run: expirePayments,
    everyMinutes: 30,
    maxDurationSec: 60,
  },
};

export function getJob(name: string): JobDef | undefined {
  return JOBS[name];
}

export function listJobs(): JobDef[] {
  return Object.values(JOBS);
}
