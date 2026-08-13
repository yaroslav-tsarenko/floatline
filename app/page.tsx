import Link from "next/link";

import { AmbientField } from "@/components/decor/ambient-field";
import { FrameCorners } from "@/components/decor/frame-corners";
import { SectionRule } from "@/components/decor/section-rule";
import { FloatAxis } from "@/components/float-axis";
import { FloatFinder } from "@/components/home/float-finder";
import { LiveTicker } from "@/components/home/live-ticker";
import { MarketAnalytics } from "@/components/home/market-analytics";
import { RarityExplorer } from "@/components/home/rarity-explorer";
import { Vault } from "@/components/home/vault";
import { CountUp } from "@/components/motion/count-up";
import { Reveal } from "@/components/motion/reveal";
import { HeroSearch } from "@/components/hero-search";
import { ItemCard } from "@/components/item-card";
import { Sparkline } from "@/components/sparkline";
import { Surface } from "@/components/ui/surface";
import { itemSlug } from "@/lib/catalog/slug";
import {
  getBestValue,
  getCategoryCounts,
  getHomeStats,
  getLivePurchases,
  getMarketSeries,
  getNewArrivals,
  getPriceMovers,
  getRarityDistribution,
  getVaultItems,
  type PriceMover,
} from "@/lib/home";

function StatTile({
  value,
  label,
}: {
  value: React.ReactNode;
  label: string;
}) {
  return (
    <Surface inset className="px-4 py-3">
      <div className="num text-2xl font-semibold">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </Surface>
  );
}

function moverName(m: PriceMover): string {
  return m.weapon && m.skinName ? `${m.weapon} | ${m.skinName}` : m.name;
}

function MoverRow({ m, dir }: { m: PriceMover; dir: "up" | "down" }) {
  const pct = Math.round(Math.abs(m.changePct) * 100);
  const up = dir === "up";
  return (
    <Link
      href={`/item/${itemSlug(m.marketHashName)}`}
      className="flex items-center gap-3 rounded px-2 py-1.5 hover:bg-surface-2"
    >
      <span className="min-w-0 flex-1 truncate text-sm">{moverName(m)}</span>
      <Sparkline
        points={m.points}
        tone={up ? "negative" : "positive"}
        className="h-6 w-16 shrink-0"
      />
      <span
        className={`num w-14 shrink-0 text-right text-sm ${up ? "text-negative" : "text-positive"}`}
      >
        {up ? "+" : "−"}
        {pct}%
      </span>
    </Link>
  );
}

const STEPS = [
  {
    n: "1",
    title: "Pick a skin",
    body: "Browse by wear, rarity, and price. Every number is live.",
  },
  {
    n: "2",
    title: "Top up your balance",
    body: "Add funds once and spend from your balance. No card details per purchase.",
  },
  {
    n: "3",
    title: "Confirm the buy",
    body: "We re-check the price against the market before charging.",
  },
  {
    n: "4",
    title: "Accept in Steam",
    body: "A trade offer lands in your inventory, usually within minutes.",
  },
];

const REASONS = [
  {
    title: "Delivered in minutes",
    body: "Direct seller-to-buyer trades, not manual fulfillment.",
  },
  {
    title: "Below Steam market",
    body: "We aggregate 28+ markets and pass the difference to you.",
  },
  {
    title: "Automatic refunds",
    body: "If a trade falls through, your balance is credited back — no tickets.",
  },
  {
    title: "Support that answers",
    body: "Real answers about float, delivery, and orders.",
  },
];

const FAQ = [
  {
    q: "Is buying here safe?",
    a: "Yes. You fund a balance and spend from it — we never ask for card details per skin. Items are delivered by trade directly from the seller.",
  },
  {
    q: "How long does delivery take?",
    a: "Most trades arrive within minutes of confirming. You accept the offer in Steam like any other trade.",
  },
  {
    q: "What if the trade fails?",
    a: "Your balance is automatically refunded. Money is only final once the item is safely in your inventory.",
  },
  {
    q: "Do I need Steam Guard?",
    a: "Yes — Steam Guard must be enabled to receive trades. It also protects your account.",
  },
  {
    q: "Why do you need my trade link?",
    a: "The trade link is how the seller sends you the item. You can paste it in your account settings.",
  },
  {
    q: "Which currency am I charged in?",
    a: "The one you pick in the header — USD, EUR, or GBP. Every price, top-up, and purchase is shown and charged in your selected currency at today's rate. Switch anytime.",
  },
];

