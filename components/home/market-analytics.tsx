"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useCurrency } from "@/components/currency-provider";
import { Reveal } from "@/components/motion/reveal";
import { CURRENCY_SYMBOL } from "@/lib/currency";
import type { MarketPoint } from "@/lib/home";

interface Palette {
  signal: string;
  positive: string;
  muted: string;
  border: string;
  surface: string;
  text: string;
}

const FALLBACK: Palette = {
  signal: "#ff6a21",
  positive: "#3fbf7f",
  muted: "#8a9299",
  border: "#262b30",
  surface: "#14171a",
  text: "#e8ebed",
};

/** Reads themed CSS variables and re-reads when the theme class changes. */
function usePalette(): Palette {
  const [palette, setPalette] = useState<Palette>(FALLBACK);

  useEffect(() => {
    const read = () => {
      const s = getComputedStyle(document.documentElement);
      const get = (name: string, fb: string) =>
        s.getPropertyValue(name).trim() || fb;
      setPalette({
        signal: get("--signal", FALLBACK.signal),
        positive: get("--positive", FALLBACK.positive),
        muted: get("--muted", FALLBACK.muted),
        border: get("--border", FALLBACK.border),
        surface: get("--surface", FALLBACK.surface),
        text: get("--text", FALLBACK.text),
      });
    };
    read();
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, []);

  return palette;
}

function shortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function MarketAnalytics({ series }: { series: MarketPoint[] }) {
  const p = usePalette();
  const { currency, rates } = useCurrency();
  const rate = currency === "USD" ? 1 : (rates[currency] ?? 1);
  const symbol = CURRENCY_SYMBOL[currency];

  if (series.length === 0) return null;

  const data = series.map((d) => ({
    ...d,
    label: shortDate(d.date),
    indexDisp: d.index * rate,
  }));

  const latest = data[data.length - 1];
  const first = data[0];
  const change =
    first.index > 0 ? (latest.index - first.index) / first.index : 0;
  const totalVolume = series.reduce((s, d) => s + d.volume, 0);

  const tooltipStyle = {
    background: p.surface,
    border: `1px solid ${p.border}`,
    borderRadius: 8,
    color: p.text,
    fontSize: 12,
  } as const;

  const axisTick = { fill: p.muted, fontSize: 11 };

  return (
    <Reveal className="space-y-4">
      <div className="flex items-end justify-between">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          Market pulse
        </h2>
        <div className="flex items-center gap-4 text-right text-xs text-muted">
          <div>
            <div className="num text-sm text-text">
              {symbol}
              {Math.round(latest.indexDisp).toLocaleString("en-US")}
            </div>
            avg index · 30d
          </div>
          <div>
            <div
              className="num text-sm"
              style={{ color: change >= 0 ? p.positive : p.signal }}
            >
              {change >= 0 ? "+" : "−"}
              {Math.abs(Math.round(change * 100))}%
            </div>
            trend
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-muted">
            Average price index
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="idxFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={p.signal} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={p.signal} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={p.border} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} minTickGap={24} />
              <YAxis
                tick={axisTick}
                axisLine={false}
                tickLine={false}
                width={44}
                tickFormatter={(v: number) => `${symbol}${Math.round(v)}`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: p.muted }}
                formatter={(v) => [
                  `${symbol}${Math.round(Number(v)).toLocaleString("en-US")}`,
                  "Index",
                ]}
              />
              <Area
                type="monotone"
                dataKey="indexDisp"
                stroke={p.signal}
                strokeWidth={2}
                fill="url(#idxFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-muted">
            Listings tracked ·{" "}
            <span className="num text-text">
              {totalVolume.toLocaleString("en-US")}
            </span>
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid stroke={p.border} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} minTickGap={24} />
              <YAxis tick={axisTick} axisLine={false} tickLine={false} width={36} />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: p.muted }}
                cursor={{ fill: `${p.muted}22` }}
                formatter={(v) => [Number(v).toLocaleString("en-US"), "Listings"]}
              />
              <Bar dataKey="volume" fill={p.positive} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Reveal>
  );
}
