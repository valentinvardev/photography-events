"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

export function WatermarkAllButton({ collectionId }: { collectionId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const { data: unwatermarked, refetch } = api.photo.listUnwatermarked.useQuery(
    { collectionId },
    { refetchOnWindowFocus: false },
  );

  const count = unwatermarked?.length ?? 0;

  const handleRun = async () => {
    if (!unwatermarked || unwatermarked.length === 0) return;
    setStatus("running");
    setProgress({ done: 0, total: unwatermarked.length });

    let done = 0;
    for (const photoId of unwatermarked) {
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
      setProgress({ done, total: unwatermarked.length });
    }

    setStatus("done");
    void refetch();
    router.refresh();
  };

  if (count === 0 && status === "idle") {
    return (
      <span className="text-xs text-green-600 flex items-center gap-1">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        Todas con marca de agua
      </span>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {status === "running" && (
        <span className="text-xs text-gray-500">
          {progress.done}/{progress.total} procesadas
        </span>
      )}
      {status === "done" && (
        <span className="text-xs text-green-600">✓ Listo</span>
      )}
      {status === "error" && (
        <span className="text-xs text-red-500">Algunos errores</span>
      )}
      {(status === "idle" || status === "error") && count > 0 && (
        <button
          onClick={() => void handleRun()}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all border"
          style={{ background: "#fef3c7", color: "#92400e", borderColor: "#fde68a" }}
        >
          Aplicar marca de agua ({count} sin marca)
        </button>
      )}
      {status === "running" && (
        <button
          disabled
          className="px-3 py-1.5 rounded-lg text-xs font-medium opacity-60 cursor-not-allowed border border-amber-200 bg-amber-50 text-amber-800"
        >
          <span className="inline-block w-3 h-3 rounded-full border-2 border-amber-600 border-t-transparent animate-spin mr-1" />
          Procesando...
        </button>
      )}
    </div>
  );
}
