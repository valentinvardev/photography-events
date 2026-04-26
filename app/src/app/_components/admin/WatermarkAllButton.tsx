"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

export function WatermarkAllButton({ collectionId }: { collectionId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [mode, setMode] = useState<"missing" | "all">("missing");

  const { data: unwatermarked, refetch } = api.photo.listUnwatermarked.useQuery(
    { collectionId },
    { refetchOnWindowFocus: false },
  );
  const { data: allIds } = api.photo.listAllIds.useQuery(
    { collectionId },
    { refetchOnWindowFocus: false },
  );

  const missingCount = unwatermarked?.length ?? 0;
  const totalCount = allIds?.length ?? 0;

  const handleRun = async (ids: string[]) => {
    if (ids.length === 0) return;
    setStatus("running");
    setProgress({ done: 0, total: ids.length });

    let done = 0;
    for (const photoId of ids) {
      try {
        const res = await fetch("/api/watermark", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photoId }),
        });
        if (!res.ok) console.error("Watermark failed for", photoId);
      } catch {
        console.error("Watermark error for", photoId);
      }
      done++;
      setProgress({ done, total: ids.length });
    }

    setStatus("done");
    void refetch();
    router.refresh();
  };

  if (status === "running") {
    return (
      <div className="flex items-center gap-3">
        <span className="inline-block w-3 h-3 rounded-full border-2 border-amber-600 border-t-transparent animate-spin" />
        <span className="font-mono text-[10px] text-[color:var(--color-grey-500)]">
          {progress.done}/{progress.total} procesadas
        </span>
      </div>
    );
  }

  if (status === "done") {
    return (
      <span className="font-mono text-[10px] text-green-600 flex items-center gap-1.5">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        Listo
      </span>
    );
  }

  if (missingCount === 0) {
    return (
      <div className="flex items-center gap-3">
        <span className="font-mono text-[10px] text-green-600 flex items-center gap-1.5">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Todas con marca de agua
        </span>
        <button
          onClick={() => void handleRun(allIds ?? [])}
          className="font-mono text-[9px] uppercase tracking-[0.12em] text-[color:var(--color-grey-500)] hover:text-[color:var(--color-ink)] underline underline-offset-2 transition-colors"
        >
          Reaplicar todas ({totalCount})
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        onClick={() => void handleRun(unwatermarked ?? [])}
        className="px-2.5 py-1 border border-[color:var(--color-grey-300)] font-mono text-[9px] uppercase tracking-[0.12em] text-[color:var(--color-grey-600)] hover:border-[color:var(--color-ink)] hover:text-[color:var(--color-ink)] transition-colors"
      >
        Aplicar marca de agua ({missingCount} sin marca)
      </button>
      <button
        onClick={() => void handleRun(allIds ?? [])}
        className="font-mono text-[9px] uppercase tracking-[0.12em] text-[color:var(--color-grey-500)] hover:text-[color:var(--color-ink)] underline underline-offset-2 transition-colors"
      >
        Reaplicar todas ({totalCount})
      </button>
    </div>
  );
}
