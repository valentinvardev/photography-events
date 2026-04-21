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
    <div className="flex items-center gap-3 flex-wrap">
      <button
        onClick={run}
        disabled={status === "running"}
        className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border transition-all"
        style={{
          borderColor: status === "done" ? "#16a34a" : status === "error" ? "#dc2626" : "#e5e7eb",
          color: status === "done" ? "#16a34a" : status === "error" ? "#dc2626" : "#374151",
          background: status === "running" ? "#f9fafb" : "white",
          cursor: status === "running" ? "not-allowed" : "pointer",
        }}
      >
        {status === "running" ? (
          <>
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Indexando {totalPhotos} fotos…
          </>
        ) : status === "done" ? (
          <>✓ {result?.indexed} fotos indexadas</>
        ) : status === "error" ? (
          <>✗ Error al indexar · <span className="underline" onClick={run}>reintentar</span></>
        ) : (
          <>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Re-indexar reconocimiento facial
          </>
        )}
      </button>
      {status === "idle" && (
        <span className="text-xs text-gray-400">Usá esto si la búsqueda por selfie no encuentra fotos</span>
      )}
    </div>
  );
}
