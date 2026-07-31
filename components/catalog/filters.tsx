"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { FloatRange } from "@/components/catalog/float-range";
import { useCurrency } from "@/components/currency-provider";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { FLOAT_ZONES } from "@/lib/cs2/float";
import type { Exterior } from "@/lib/cs2/parseName";
import type { Rarity } from "@/lib/cs2/rarity";
import {
  activeFilterCount,
  CATEGORIES,
  RARITIES,
  toQuery,
  type CatalogFilter,
} from "@/lib/catalog/params";
import { CURRENCY_SYMBOL } from "@/lib/currency";
import type { Facets } from "@/lib/catalog/queries";

const RARITY_CLASS: Record<Rarity, string> = {
  consumer: "text-rarity-consumer border-rarity-consumer",
  industrial: "text-rarity-industrial border-rarity-industrial",
  milspec: "text-rarity-milspec border-rarity-milspec",
  restricted: "text-rarity-restricted border-rarity-restricted",
  classified: "text-rarity-classified border-rarity-classified",
  covert: "text-rarity-covert border-rarity-covert",
  contraband: "text-rarity-contraband border-rarity-contraband",
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted">
      {children}
    </p>
  );
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

interface Chip {
  key: string;
  label: string;
  patch: Partial<CatalogFilter>;
}

/** Removable chips for every active filter dimension. */
function activeChips(f: CatalogFilter, symbol: string): Chip[] {
  const chips: Chip[] = [];
  if (f.q) chips.push({ key: "q", label: `“${f.q}”`, patch: { q: "" } });
  if (f.category)
    chips.push({
      key: "cat",
      label: f.category,
      patch: { category: null, weapon: null },
    });
  if (f.weapon)
    chips.push({ key: "wpn", label: f.weapon, patch: { weapon: null } });
  for (const w of f.wears)
    chips.push({
      key: `w-${w}`,
      label: w,
      patch: { wears: f.wears.filter((x) => x !== w) },
    });
  for (const r of f.rarities)
    chips.push({
      key: `r-${r}`,
      label: r,
      patch: { rarities: f.rarities.filter((x) => x !== r) },
    });
  if (f.stattrak != null)
    chips.push({
      key: "st",
      label: f.stattrak ? "StatTrak™" : "No StatTrak",
      patch: { stattrak: null },
    });
  if (f.souvenir != null)
    chips.push({
      key: "sv",
      label: f.souvenir ? "Souvenir" : "No Souvenir",
      patch: { souvenir: null },
    });
  if (f.priceMin != null || f.priceMax != null)
    chips.push({
      key: "price",
      label: `${symbol}${f.priceMin ?? 0}–${f.priceMax != null ? symbol + f.priceMax : "∞"}`,
      patch: { priceMin: null, priceMax: null },
    });
  return chips;
}

