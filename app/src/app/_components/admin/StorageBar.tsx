"use client";

import { api } from "~/trpc/react";

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function StorageBar() {
  const { data } = api.photo.getStorageUsage.useQuery();

  if (!data) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[color:var(--color-grey-500)]">
            Almacenamiento
          </span>
          <span className="font-mono text-[9px] text-[color:var(--color-grey-400)]">Calculando…</span>
        </div>
        <div className="h-px bg-[color:var(--color-grey-200)] animate-pulse" />
      </div>
    );
  }

  const pct = Math.min((data.usedBytes / data.limitBytes) * 100, 100);
  const barColor = pct > 90 ? "var(--color-safelight)" : pct > 70 ? "#92400e" : "#16a34a";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[color:var(--color-grey-500)]">
          Almacenamiento
        </span>
        <span className="font-mono text-[9px] text-[color:var(--color-grey-500)]">
          {formatBytes(data.usedBytes)} / {formatBytes(data.limitBytes)}
        </span>
      </div>
      <div className="h-px bg-[color:var(--color-grey-200)] relative overflow-visible">
        <div
          className="absolute inset-y-0 left-0 transition-all duration-700"
          style={{ width: `${pct}%`, height: 2, top: -0.5, background: barColor }}
        />
      </div>
    </div>
  );
}
