import { Suspense } from "react";
import type { Metadata } from "next";

import { CatalogFilters } from "@/components/catalog/filters";
import { GridSkeleton } from "@/components/catalog/grid-skeleton";
import { LoadMore } from "@/components/catalog/load-more";
import { SortSelect } from "@/components/catalog/sort-select";
import { ItemCard } from "@/components/item-card";
import {
  parseFilter,
  toQuery,
  type SearchParamsInput,
  type CatalogFilter,
} from "@/lib/catalog/params";
import { catalogFacets, queryCatalog } from "@/lib/catalog/queries";

export const metadata: Metadata = {
  title: "Catalog",
  description:
    "Browse CS2 skins by wear, rarity, and price. Every number is live — float band, our price, and the discount to Steam.",
};

async function CatalogGrid({ filter }: { filter: CatalogFilter }) {
  const page = await queryCatalog(filter);
  const query = toQuery(filter).replace(/^\?/, "");

  if (page.items.length === 0) {
    return (
      <div className="rounded-md border border-border bg-surface px-6 py-16 text-center">
        <p className="text-sm text-muted">
          Nothing matches these filters. Try widening the wear range or price.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {page.items.map((item, i) => (
        <ItemCard key={item.marketHashName} item={item} priority={i < 5} />
      ))}
      <LoadMore query={query} initialCursor={page.nextCursor} />
    </div>
  );
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsInput>;
}) {
  const sp = await searchParams;
  const filter = parseFilter(sp);
  const facets = await catalogFacets(filter);

  // Distinct key so the streamed grid remounts (and re-suspends) per filter set.
  const gridKey = toQuery(filter);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
        <aside className="lg:sticky lg:top-20 lg:h-fit">
          <CatalogFilters filter={filter} facets={facets} />
        </aside>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
            <p className="text-sm text-muted">
              <span className="num text-text">{facets.total}</span> item
              {facets.total === 1 ? "" : "s"}
            </p>
            <SortSelect filter={filter} />
          </div>

          <Suspense key={gridKey} fallback={<GridSkeleton />}>
            <CatalogGrid filter={filter} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
