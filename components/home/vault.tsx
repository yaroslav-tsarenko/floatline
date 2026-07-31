import Link from "next/link";

import { Money } from "@/components/money";
import { Reveal } from "@/components/motion/reveal";
import { SkinImage } from "@/components/skin-image";
import { Badge } from "@/components/ui/badge";
import { itemSlug } from "@/lib/catalog/slug";
import type { CatalogItem } from "@/lib/catalog/queries";

function displayName(item: CatalogItem): string {
  if (item.weapon && item.skinName) return `${item.weapon} | ${item.skinName}`;
  return item.name;
}

function VaultCard({ item, feature }: { item: CatalogItem; feature?: boolean }) {
  const color = item.rarityColor ?? "var(--signal)";
  const discountPct =
    item.discount != null ? Math.round(item.discount * 100) : null;

  return (
    <Link
      href={`/item/${itemSlug(item.marketHashName)}`}
      className="group relative block overflow-hidden rounded-lg border bg-surface transition-transform hover:-translate-y-1"
      style={{ borderColor: `${color}66` }}
    >
      {/* Intensified rarity glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-70 transition-opacity group-hover:opacity-100"
        style={{
          background: `radial-gradient(120% 80% at 50% 0%, ${color}33, transparent 65%)`,
        }}
        aria-hidden
      />
      {/* Sheen sweep on hover */}
      <div
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
        aria-hidden
      />

      <div className="relative">
        <span
          className="absolute inset-x-0 top-0 z-10 h-0.5"
          style={{ backgroundColor: color }}
          aria-hidden
        />
        <SkinImage
          imageHash={item.imageHash}
          name={displayName(item)}
          rarityColor={item.rarityColor}
          priority={feature}
          sizes={feature ? "(max-width: 1024px) 100vw, 40vw" : "(max-width: 1024px) 50vw, 20vw"}
          className={feature ? "aspect-[16/10] w-full" : "aspect-[4/3] w-full"}
        />
        <div className="absolute left-2 top-2 flex gap-1">
          {item.isStattrak && (
            <Badge tone="signal" className="text-[10px]">
              ST
            </Badge>
          )}
          {item.isSouvenir && (
            <Badge tone="positive" className="text-[10px]">
              SV
            </Badge>
          )}
        </div>
      </div>

      <div className="relative space-y-2 p-4">
        <p
          className="text-[11px] font-medium uppercase tracking-widest"
          style={{ color }}
        >
          {item.rarity ?? "grail"}
          {item.exterior ? ` · ${item.exterior}` : ""}
        </p>
        <p
          className={
            feature
              ? "font-display text-lg font-semibold leading-tight"
              : "line-clamp-2 text-sm leading-tight"
          }
        >
          {displayName(item)}
        </p>
        <div className="flex items-baseline justify-between gap-2 pt-1">
          {item.sellPrice != null ? (
            <Money
              usd={item.sellPrice}
              className={feature ? "text-2xl font-semibold" : "text-lg font-medium"}
            />
          ) : (
            <span className="text-muted">—</span>
          )}
          {item.steamPrice != null && discountPct != null && discountPct > 0 && (
            <span className="text-xs text-positive">−{discountPct}% vs Steam</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function Vault({ items }: { items: CatalogItem[] }) {
  if (items.length === 0) return null;
  const [feature, ...rest] = items;

  return (
    <Reveal>
      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-signal">
              Rare · high-tier
            </p>
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              The Vault
            </h2>
          </div>
          <Link
            href="/catalog?min=1000&sort=price_desc"
            className="text-sm text-signal hover:underline"
          >
            View the vault →
          </Link>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <VaultCard item={feature} feature />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
            {rest.map((item) => (
              <VaultCard key={item.marketHashName} item={item} />
            ))}
          </div>
        </div>
      </section>
    </Reveal>
  );
}
