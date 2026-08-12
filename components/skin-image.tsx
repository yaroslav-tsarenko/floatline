import Image from "next/image";

import { cn } from "@/lib/cn";

const STEAM_IMAGE_BASE =
  "https://community.steamstatic.com/economy/image";

/**
 * Build a Steam economy image URL from an icon hash. Returns null when the
 * stored value isn't a Steam hash (e.g. SIH's own CDN URLs, which are
 * hotlink-protected and 403), so the caller shows the fallback plate instead
 * of a broken image.
 */
export function steamImageUrl(
  imageHash: string,
  size = "360fx360f",
): string | null {
  if (/^https?:\/\//i.test(imageHash)) return null;
  return `${STEAM_IMAGE_BASE}/${imageHash}/${size}`;
}

/**
 * Skin artwork — the single soft element in the system. Skins ship with a
 * transparent background, so we lay them on a subtle rarity-tinted plate that
 * keeps dark skins visible on the light theme. Falls back to a labeled plate
 * when no image hash is available (e.g. seeded/dev data).
 */
export function SkinImage({
  imageHash,
  name,
  rarityColor,
  sizes,
  priority = false,
  className,
}: {
  imageHash: string | null;
  name: string;
  rarityColor: string | null;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const tint = rarityColor ?? "var(--muted)";
  const src = imageHash ? steamImageUrl(imageHash) : null;

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-plate",
        className,
      )}
      style={{
        backgroundImage: `radial-gradient(120% 90% at 50% 15%, ${tint}22, transparent 70%)`,
      }}
    >
      {src ? (
        <Image
          src={src}
          alt={name}
          fill
          sizes={sizes ?? "(max-width: 640px) 50vw, 200px"}
          priority={priority}
          className="object-contain p-2"
        />
      ) : (
        <span className="select-none text-[10px] uppercase tracking-widest text-muted">
          no image
        </span>
      )}
    </div>
  );
}
