"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

type RunState = "idle" | "running" | "done";

async function processOne(photoId: string): Promise<boolean> {
  try {
    const res = await fetch("/api/watermark", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoId }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function WatermarkAllButton({ collectionId }: { collectionId: string }) {
  const router = useRouter();
  const [state, setState] = useState<RunState>("idle");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [failed, setFailed] = useState<string[]>([]);

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

  const run = async (ids: string[]) => {
    if (ids.length === 0) return;
    setState("running");
    setFailed([]);
    setProgress({ done: 0, total: ids.length });

    const newFailed: string[] = [];
    for (let i = 0; i < ids.length; i++) {
      const ok = await processOne(ids[i]!);
      if (!ok) newFailed.push(ids[i]!);
      setProgress({ done: i + 1, total: ids.length });
      // Small delay to avoid overwhelming the server
      if (i < ids.length - 1) await new Promise((r) => setTimeout(r, 200));
    }

    setFailed(newFailed);
    setState("done");
    void refetch();
    router.refresh();
  };

  if (state === "running") {
    return (
      <div className="flex items-center gap-3">
        <span className="inline-block w-3 h-3 rounded-full border-2 border-amber-600 border-t-transparent animate-spin shrink-0" />
        <span className="font-mono text-[10px] text-[color:var(--color-grey-500)]">
          {progress.done}/{progress.total} procesadas
        </span>
      </div>
    );
  }

  if (state === "done") {
    return (
      <div className="flex items-center gap-3 flex-wrap">
        {failed.length === 0 ? (
          <span className="font-mono text-[10px] text-green-600 flex items-center gap-1.5">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Listo — {progress.total} procesadas
          </span>
        ) : (
          <>
            <span className="font-mono text-[10px] text-[color:var(--color-grey-500)]">
              {progress.total - failed.length}/{progress.total} ok
            </span>
            <button
              onClick={() => void run(failed)}
              className="px-2.5 py-1 border border-red-300 font-mono text-[9px] uppercase tracking-[0.12em] text-red-600 hover:bg-red-50 transition-colors"
            >
              Reintentar {failed.length} fallidas
            </button>
          </>
        )}
        <button
          onClick={() => setState("idle")}
          className="font-mono text-[9px] text-[color:var(--color-grey-400)] hover:text-[color:var(--color-ink)] underline underline-offset-2 transition-colors"
        >
          volver
        </button>
      </div>
    );
  }

  // idle
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
          onClick={() => void run(allIds ?? [])}
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
        onClick={() => void run(unwatermarked ?? [])}
        className="px-2.5 py-1 border border-[color:var(--color-grey-300)] font-mono text-[9px] uppercase tracking-[0.12em] text-[color:var(--color-grey-600)] hover:border-[color:var(--color-ink)] hover:text-[color:var(--color-ink)] transition-colors"
      >
        Aplicar marca ({missingCount} sin marca)
      </button>
      <button
        onClick={() => void run(allIds ?? [])}
        className="font-mono text-[9px] uppercase tracking-[0.12em] text-[color:var(--color-grey-500)] hover:text-[color:var(--color-ink)] underline underline-offset-2 transition-colors"
      >
        Reaplicar todas ({totalCount})
      </button>
    </div>
  );
}