export function CatalogFilters({
  filter,
  facets,
}: {
  filter: CatalogFilter;
  facets: Facets;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const { currency, rates } = useCurrency();
  const rate = currency === "USD" ? 1 : (rates[currency] ?? 1);
  const symbol = CURRENCY_SYMBOL[currency];

  const push = (patch: Partial<CatalogFilter>) => {
    startTransition(() => {
      router.push(`${pathname}${toQuery(filter, patch)}`, { scroll: false });
    });
  };

  // Debounced text + price inputs so we don't navigate on every keystroke.
  // Price fields are shown in the display currency and converted to USD here.
  const toDisplay = (usd: number | null) =>
    usd == null ? "" : String(round2(usd * rate));
  const [q, setQ] = useState(filter.q);
  const [min, setMin] = useState(toDisplay(filter.priceMin));
  const [max, setMax] = useState(toDisplay(filter.priceMax));

  // Re-sync local inputs to the URL-derived filter (Reset, back/forward nav,
  // currency change). Done during render per React's "adjust state on prop
  // change" guidance, which avoids the cascading-render lint warning.
  const [synced, setSynced] = useState({
    q: filter.q,
    min: filter.priceMin,
    max: filter.priceMax,
    rate,
  });
  if (
    synced.q !== filter.q ||
    synced.min !== filter.priceMin ||
    synced.max !== filter.priceMax ||
    synced.rate !== rate
  ) {
    setSynced({ q: filter.q, min: filter.priceMin, max: filter.priceMax, rate });
    setQ(filter.q);
    setMin(toDisplay(filter.priceMin));
    setMax(toDisplay(filter.priceMax));
  }

  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const t = setTimeout(() => {
      const toUsd = (v: string) =>
        v === "" ? null : round2(Number(v) / rate);
      const nMin = toUsd(min);
      const nMax = toUsd(max);
      if (
        q === filter.q &&
        nMin === filter.priceMin &&
        nMax === filter.priceMax
      ) {
        return;
      }
      push({
        q,
        priceMin: Number.isFinite(nMin as number) ? nMin : null,
        priceMax: Number.isFinite(nMax as number) ? nMax : null,
      });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, min, max]);

  const active = activeFilterCount(filter);
  const chips = activeChips(filter, symbol);

  return (
    <div className={cn("space-y-6", pending && "opacity-70")}>
      <div className="flex items-center justify-between">
        <FieldLabel>Filters{active > 0 ? ` · ${active}` : ""}</FieldLabel>
        {active > 0 && (
          <button
            className="text-xs text-signal hover:underline"
            onClick={() =>
              startTransition(() => router.push(pathname, { scroll: false }))
            }
          >
            Clear all
          </button>
        )}
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <button
              key={c.key}
              onClick={() => push(c.patch)}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 px-2 py-0.5 text-xs capitalize text-muted hover:text-text"
              aria-label={`Remove filter ${c.label}`}
            >
              {c.label}
              <span aria-hidden className="text-muted">
                ×
              </span>
            </button>
          ))}
        </div>
      )}

      <div>
        <FieldLabel>Search</FieldLabel>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="AK-47, Doppler…"
          aria-label="Search catalog"
        />
      </div>

      <div>
        <FieldLabel>Category</FieldLabel>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.filter(
            (c) => (facets.category[c] ?? 0) > 0 || filter.category === c,
          ).map((c) => {
            const on = filter.category === c;
            return (
              <button
                key={c}
                onClick={() => push({ category: on ? null : c, weapon: null })}
                className={cn(
                  "rounded border px-2 py-1 text-xs capitalize",
                  on
                    ? "border-signal bg-signal/10 text-signal"
                    : "border-border text-muted hover:text-text",
                )}
              >
                {c}
                <span className="num ml-1 opacity-70">
                  {facets.category[c] ?? 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {filter.category && facets.weapons.length > 0 && (
        <div>
          <FieldLabel>Weapon</FieldLabel>
          <select
            value={filter.weapon ?? ""}
            onChange={(e) => push({ weapon: e.target.value || null })}
            className="h-9 w-full rounded-md border border-border bg-surface px-2 text-sm"
          >
            <option value="">All weapons</option>
            {facets.weapons.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <FieldLabel>Float / Wear</FieldLabel>
        <FloatRange
          wears={filter.wears}
          onCommit={(wears) => push({ wears })}
        />
        <div className="mt-3 flex overflow-hidden rounded border border-border">
          {FLOAT_ZONES.map((zone) => {
            const on = filter.wears.includes(zone.key as Exterior);
            const count = facets.wear[zone.key] ?? 0;
            return (
              <button
                key={zone.key}
                onClick={() =>
                  push({ wears: toggle(filter.wears, zone.key as Exterior) })
                }
                style={{ flexBasis: `${(zone.end - zone.start) * 100}%` }}
                className={cn(
                  "border-r border-border py-1.5 text-center text-[11px] last:border-r-0",
                  on
                    ? "bg-signal/15 text-signal"
                    : "text-muted hover:bg-surface-2",
                )}
                title={`${zone.label} · ${count}`}
              >
                {zone.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <FieldLabel>Rarity</FieldLabel>
        <div className="flex flex-wrap gap-1.5">
          {RARITIES.filter(
            (r) => (facets.rarity[r] ?? 0) > 0 || filter.rarities.includes(r),
          ).map((r) => {
            const on = filter.rarities.includes(r);
            return (
              <button
                key={r}
                onClick={() => push({ rarities: toggle(filter.rarities, r) })}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded border px-2 py-1 text-xs capitalize",
                  RARITY_CLASS[r],
                  on ? "bg-current/10" : "opacity-60 hover:opacity-100",
                )}
              >
                <span className="size-2 rounded-full bg-current" />
                {r}
                <span className="num opacity-70">{facets.rarity[r] ?? 0}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <FieldLabel>Price ({symbol})</FieldLabel>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            value={min}
            onChange={(e) => setMin(e.target.value)}
            placeholder="Min"
            className="num h-9"
            aria-label="Minimum price"
          />
          <span className="text-muted">–</span>
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            value={max}
            onChange={(e) => setMax(e.target.value)}
            placeholder="Max"
            className="num h-9"
            aria-label="Maximum price"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex cursor-pointer items-center justify-between text-sm">
          <span>StatTrak™ only</span>
          <input
            type="checkbox"
            checked={filter.stattrak === true}
            onChange={(e) => push({ stattrak: e.target.checked ? true : null })}
            className="size-4 accent-signal"
          />
        </label>
        <label className="flex cursor-pointer items-center justify-between text-sm">
          <span>Souvenir only</span>
          <input
            type="checkbox"
            checked={filter.souvenir === true}
            onChange={(e) => push({ souvenir: e.target.checked ? true : null })}
            className="size-4 accent-signal"
          />
        </label>
        <label className="flex cursor-pointer items-center justify-between text-sm">
          <span>Include out of stock</span>
          <input
            type="checkbox"
            checked={!filter.available}
            onChange={(e) => push({ available: !e.target.checked })}
            className="size-4 accent-signal"
          />
        </label>
      </div>
    </div>
  );
}
