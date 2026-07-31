import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { BuyButton, type BuyState } from "@/components/buy-button";
import { FloatAxis } from "@/components/float-axis";
import { ItemCard } from "@/components/item-card";
import { Money } from "@/components/money";
import { PriceChart } from "@/components/price-chart";
import { SkinImage } from "@/components/skin-image";
import { Badge } from "@/components/ui/badge";
import { Surface } from "@/components/ui/surface";
import { getCurrentUser } from "@/lib/auth/session";
import { getBalance } from "@/lib/wallet/ledger";
import { itemSlug, slugToMarketHashName } from "@/lib/catalog/slug";
import {
  getItem,
  getPriceHistory,
  getSimilar,
  getVariants,
  type ItemDetail,
} from "@/lib/catalog/item";
import { cn } from "@/lib/cn";
import { midFloatForExterior } from "@/lib/cs2/float";

function fullName(item: ItemDetail): string {
  const base =
    item.weapon && item.skinName
      ? `${item.weapon} | ${item.skinName}`
      : item.name;
  const tags = [
    item.isStattrak ? "StatTrak™" : null,
    item.isSouvenir ? "Souvenir" : null,
  ].filter(Boolean);
  return tags.length ? `${tags.join(" ")} ${base}` : base;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = await getItem(slugToMarketHashName(slug));
  if (!item) return { title: "Item not found" };

  const price = item.sellPrice != null ? ` — $${item.sellPrice.toFixed(2)}` : "";
  return {
    title: fullName(item),
    description: `${fullName(item)}${price}. See the float band and how it compares to Steam, then buy from your Floatline balance.`,
  };
}

export default async function ItemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const marketHashName = slugToMarketHashName(slug);
  const item = await getItem(marketHashName);
  if (!item) notFound();

  const [history, variants, similar, user] = await Promise.all([
    getPriceHistory(marketHashName),
    getVariants(item),
    getSimilar(item),
    getCurrentUser(),
  ]);

  let buyState: BuyState = "guest";
  if (user) {
    if (!user.steamId64 || !user.tradeToken) {
      buyState = "no_trade";
    } else if (
      item.sellPrice != null &&
      Number(await getBalance(user.id)) < item.sellPrice
    ) {
      buyState = "insufficient";
    } else {
      buyState = "ready";
    }
  }

  const discountPct =
    item.discount != null ? Math.round(item.discount * 100) : null;
  const rarityColor = item.rarityColor ?? undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: fullName(item),
    category: item.category,
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: item.sellPrice ?? undefined,
      availability: item.isAvailable
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <nav className="mb-4 text-xs text-muted">
        <Link href="/catalog" className="hover:text-text">
          Catalog
        </Link>
        <span className="mx-1">/</span>
        <Link
          href={`/catalog?category=${item.category}`}
          className="capitalize hover:text-text"
        >
          {item.category}
        </Link>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        {/* Left: artwork + float axis */}
        <div className="space-y-4">
          <Surface
            className="overflow-hidden"
            style={rarityColor ? { borderColor: `${rarityColor}55` } : undefined}
          >
            <SkinImage
              imageHash={item.imageHash}
              name={fullName(item)}
              rarityColor={item.rarityColor}
              priority
              sizes="(max-width: 1024px) 100vw, 600px"
              className="aspect-[16/10] w-full"
            />
          </Surface>

          <Surface className="p-4">
            <p className="mb-2 text-xs uppercase tracking-widest text-muted">
              Wear · float axis
            </p>
            <FloatAxis value={midFloatForExterior(item.exterior)} />
          </Surface>

          <Surface className="p-4">
            <p className="mb-2 text-xs uppercase tracking-widest text-muted">
              Price history · 30 days
            </p>
            <PriceChart points={history} />
          </Surface>
        </div>

        {/* Right: identity + buy */}
        <div className="space-y-4">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {item.rarity && (
                <span
                  className="inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs capitalize"
                  style={{ color: rarityColor, borderColor: `${rarityColor}80` }}
                >
                  <span className="size-2 rounded-full bg-current" />
                  {item.rarity}
                </span>
              )}
              {item.exterior && <Badge>{item.exterior}</Badge>}
              {item.isStattrak && <Badge tone="signal">StatTrak™</Badge>}
              {item.isSouvenir && <Badge tone="positive">Souvenir</Badge>}
              {item.phase && <Badge>{item.phase}</Badge>}
            </div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              {item.weapon && item.skinName ? (
                <>
                  {item.weapon}{" "}
                  <span className="text-muted">| {item.skinName}</span>
                </>
              ) : (
                item.name
              )}
            </h1>
          </div>

          <Surface className="space-y-4 p-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted">
                  Our price
                </p>
                {item.sellPrice != null ? (
                  <Money
                    usd={item.sellPrice}
                    className="text-3xl font-semibold"
                  />
                ) : (
                  <span className="text-3xl text-muted">—</span>
                )}
              </div>
              {item.steamPrice != null && (
                <div className="text-right">
                  <p className="text-xs text-muted">Steam</p>
                  <span className="num text-sm text-muted line-through">
                    <Money usd={item.steamPrice} />
                  </span>
                  {discountPct != null && discountPct > 0 && (
                    <div className="mt-1">
                      <Badge tone="positive">−{discountPct}% vs Steam</Badge>
                    </div>
                  )}
                </div>
              )}
            </div>

            {item.isAvailable && item.sellPrice != null ? (
              <>
                <BuyButton
                  marketHashName={item.marketHashName}
                  price={item.sellPrice}
                  state={buyState}
                />
                <p className="text-center text-xs text-muted">
                  Charged in USD from your Floatline balance. Delivered to your
                  Steam inventory in minutes.
                </p>
                {item.count <= 3 && (
                  <p className="text-center text-xs text-negative">
                    Only {item.count} in stock at this price.
                  </p>
                )}
              </>
            ) : (
              <div className="rounded border border-border bg-surface-2 px-3 py-4 text-center text-sm text-muted">
                Temporarily unavailable at this wear.
              </div>
            )}
          </Surface>

          {variants.length > 0 && (
            <Surface className="p-4">
              <p className="mb-2 text-xs uppercase tracking-widest text-muted">
                Other wears
              </p>
              <div className="space-y-1">
                {variants.map((v) => (
                  <Link
                    key={v.marketHashName}
                    href={`/item/${itemSlug(v.marketHashName)}`}
                    className={cn(
                      "flex items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-surface-2",
                      !v.isAvailable && "opacity-50",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <Badge>{v.exterior ?? "—"}</Badge>
                      {v.isStattrak && (
                        <span className="text-xs text-signal">ST</span>
                      )}
                    </span>
                    {v.sellPrice != null ? (
                      <Money usd={v.sellPrice} className="text-sm" />
                    ) : (
                      <span className="text-xs text-muted">out of stock</span>
                    )}
                  </Link>
                ))}
              </div>
            </Surface>
          )}
        </div>
      </div>

      {similar.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 font-display text-lg font-semibold">
            Similar items
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {similar.map((s) => (
              <ItemCard key={s.marketHashName} item={s} />
            ))}
          </div>
        </section>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
