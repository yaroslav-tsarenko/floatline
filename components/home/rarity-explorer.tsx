import Link from "next/link";

import { Reveal } from "@/components/motion/reveal";
import type { RaritySlice } from "@/lib/home";

const RARITY_LABEL: Record<string, string> = {
  consumer: "Consumer",
  industrial: "Industrial",
  milspec: "Mil-Spec",
  restricted: "Restricted",
  classified: "Classified",
  covert: "Covert",
  contraband: "Contraband",
};

export function RarityExplorer({ slices }: { slices: RaritySlice[] }) {
  if (slices.length === 0) return null;
  const total = slices.reduce((s, r) => s + r.count, 0);
  if (total === 0) return null;

  return (
    <Reveal className="space-y-4">
      <div className="flex items-end justify-between">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          Explore by rarity
        </h2>
        <span className="num text-sm text-muted">{total} in stock</span>
      </div>

      {/* Proportional stacked bar */}
      <div className="flex h-3 overflow-hidden rounded-full border border-border">
        {slices.map((r) => (
          <div
            key={r.rarity}
            title={`${RARITY_LABEL[r.rarity] ?? r.rarity} · ${r.count}`}
            style={{
              flexBasis: `${(r.count / total) * 100}%`,
              backgroundColor: r.color ?? "var(--muted)",
            }}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {slices.map((r) => {
          const color = r.color ?? "var(--muted)";
          const pct = Math.round((r.count / total) * 100);
          return (
            <Link
              key={r.rarity}
              href={`/catalog?rarity=${r.rarity}`}
              className="group flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2.5 transition-colors hover:border-signal"
            >
              <span className="flex items-center gap-2 text-sm">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: color }}
                  aria-hidden
                />
                {RARITY_LABEL[r.rarity] ?? r.rarity}
              </span>
              <span className="num text-sm text-muted">
                {r.count}
                <span className="ml-1 text-[11px] opacity-60">{pct}%</span>
              </span>
            </Link>
          );
        })}
      </div>
    </Reveal>
  );
}
