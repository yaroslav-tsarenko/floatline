import Link from "next/link";

import { FloatAxis } from "@/components/float-axis";
import { Money } from "@/components/money";
import { SkinImage } from "@/components/skin-image";
import { Badge } from "@/components/ui/badge";
import { Surface } from "@/components/ui/surface";
import { itemSlug } from "@/lib/catalog/slug";
import type { CatalogItem } from "@/lib/catalog/queries";
import { cn } from "@/lib/cn";
import { midFloatForExterior } from "@/lib/cs2/float";

function displayName(item: Pick<CatalogItem, "weapon" | "skinName" | "name">) {
  if (item.weapon && item.skinName) return `${item.weapon} | ${item.skinName}`;
  return item.name;
}

export function ItemCard({
  item,
  priority = false,
}: {
  item: CatalogItem;
  priority?: boolean;
}) {
  const discountPct =
    item.discount != null ? Math.round(item.discount * 100) : null;
  const rarityColor = item.rarityColor ?? undefined;

  return (
    <Link
      href={`/item/${itemSlug(item.marketHashName)}`}
      className="group block focus-visible:outline-none"
    >
      <Surface
        className={cn(
          "flex h-full flex-col overflow-hidden transition-[border-color,transform]",
          "group-hover:-translate-y-0.5 group-focus-visible:-translate-y-0.5",
        )}
        style={rarityColor ? { borderColor: `${rarityColor}55` } : undefined}
      >
        <div className="relative">
          <SkinImage
            imageHash={item.imageHash}
            name={displayName(item)}
            rarityColor={item.rarityColor}
            priority={priority}
            className="aspect-[4/3] w-full"
          />
          {rarityColor && (
            <span
              className="absolute inset-x-0 top-0 h-0.5"
              style={{ backgroundColor: rarityColor }}
              aria-hidden
            />
          )}
          <div className="absolute left-1.5 top-1.5 flex gap-1">
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
          {discountPct != null && discountPct > 0 && (
            <div className="absolute bottom-1.5 right-1.5">
              <Badge tone="positive">−{discountPct}%</Badge>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2 p-3">
          <FloatAxis value={midFloatForExterior(item.exterior)} variant="mini" />
          <p className="line-clamp-2 min-h-[2.5em] text-sm leading-tight">
            {displayName(item)}
          </p>

          <div className="mt-auto flex items-center justify-between">
            {item.exterior ? (
              <Badge>{item.exterior}</Badge>
            ) : (
              <span className="text-[10px] text-muted">—</span>
            )}
            {item.count > 0 && item.count <= 3 && (
              <span className="text-[10px] text-negative">
                {item.count} left
              </span>
            )}
          </div>

          <div className="flex items-baseline justify-between gap-2">
            {item.sellPrice != null ? (
              <Money usd={item.sellPrice} className="text-base font-medium" />
            ) : (
              <span className="text-sm text-muted">—</span>
            )}
            {item.steamPrice != null && (
              <span className="flex items-baseline gap-1 text-xs text-muted">
                <span className="line-through">
                  <Money usd={item.steamPrice} />
                </span>
                {discountPct != null && discountPct > 0 && (
                  <span className="text-positive">−{discountPct}% vs Steam</span>
                )}
              </span>
            )}
          </div>
        </div>
      </Surface>
    </Link>
  );
}
