import { pool } from "./index";

/**
 * Runs `fn` while holding a Postgres session-level advisory lock keyed by
 * `name`. If the lock is already held (same job running elsewhere), `fn` is
 * skipped and `{ skipped: true }` is returned. The lock lives on a dedicated
 * pooled connection for the whole duration and is always released.
 */
export async function withAdvisoryLock<T>(
  name: string,
  fn: () => Promise<T>,
): Promise<{ skipped: true } | { skipped: false; result: T }> {
  const client = await pool.connect();
  try {
    const locked = await client.query<{ locked: boolean }>(
      "SELECT pg_try_advisory_lock(hashtext($1)::bigint) AS locked",
      [name],
    );
    if (!locked.rows[0]?.locked) {
      return { skipped: true };
    }
    try {
      const result = await fn();
      return { skipped: false, result };
    } finally {
      await client.query("SELECT pg_advisory_unlock(hashtext($1)::bigint)", [
        name,
      ]);
    }
  } finally {
    client.release();
  }
}
