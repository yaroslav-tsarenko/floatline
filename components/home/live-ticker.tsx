"use client";

import { Money } from "@/components/money";
import { Reveal } from "@/components/motion/reveal";
import type { LivePurchase } from "@/lib/home";

/**
 * Seamless marquee of recent purchases. The list is rendered twice and the
 * track translates -50%, so the loop is continuous. CSS animation is disabled
 * under prefers-reduced-motion by the global rule (track sits static).
 */
export function LiveTicker({ purchases }: { purchases: LivePurchase[] }) {
  if (purchases.length === 0) return null;
  const loop = [...purchases, ...purchases];

  return (
    <Reveal className="space-y-3">
      <h2 className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-muted">
        <span className="size-1.5 rounded-full bg-positive" />
        Just bought
      </h2>
      <div className="marquee-mask overflow-hidden">
        <div className="animate-marquee flex w-max gap-2 hover:[animation-play-state:paused]">
          {loop.map((p, i) => (
            <div
              key={`${p.id}-${i}`}
              className="flex shrink-0 items-center gap-2 rounded-md border border-border bg-surface-2 px-3 py-2 text-xs"
            >
              <span className="max-w-48 truncate">{p.itemName}</span>
              <Money usd={p.price} className="text-signal" />
            </div>
          ))}
        </div>
      </div>
    </Reveal>
  );
}
