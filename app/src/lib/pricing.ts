export type DiscountTier = {
  minQty: number;
  kind: "fixed" | "percent";
  value: number; // ARS price for "fixed", percentage 0–100 for "percent"
};

// Accepts both new format and legacy { minQty, priceEach } and normalizes.
export function parseTiers(raw: unknown): DiscountTier[] {
  if (!Array.isArray(raw)) return [];
  return (raw as unknown[])
    .map((t): DiscountTier | null => {
      if (typeof t !== "object" || t === null) return null;
      const obj = t as Record<string, unknown>;
      if (typeof obj.minQty !== "number") return null;

      // Legacy format: { minQty, priceEach }
      if (typeof obj.priceEach === "number" && typeof obj.kind !== "string") {
        return { minQty: obj.minQty, kind: "fixed", value: obj.priceEach };
      }

      if (
        (obj.kind === "fixed" || obj.kind === "percent") &&
        typeof obj.value === "number"
      ) {
        return { minQty: obj.minQty, kind: obj.kind, value: obj.value };
      }

      return null;
    })
    .filter((t): t is DiscountTier => t !== null)
    .sort((a, b) => a.minQty - b.minQty);
}

/** Returns the effective per-photo price for a given quantity. */
export function calcEffectivePricePerPhoto(
  qty: number,
  basePrice: number,
  tiers: DiscountTier[],
): number {
  const sorted = [...tiers].sort((a, b) => b.minQty - a.minQty);
  for (const tier of sorted) {
    if (qty >= tier.minQty) {
      if (tier.kind === "percent") {
        const pct = Math.max(0, Math.min(100, tier.value));
        return Math.max(0, basePrice * (1 - pct / 100));
      }
      return Math.max(0, tier.value);
    }
  }
  return basePrice;
}

/** Returns a short human label for a tier (e.g. "$1500 c/u" or "20% off"). */
export function tierLabel(tier: DiscountTier): string {
  if (tier.kind === "percent") return `${Math.round(tier.value)}% off`;
  return `$${Math.round(tier.value).toLocaleString("es-AR")} c/u`;
}
