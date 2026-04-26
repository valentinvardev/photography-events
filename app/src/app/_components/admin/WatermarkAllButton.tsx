"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

type RunState = "idle" | "running-lambda" | "running-local" | "done";

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
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // Stop polling when all are watermarked
  useEffect(() => {
    if (state === "running-lambda" && missingCount === 0 && progress.total > 0) {
      if (pollRef.current) clearInterval(pollRef.current);
      setState("done");
      setProgress((p) => ({ ...p, done: p.total }));
      router.refresh();
    }
    if (state === "running-lambda") {
      setProgress((p) => ({ ...p, done: p.total - missingCount }));
    }
  }, [missingCount, state, progress.total, router]);

  const runLambda = async (ids: string[]) => {
    setState("running-lambda");
    setProgress({ done: 0, total: ids.length });
    setFailed([]);

    // Fire all Lambdas at once
    const res = await fetch("/api/watermark/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collectionId }),
    });

    if (!res.ok) {
      // Lambda not configured — fall back to local
      setState("idle");
      await runLocal(ids);
      return;
    }

    // Poll every 3 seconds — Lambda updates DB as it completes
    pollRef.current = setInterval(() => { void refetch(); }, 3000);
  };

  const CONCURRENCY = 3;

  const runLocal = async (ids: string[]) => {
    setState("running-local");
    setFailed([]);
    setProgress({ done: 0, total: ids.length });

    const newFailed: string[] = [];
    let done = 0;

    for (let i = 0; i < ids.length; i += CONCURRENCY) {
      const chunk = ids.slice(i, i + CONCURRENCY);
      const results = await Promise.all(chunk.map(processOne));
      results.forEach((ok, j) => { if (!ok) newFailed.push(chunk[j]!); });
      done += chunk.length;
      setProgress({ done, total: ids.length });
    }

    setFailed(newFailed);
    setState("done");
    void refetch();
    router.refresh();
  };

  const run = async (ids: string[]) => {
    if (ids.length === 0) return;
    // Try Lambda first, fall back to local
    await runLambda(ids);
  };

  // Cleanup on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  if (state === "running-lambda" || state === "running-local") {
    const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;
    return (
      <div className="flex items-center gap-3">
        <span className="inline-block w-3 h-3 rounded-full border-2 border-amber-600 border-t-transparent animate-spin shrink-0" />
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-[10px] text-[color:var(--color-grey-500)]">
            {state === "running-lambda" ? "Lambda procesando…" : "Procesando…"} {progress.done}/{progress.total} ({pct}%)
          </span>
          <div className="w-32 h-0.5 bg-[color:var(--color-grey-200)]">
            <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
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
              onClick={() => void runLocal(failed)}
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
