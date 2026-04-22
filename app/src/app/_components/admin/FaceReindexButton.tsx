"use client";

import { useState } from "react";

export function FaceReindexButton({ collectionId, totalPhotos }: { collectionId: string; totalPhotos: number }) {
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [result, setResult] = useState<{ indexed: number; total: number } | null>(null);

  const run = async () => {
    setStatus("running");
    setResult(null);
    try {
      const res = await fetch("/api/face-reindex", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collectionId }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json() as { indexed: number; total: number };
      setResult(data);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <button
        onClick={run}
        disabled={status === "running"}
        className={`inline-flex items-center gap-2 px-3 py-1.5 border font-mono text-[10px] uppercase tracking-[0.14em] transition-colors disabled:opacity-40 ${
          status === "done"
            ? "border-[#16a34a] text-[#16a34a]"
            : status === "error"
            ? "border-[color:var(--color-safelight)] text-[color:var(--color-safelight)]"
            : "border-[color:var(--color-grey-300)] text-[color:var(--color-grey-700)] hover:border-[color:var(--color-ink)] hover:text-[color:var(--color-ink)]"
        }`}
      >
        {status === "running" ? (
          <>
            <div className="w-3 h-3 border border-[color:var(--color-grey-300)] border-t-[color:var(--color-ink)] rounded-full animate-spin" />
            Indexando {totalPhotos} fotos…
          </>
        ) : status === "done" ? (
          <>✓ {result?.indexed} fotos indexadas</>
        ) : status === "error" ? (
          <>
            ✗ Error al indexar ·{" "}
            <span className="underline underline-offset-2 cursor-pointer" onClick={run}>
              reintentar
            </span>
          </>
        ) : (
          <>Re-indexar reconocimiento facial</>
        )}
      </button>
      {status === "idle" && (
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[color:var(--color-grey-400)]">
          Usá esto si la búsqueda por selfie no encuentra fotos
        </span>
      )}
    </div>
  );
}
