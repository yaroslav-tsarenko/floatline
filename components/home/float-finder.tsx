"use client";

import Link from "next/link";
import { useState } from "react";

import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/cn";
import { FLOAT_ZONES, zoneForFloat } from "@/lib/cs2/float";

const FULL_LABEL: Record<string, string> = {
  FN: "Factory New",
  MW: "Minimal Wear",
  FT: "Field-Tested",
  WW: "Well-Worn",
  BS: "Battle-Scarred",
};

export function FloatFinder() {
  const [value, setValue] = useState(0.12);
  const zone = zoneForFloat(value) ?? "FT";

  return (
    <Reveal className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          Find your float
        </h2>
        <p className="mt-1 text-sm text-muted">
          Drag to a wear you like — we&apos;ll take you straight to it.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="num text-3xl font-semibold">{value.toFixed(2)}</span>
          <span className="text-sm text-signal">{FULL_LABEL[zone]}</span>
        </div>

        <div className="relative h-8">
          <div className="absolute inset-x-0 top-1/2 flex h-1.5 -translate-y-1/2 overflow-hidden rounded">
            {FLOAT_ZONES.map((z) => (
              <div
                key={z.key}
                className={cn(
                  "h-full",
                  z.key === zone ? "bg-signal" : "bg-surface-2",
                )}
                style={{ flexBasis: `${(z.end - z.start) * 100}%` }}
              />
            ))}
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={value}
            aria-label="Target float"
            onChange={(e) => setValue(Number(e.target.value))}
            className="absolute inset-x-0 top-0 h-8 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-border [&::-webkit-slider-thumb]:bg-text"
          />
        </div>

        <div className="mt-2 flex justify-between text-[11px] uppercase tracking-wider text-muted">
          {FLOAT_ZONES.map((z) => (
            <span key={z.key} className={cn(z.key === zone && "text-signal")}>
              {z.label}
            </span>
          ))}
        </div>

        <Link
          href={`/catalog?wear=${zone}&sort=float`}
          className="mt-5 block rounded-md bg-signal py-2.5 text-center text-sm font-medium text-white hover:brightness-110"
        >
          Show {FULL_LABEL[zone]} skins
        </Link>
      </div>
    </Reveal>
  );
}
