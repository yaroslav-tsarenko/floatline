import { isNull, sql } from "drizzle-orm";

import { loadImageMap } from "@/lib/catalog/image-map";
import { db } from "@/lib/db";
import { items } from "@/lib/db/schema";
import type { JobStats } from "./types";

const UPDATE_CHUNK = 500;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * Fills `items.image_hash` for rows that have none, resolving a Steam icon hash
 * per market_hash_name via the ByMykel catalog. Only touches NULL rows and only
 * ever writes a resolved hash (never nulls), so it's safe to re-run and can't
 * wipe a working image. This is the repeatable, admin-triggerable equivalent of
 * scripts/backfill-images-catalog.ts — the one-click fix when images go missing
 * after a DB rebuild or a batch of new arrivals.
 */
export async function backfillImages(): Promise<JobStats> {
  const start = Date.now();
  const map = await loadImageMap();

  const rows = await db
    .select({ name: items.marketHashName })
    .from(items)
    .where(isNull(items.imageHash));

  const updates: { name: string; hash: string }[] = [];
  const unresolved: string[] = [];
  for (const { name } of rows) {
    const hash = map.resolve(name);
    if (hash) updates.push({ name, hash });
    else unresolved.push(name);
  }

  for (const part of chunk(updates, UPDATE_CHUNK)) {
    const values = sql.join(
      part.map((u) => sql`(${u.name}, ${u.hash})`),
      sql`, `,
    );
    await db.execute(sql`
      update ${items} as it
      set image_hash = v.hash
      from (values ${values}) as v(name, hash)
      where it.market_hash_name = v.name
    `);
  }

  return {
    missing: rows.length,
    catalogNames: map.size,
    updated: updates.length,
    unresolved: unresolved.length,
    unresolvedSample: unresolved.slice(0, 20),
    durationMs: Date.now() - start,
  };
}
