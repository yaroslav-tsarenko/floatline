"use client";

import { useState } from "react";

import { cn } from "@/lib/cn";
import { FLOAT_ZONES } from "@/lib/cs2/float";
import type { Exterior } from "@/lib/cs2/parseName";

const STEP = 0.01;

/** Wears whose float band overlaps [lo, hi]. */
function wearsInRange(lo: number, hi: number): Exterior[] {
  return FLOAT_ZONES.filter((z) => z.start < hi && z.end > lo).map((z) => z.key);
}

/** Tightest [lo, hi] float span covering the given wears (full range if none). */
function rangeForWears(wears: Exterior[]): [number, number] {
  const zones = FLOAT_ZONES.filter((z) => wears.includes(z.key));
  if (!zones.length) return [0, 1];
  return [
    Math.min(...zones.map((z) => z.start)),
    Math.max(...zones.map((z) => z.end)),
  ];
}

/**
 * Dual-thumb float slider over the 0.00–1.00 wear axis. The catalog is
 * aggregated per market_hash_name (no per-listing float), so a range commits to
 * the set of wear bands it overlaps — driving the same `wears` filter the DB
 * indexes, with no schema change.
 */
export function FloatRange({
  wears,
  onCommit,
}: {
  wears: Exterior[];
  onCommit: (wears: Exterior[]) => void;
}) {
  const [lo, setLo] = useState(rangeForWears(wears)[0]);
  const [hi, setHi] = useState(rangeForWears(wears)[1]);

  // Reconcile local thumbs when the URL-derived wears change (Reset, chips).
  const sig = wears.slice().sort().join(",");
  const [syncedSig, setSyncedSig] = useState(sig);
  if (syncedSig !== sig) {
    const [nlo, nhi] = rangeForWears(wears);
    setSyncedSig(sig);
    setLo(nlo);
    setHi(nhi);
  }

  const commit = (nlo: number, nhi: number) => onCommit(wearsInRange(nlo, nhi));

  const pct = (v: number) => `${v * 100}%`;

  return (
    <div className="space-y-2">
      <div className="relative h-8">
        {/* Wear-band track */}
        <div className="absolute inset-x-0 top-1/2 flex h-1.5 -translate-y-1/2 overflow-hidden rounded">
          {FLOAT_ZONES.map((z) => (
            <div
              key={z.key}
              className="h-full bg-surface-2"
              style={{ flexBasis: pct(z.end - z.start) }}
            />
          ))}
        </div>
        {/* Selected span */}
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded bg-signal/60"
          style={{ left: pct(lo), width: pct(Math.max(0, hi - lo)) }}
          aria-hidden
        />
        <input
          type="range"
          min={0}
          max={1}
          step={STEP}
          value={lo}
          aria-label="Minimum float"
          onChange={(e) => setLo(Math.min(Number(e.target.value), hi - STEP))}
          onPointerUp={() => commit(lo, hi)}
          onKeyUp={() => commit(lo, hi)}
          className="pointer-events-none absolute inset-x-0 top-0 h-8 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-border [&::-webkit-slider-thumb]:bg-text"
        />
        <input
          type="range"
          min={0}
          max={1}
          step={STEP}
          value={hi}
          aria-label="Maximum float"
          onChange={(e) => setHi(Math.max(Number(e.target.value), lo + STEP))}
          onPointerUp={() => commit(lo, hi)}
          onKeyUp={() => commit(lo, hi)}
          className="pointer-events-none absolute inset-x-0 top-0 h-8 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-border [&::-webkit-slider-thumb]:bg-text"
        />
      </div>
      <div className="flex items-center justify-between text-[11px] text-muted">
        <span className="num">{lo.toFixed(2)}</span>
        <div className="flex gap-3 uppercase tracking-wider">
          {FLOAT_ZONES.map((z) => (
            <span
              key={z.key}
              className={cn(wears.includes(z.key) && "text-signal")}
            >
              {z.label}
            </span>
          ))}
        </div>
        <span className="num">{hi.toFixed(2)}</span>
      </div>
    </div>
  );
}
