"use server";

import type { ReactNode } from "react";

import { ItemCard } from "@/components/item-card";
import { parseFilter } from "@/lib/catalog/params";
import { queryCatalog } from "@/lib/catalog/queries";

/**
 * Load-more for the catalog grid. Cards must stay server-rendered (they use the
 * async <Money> currency component), so the next keyset page is rendered here
 * and returned as RSC nodes for the client to append.
 */
export async function loadMoreItems(
  query: string,
  cursor: string,
): Promise<{ nodes: ReactNode; nextCursor: string | null }> {
  const sp = Object.fromEntries(new URLSearchParams(query));
  const filter = parseFilter({ ...sp, cursor });
  const page = await queryCatalog(filter);

  return {
    nodes: page.items.map((item) => (
      <ItemCard key={item.marketHashName} item={item} />
    )),
    nextCursor: page.nextCursor,
  };
}
