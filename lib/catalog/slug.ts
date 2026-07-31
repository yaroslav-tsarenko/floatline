// The market_hash_name is the item's natural key. We encode it into a single
// URL segment rather than maintaining a separate slug column, so the mapping is
// lossless and reversible.
export function itemSlug(marketHashName: string): string {
  return encodeURIComponent(marketHashName);
}

export function slugToMarketHashName(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}
