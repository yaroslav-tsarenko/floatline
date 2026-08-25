/**
 * One-off image backfill from the public ByMykel CS2 catalog. Fills
 * `items.image_hash` for rows that have none, resolving a Steam economy icon
 * hash per market_hash_name. Idempotent: only touches NULL rows, only writes a
 * resolved hash. Shares its resolver with the admin `backfill-images` job and
 * with the catalog sync (lib/catalog/image-map.ts), so matching stays in one
 * place. Prefer the admin panel button in production; this script is for local
 * runs / bulk fixes.
 *
 *   tsx --env-file=.env scripts/backfill-images-catalog.ts
 */
import { isNull, sql } from "drizzle-orm";

import { loadImageMap } from "@/lib/catalog/image-map";
import { db, pool } from "@/lib/db";
import { items } from "@/lib/db/schema";

const CHUNK = 500;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function main() {
  const map = await loadImageMap();

  const rows = await db
    .select({ name: items.marketHashName })
    .from(items)
    .where(isNull(items.imageHash));

  console.log(`${rows.length} items missing an image; catalog has ${map.size} names.`);

  const updates: { name: string; hash: string }[] = [];
  const unresolved: string[] = [];
  for (const { name } of rows) {
    const hash = map.resolve(name);
    if (hash) updates.push({ name, hash });
    else unresolved.push(name);
  }

  for (const part of chunk(updates, CHUNK)) {
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

  console.log(`Updated ${updates.length} rows, ${unresolved.length} unresolved.`);
  if (unresolved.length) console.log(unresolved.map((u) => `  ${u}`).join("\n"));
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
