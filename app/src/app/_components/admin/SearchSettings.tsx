"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

export function SearchSettings({
  collectionId,
  initialBibSearchEnabled,
}: {
  collectionId: string;
  initialBibSearchEnabled: boolean;
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialBibSearchEnabled);

  const update = api.collection.update.useMutation({
    onSuccess: () => router.refresh(),
  });

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    update.mutate({ id: collectionId, bibSearchEnabled: next });
  };

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={toggle}
        disabled={update.isPending}
        className="flex items-start gap-3 text-left p-3 border border-[color:var(--color-grey-300)] hover:border-[color:var(--color-ink)] transition-colors disabled:opacity-50"
      >
        <div className="relative shrink-0 mt-0.5">
          <div
            className="w-9 h-5 transition-colors"
            style={{ background: enabled ? "var(--color-ink)" : "var(--color-grey-300)" }}
          >
            <div
              className="absolute top-0.5 w-4 h-4 bg-[color:var(--color-paper)] transition-[left]"
              style={{ left: enabled ? "18px" : "2px" }}
            />
          </div>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-ink)]">
            Búsqueda por dorsal
          </span>
          <span className="font-mono text-[9px] tracking-[0.04em] text-[color:var(--color-grey-500)] leading-relaxed">
            {enabled
              ? "Activada — los usuarios pueden buscar por número."
              : "Desactivada — solo búsqueda por selfie."}
          </span>
        </div>
      </button>
    </div>
  );
}
