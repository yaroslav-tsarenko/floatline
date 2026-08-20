type Entry<T> = { value: T; expires: number };

const store = new Map<string, Entry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

/**
 * Cross-request in-memory memoizer with a TTL. Caches the resolved value for
 * `ttlMs` and deduplicates concurrent misses so a cold key fires the loader
 * once. Scoped per server instance (Fluid Compute reuses instances), which is
 * exactly what we want for non-personalized, read-only aggregates: it keeps the
 * homepage and site-wide header from re-running full-table scans on every hit.
 *
 * Never cache per-user or money-critical data here.
 */
export async function memoTtl<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  const hit = store.get(key) as Entry<T> | undefined;
  if (hit && hit.expires > now) return hit.value;

  const pending = inflight.get(key) as Promise<T> | undefined;
  if (pending) return pending;

  const p = loader()
    .then((value) => {
      store.set(key, { value, expires: Date.now() + ttlMs });
      return value;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, p);
  return p;
}
