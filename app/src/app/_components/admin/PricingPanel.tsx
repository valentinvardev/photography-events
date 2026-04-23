"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import type { DiscountTier } from "~/lib/pricing";

function TierRow({
  tier,
  index,
  onChange,
  onRemove,
}: {
  tier: DiscountTier;
  index: number;
  onChange: (t: DiscountTier) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[color:var(--color-grey-500)] w-5 text-right">
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="flex-1 grid grid-cols-2 gap-2">
        <div>
          <label className="block font-mono text-[8px] uppercase tracking-[0.18em] text-[color:var(--color-grey-500)] mb-1">
            Desde (fotos)
          </label>
          <input
            type="number"
            min={1}
            value={tier.minQty}
            onChange={(e) => onChange({ ...tier, minQty: Math.max(1, parseInt(e.target.value) || 1) })}
            className="w-full border border-[color:var(--color-grey-300)] bg-[color:var(--color-paper)] px-3 py-1.5 font-mono text-[11px] text-[color:var(--color-ink)] focus:border-[color:var(--color-ink)] outline-none"
          />
        </div>
        <div>
          <label className="block font-mono text-[8px] uppercase tracking-[0.18em] text-[color:var(--color-grey-500)] mb-1">
            Precio c/u (ARS)
          </label>
          <input
            type="number"
            min={0}
            value={tier.priceEach}
            onChange={(e) => onChange({ ...tier, priceEach: Math.max(0, parseFloat(e.target.value) || 0) })}
            className="w-full border border-[color:var(--color-grey-300)] bg-[color:var(--color-paper)] px-3 py-1.5 font-mono text-[11px] text-[color:var(--color-ink)] focus:border-[color:var(--color-ink)] outline-none"
          />
        </div>
      </div>
      <button
        onClick={onRemove}
        className="font-mono text-[10px] text-[color:var(--color-grey-400)] hover:text-[color:var(--color-safelight)] transition-colors shrink-0"
      >
        [×]
      </button>
    </div>
  );
}

export function PricingPanel({
  collectionId,
  initialPricePerBib,
  initialPackPrice,
  initialTiers,
}: {
  collectionId: string;
  initialPricePerBib: number;
  initialPackPrice: number | null;
  initialTiers: DiscountTier[];
}) {
  const [pricePerBib, setPricePerBib] = useState(initialPricePerBib);
  const [packEnabled, setPackEnabled] = useState(initialPackPrice !== null);
  const [packPrice, setPackPrice] = useState(initialPackPrice ?? 0);
  const [tiers, setTiers] = useState<DiscountTier[]>(initialTiers);
  const [saved, setSaved] = useState(false);

  const update = api.collection.update.useMutation({
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const handleSave = () => {
    update.mutate({
      id: collectionId,
      pricePerBib,
      packPrice: packEnabled ? packPrice : null,
      discountTiers: tiers.length > 0 ? tiers : null,
    });
  };

  const addTier = () => {
    const last = tiers[tiers.length - 1];
    setTiers((prev) => [
      ...prev,
      { minQty: last ? last.minQty + 5 : 5, priceEach: last ? Math.max(0, last.priceEach - 500) : 0 },
    ]);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Base price */}
      <div>
        <label className="block font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mb-2">
          Precio base por foto (ARS)
        </label>
        <input
          type="number"
          min={0}
          value={pricePerBib}
          onChange={(e) => setPricePerBib(Math.max(0, parseFloat(e.target.value) || 0))}
          className="w-full border border-[color:var(--color-grey-300)] bg-[color:var(--color-paper)] px-4 py-2.5 font-display italic text-[22px] text-[color:var(--color-ink)] focus:border-[color:var(--color-ink)] outline-none"
        />
      </div>

      <div className="h-px bg-[color:var(--color-grey-300)]" />

      {/* Discount tiers */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)]">
            Descuentos progresivos
          </p>
          <button
            onClick={addTier}
            className="font-mono text-[9px] uppercase tracking-[0.18em] text-[color:var(--color-ink)] border border-[color:var(--color-grey-300)] px-3 py-1.5 hover:border-[color:var(--color-ink)] transition-colors"
          >
            + Nivel
          </button>
        </div>
        {tiers.length === 0 ? (
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[color:var(--color-grey-400)]">
            Sin descuentos configurados
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {tiers.map((t, i) => (
              <TierRow
                key={i}
                tier={t}
                index={i}
                onChange={(updated) =>
                  setTiers((prev) => prev.map((x, xi) => (xi === i ? updated : x)))
                }
                onRemove={() => setTiers((prev) => prev.filter((_, xi) => xi !== i))}
              />
            ))}
          </div>
        )}
        {tiers.length > 0 && (
          <p className="mt-3 font-mono text-[8px] uppercase tracking-[0.14em] text-[color:var(--color-grey-400)]">
            El precio por foto aplica cuando el corredor tiene ≥ N fotos en su búsqueda
          </p>
        )}
      </div>

      <div className="h-px bg-[color:var(--color-grey-300)]" />

      {/* Pack price */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)]">
            Precio pack (todas las fotos)
          </p>
          <button
            onClick={() => setPackEnabled((v) => !v)}
            className={`font-mono text-[9px] uppercase tracking-[0.14em] px-3 py-1.5 border transition-colors ${
              packEnabled
                ? "border-[color:var(--color-ink)] bg-[color:var(--color-ink)] text-[color:var(--color-paper)]"
                : "border-[color:var(--color-grey-300)] text-[color:var(--color-grey-500)] hover:border-[color:var(--color-ink)]"
            }`}
          >
            {packEnabled ? "Activado" : "Desactivado"}
          </button>
        </div>
        {packEnabled && (
          <>
            <input
              type="number"
              min={0}
              value={packPrice}
              onChange={(e) => setPackPrice(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full border border-[color:var(--color-grey-300)] bg-[color:var(--color-paper)] px-4 py-2.5 font-display italic text-[22px] text-[color:var(--color-ink)] focus:border-[color:var(--color-ink)] outline-none"
            />
            <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.14em] text-[color:var(--color-grey-400)]">
              Precio fijo para comprar todas las fotos encontradas en la búsqueda
            </p>
          </>
        )}
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={update.isPending}
        className={`inline-flex items-center justify-center gap-2 px-5 py-3 border font-mono text-[10px] uppercase tracking-[0.18em] transition-colors disabled:opacity-40 ${
          saved
            ? "border-[#16a34a] text-[#16a34a]"
            : "border-[color:var(--color-ink)] hover:bg-[color:var(--color-ink)] hover:text-[color:var(--color-paper)]"
        }`}
      >
        {update.isPending ? "Guardando…" : saved ? "✓ Guardado" : "Guardar precios"}
      </button>
    </div>
  );
}
