"use client";

import { api } from "~/trpc/react";

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function StorageBar() {
  const { data: storage } = api.photo.getStorageUsage.useQuery();
  const { data: photoCount } = api.photo.getTotalPhotoCount.useQuery();

  const storagePct = storage ? Math.min((storage.usedBytes / storage.limitBytes) * 100, 100) : 0;
  const countPct = photoCount ? Math.min((photoCount.count / photoCount.limit) * 100, 100) : 0;

  const storageColor = storagePct > 90 ? "var(--color-safelight)" : storagePct > 70 ? "#92400e" : "#16a34a";
  const countColor = countPct > 90 ? "var(--color-safelight)" : countPct > 70 ? "#92400e" : "#16a34a";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[color:var(--color-grey-500)]">
            Almacenamiento
          </span>
          <span className="font-mono text-[9px] text-[color:var(--color-grey-500)]">
            {storage ? `${formatBytes(storage.usedBytes)} / ${formatBytes(storage.limitBytes)}` : "Calculando…"}
          </span>
        </div>
        <div className="h-px bg-[color:var(--color-grey-200)] relative overflow-visible">
          <div
            className="absolute inset-y-0 left-0 transition-all duration-700"
            style={{ width: `${storagePct}%`, height: 2, top: -0.5, background: storageColor }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[color:var(--color-grey-500)]">
            Fotos
          </span>
          <span className="font-mono text-[9px]" style={{ color: countPct > 90 ? countColor : "var(--color-grey-500)" }}>
            {photoCount
              ? `${photoCount.count.toLocaleString()} / ${photoCount.limit.toLocaleString()}`
              : "Calculando…"}
          </span>
        </div>
        <div className="h-px bg-[color:var(--color-grey-200)] relative overflow-visible">
          <div
            className="absolute inset-y-0 left-0 transition-all duration-700"
            style={{ width: `${countPct}%`, height: 2, top: -0.5, background: countColor }}
          />
        </div>
      </div>
    </div>
  );
}
