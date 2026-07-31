import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

import { env } from "@/lib/env";
import * as schema from "./schema";

// The WebSocket-based pool driver is required for transactions.
// In Node runtimes `ws` must be supplied; on Vercel Edge the global WebSocket is used.
if (typeof WebSocket === "undefined") {
  neonConfig.webSocketConstructor = ws;
}

const globalForDb = globalThis as unknown as { pool?: Pool };

export const pool =
  globalForDb.pool ?? new Pool({ connectionString: env.DATABASE_URL });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool;
}

export const db = drizzle(pool, { schema });

export type Db = typeof db;
export { schema };
