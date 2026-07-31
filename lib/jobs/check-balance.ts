import { alert } from "@/lib/alerts";
import { env } from "@/lib/env";
import { sih } from "@/lib/sih/client";

import type { JobStats } from "./types";

/**
 * Reads the SIH project balance and alerts when it falls below the configured
 * threshold — a low supplier balance means purchases will start failing, so
 * this is the earliest warning we get.
 */
export async function checkBalance(): Promise<JobStats> {
  const project = await sih.getProject();
  const balance = project.balance ?? null;
  const threshold = env.SIH_LOW_BALANCE_THRESHOLD;
  const low = balance != null && balance < threshold;

  if (low) {
    await alert(`SIH balance low: $${balance} (threshold $${threshold})`);
  }

  return { balance, threshold, low };
}
