"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

type Category = { id: string; name: string };

export function CategoryAssign({
  collectionId,
  initialCategoryId,
  categories,
}: {
  collectionId: string;
  initialCategoryId: string | null;
  categories: Category[];
}) {
  const [selected, setSelected] = useState<string | null>(initialCategoryId);
  const [saved, setSaved] = useState(false);

  const update = api.collection.update.useMutation({
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const handleChange = (val: string | null) => {
    setSelected(val);
    update.mutate({ id: collectionId, categoryId: val });
  };

  return (
    <div className="flex flex-col gap-2">
      <select
        value={selected ?? ""}
        onChange={(e) => handleChange(e.target.value || null)}
        className="border border-[color:var(--color-grey-300)] px-3 py-2 font-mono text-[11px] text-[color:var(--color-ink)] bg-[color:var(--color-paper)] focus:outline-none focus:border-[color:var(--color-ink)] w-full"
      >
        <option value="">— Sin categoría —</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      {saved && (
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-green-600">
          ✓ Guardado
        </span>
      )}
    </div>
  );
}
