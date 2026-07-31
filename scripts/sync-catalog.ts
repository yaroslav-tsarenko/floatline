import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  const { runJob } = await import("../lib/jobs/runner");
  const outcome = await runJob("sync-catalog");
  console.log(JSON.stringify(outcome, null, 2));
  process.exit(outcome.status === "error" ? 1 : 0);
}

void main();
