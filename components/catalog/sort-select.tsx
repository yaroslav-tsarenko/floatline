"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";

import {
  SORT_LABELS,
  SORTS,
  toQuery,
  type CatalogFilter,
  type SortKey,
} from "@/lib/catalog/params";

export function SortSelect({ filter }: { filter: CatalogFilter }) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      Sort
      <select
        value={filter.sort}
        onChange={(e) =>
          startTransition(() =>
            router.push(
              `${pathname}${toQuery(filter, { sort: e.target.value as SortKey })}`,
              { scroll: false },
            ),
          )
        }
        className="h-9 rounded-md border border-border bg-surface px-2 text-sm text-text"
      >
        {SORTS.map((s) => (
          <option key={s} value={s}>
            {SORT_LABELS[s]}
          </option>
        ))}
      </select>
    </label>
  );
}
