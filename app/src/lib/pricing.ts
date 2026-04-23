export type DiscountTier = { minQty: number; priceEach: number };

export function parseTiers(raw: unknown): DiscountTier[] {
  if (!Array.isArray(raw)) return [];
  return (raw as unknown[])
    .filter(
      (t): t is DiscountTier =>
        typeof t === "object" &&
        t !== null &&
        typeof (t as Record<string, unknown>).minQty === "number" &&
        typeof (t as Record<string, unknown>).priceEach === "number",
    )
    .sort((a, b) => a.minQty - b.minQty);
}

/** Returns the effective per-photo price given total photos found in search */
export function calcEffectivePricePerPhoto(
  totalPhotosInSearch: number,
  basePrice: number,
  tiers: DiscountTier[],
): number {
  const sorted = [...tiers].sort((a, b) => b.minQty - a.minQty);
  for (const tier of sorted) {
    if (totalPhotosInSearch >= tier.minQty) return tier.priceEach;
  }
  return basePrice;
}