export default async function HomePage() {
  const [
    stats,
    bestValue,
    categories,
    movers,
    newArrivals,
    live,
    vault,
    series,
    rarities,
  ] = await Promise.all([
    getHomeStats(),
    getBestValue(8),
    getCategoryCounts(),
    getPriceMovers(5),
    getNewArrivals(8),
    getLivePurchases(12),
    getVaultItems(7),
    getMarketSeries(),
    getRarityDistribution(),
  ]);

  return (
    <div className="relative mx-auto max-w-7xl space-y-16 px-4 py-10">
      {/* Ambient decorative background (glows, drifting glyphs, grain) */}
      <AmbientField />
      {/* Decorative blueprint grid behind the hero */}
      <div
        aria-hidden
        className="bg-grid pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px]"
      />
      {/* Hero */}
      <section className="relative space-y-6">
        {/* Ghost float readout watermark behind the headline */}
        <span
          aria-hidden
          className="num pointer-events-none absolute -top-6 right-0 -z-10 select-none text-7xl font-bold text-border/40 sm:text-8xl"
        >
          0.1847
        </span>
        <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-signal">
          <span className="h-px w-8 bg-signal/50" />
          CS2 skins · at the real number
        </p>
        <h1 className="max-w-3xl font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
          Buy the float you want. Pay less than Steam.
        </h1>
        <Surface className="relative overflow-hidden p-5 sm:p-8">
          <FrameCorners />
          <FloatAxis value={0.1847} />
        </Surface>
        <div className="max-w-2xl">
          <HeroSearch />
        </div>
        <div className="grid max-w-2xl grid-cols-3 gap-3">
          <StatTile
            value={<CountUp value={stats.inStock} separator />}
            label="skins in stock"
          />
          <StatTile
            value={
              stats.avgDiscount != null ? (
                <CountUp
                  value={Math.round(stats.avgDiscount * 100)}
                  prefix="−"
                  suffix="%"
                  className="text-positive"
                />
              ) : (
                "—"
              )
            }
            label="avg vs Steam"
          />
          <StatTile
            value={
              stats.avgDeliveryMinutes != null ? (
                <CountUp value={Math.round(stats.avgDeliveryMinutes)} suffix="m" />
              ) : (
                "—"
              )
            }
            label="avg delivery · 24h"
          />
        </div>
      </section>

      <SectionRule label="§ 01 · live feed" />

      {/* Live purchases */}
      <LiveTicker purchases={live} />

      {/* Best value */}
      {bestValue.length > 0 && (
        <Reveal className="space-y-4">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              Biggest discount to Steam
            </h2>
            <Link
              href="/catalog?sort=discount"
              className="text-sm text-signal hover:underline"
            >
              See all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {bestValue.map((item, i) => (
              <ItemCard key={item.marketHashName} item={item} priority={i < 4} />
            ))}
          </div>
        </Reveal>
      )}

      {/* High-Tier Vault */}
      <Vault items={vault} />

      {/* Market analytics */}
      <MarketAnalytics series={series} />

      <SectionRule label="§ 02 · index" />

      {/* Categories */}
      <Reveal className="space-y-4">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          Browse by category
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => (
            <Link key={c.category} href={`/catalog?category=${c.category}`}>
              <Surface className="flex flex-col justify-between p-4 transition-[transform,border-color] hover:-translate-y-0.5 hover:border-signal">
                <span className="capitalize">{c.category}</span>
                <span className="num mt-6 text-lg text-muted">{c.count}</span>
              </Surface>
            </Link>
          ))}
        </div>
      </Reveal>

      {/* Price movements */}
      {(movers.up.length > 0 || movers.down.length > 0) && (
        <Reveal className="space-y-4">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            This week&apos;s price movements
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Surface className="p-4">
              <p className="mb-2 text-xs uppercase tracking-widest text-negative">
                Trending up
              </p>
              <div className="space-y-0.5">
                {movers.up.map((m) => (
                  <MoverRow key={m.marketHashName} m={m} dir="up" />
                ))}
                {movers.up.length === 0 && (
                  <p className="px-2 py-1.5 text-sm text-muted">No movers.</p>
                )}
              </div>
            </Surface>
            <Surface className="p-4">
              <p className="mb-2 text-xs uppercase tracking-widest text-positive">
                Trending down
              </p>
              <div className="space-y-0.5">
                {movers.down.map((m) => (
                  <MoverRow key={m.marketHashName} m={m} dir="down" />
                ))}
                {movers.down.length === 0 && (
                  <p className="px-2 py-1.5 text-sm text-muted">No movers.</p>
                )}
              </div>
            </Surface>
          </div>
        </Reveal>
      )}

      {/* Rarity explorer */}
      <RarityExplorer slices={rarities} />

      {/* Float finder */}
      <FloatFinder />

      <SectionRule label="§ 03 · protocol" />

      {/* How it works */}
      <Reveal className="space-y-4">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          How it works
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <Surface
              key={s.n}
              className="relative overflow-hidden p-4 transition-[transform,border-color] hover:-translate-y-0.5 hover:border-signal"
            >
              <span
                className="pointer-events-none absolute -right-2 -top-4 select-none font-display text-7xl font-bold text-border/60"
                aria-hidden
              >
                {s.n}
              </span>
              <div className="relative mt-2 font-medium">{s.title}</div>
              <p className="relative mt-1 text-sm text-muted">{s.body}</p>
            </Surface>
          ))}
        </div>
      </Reveal>

      {/* Why us */}
      <Reveal className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {REASONS.map((r) => (
          <Surface inset key={r.title} className="p-4">
            <div className="font-medium">{r.title}</div>
            <p className="mt-1 text-sm text-muted">{r.body}</p>
          </Surface>
        ))}
      </Reveal>

      {/* New arrivals */}
      {newArrivals.length > 0 && (
        <Reveal className="space-y-4">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            New arrivals
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {newArrivals.map((item) => (
              <ItemCard key={item.marketHashName} item={item} />
            ))}
          </div>
        </Reveal>
      )}

      <SectionRule label="§ 04 · faq" />

      {/* FAQ */}
      <Reveal className="space-y-4">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          Questions
        </h2>
        <div className="divide-y divide-border overflow-hidden rounded-md border border-border">
          {FAQ.map((f) => (
            <details key={f.q} className="group">
              <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium marker:content-none hover:bg-surface-2">
                {f.q}
                <span className="text-muted transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="px-4 pb-4 text-sm text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </Reveal>
    </div>
  );
}
