"use client";

import { useEffect, useRef, useState } from "react";

type Status = "idle" | "loading" | "uploading" | "deleting" | "done" | "error";

export function WatermarkSettings() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    void fetch("/api/watermark-settings")
      .then((r) => r.json() as Promise<{ url: string | null }>)
      .then(({ url }) => { setCurrentUrl(url); setStatus("idle"); })
      .catch(() => setStatus("idle"));
  }, []);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setMsg("Solo se permiten imágenes PNG/SVG con fondo transparente.");
      return;
    }
    const local = URL.createObjectURL(file);
    setPreview(local);
    setStatus("uploading");
    setMsg("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/watermark-settings", { method: "POST", body: form });
      if (!res.ok) throw new Error("Upload failed");
      const check = await fetch("/api/watermark-settings");
      const { url } = await check.json() as { url: string | null };
      setCurrentUrl(url);
      setPreview(null);
      setStatus("done");
      setMsg("Marca de agua guardada.");
    } catch {
      setStatus("error");
      setMsg("Error al subir el archivo.");
      URL.revokeObjectURL(local);
      setPreview(null);
    }
  };

  const handleDelete = async () => {
    setStatus("deleting");
    try {
      await fetch("/api/watermark-settings", { method: "DELETE" });
      setCurrentUrl(null);
      setPreview(null);
      setStatus("idle");
      setMsg("Marca de agua eliminada.");
    } catch {
      setStatus("error");
      setMsg("Error al eliminar.");
    }
  };

  const displayed = preview ?? currentUrl;
  const busy = status === "loading" || status === "uploading" || status === "deleting";

  return (
    <div className="flex flex-col gap-4">
      {/* Drop zone */}
      <div
        className="relative border border-dashed border-[color:var(--color-grey-300)] hover:border-[color:var(--color-ink)] cursor-pointer transition-colors overflow-hidden"
        style={{ height: 160, background: "var(--color-paper)" }}
        onClick={() => !busy && inputRef.current?.click()}
      >
        {status === "loading" ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-5 h-5 border border-[color:var(--color-grey-300)] border-t-[color:var(--color-ink)] rounded-full animate-spin" />
          </div>
        ) : displayed ? (
          <>
            {/* Transparency checker pattern */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: "linear-gradient(45deg, #e5e5e5 25%, transparent 25%), linear-gradient(-45deg, #e5e5e5 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e5e5 75%), linear-gradient(-45deg, transparent 75%, #e5e5e5 75%)",
                backgroundSize: "16px 16px",
                backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
              }}
            />
            <img src={displayed} alt="Watermark" className="relative w-full h-full object-contain p-6" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-[color:var(--color-ink)]/30">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-paper)]">
                Cambiar imagen
              </span>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <svg className="w-8 h-8 text-[color:var(--color-grey-300)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-grey-500)]">
              Subir PNG con transparencia
            </p>
          </div>
        )}

        {busy && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[color:var(--color-paper)]/80">
            <div className="w-5 h-5 border border-[color:var(--color-grey-300)] border-t-[color:var(--color-ink)] rounded-full animate-spin" />
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[color:var(--color-grey-500)]">
              {status === "uploading" ? "Subiendo…" : "Eliminando…"}
            </p>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/svg+xml,image/webp"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); e.target.value = ""; }}
      />

      <div className="flex items-center gap-3">
        <button
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-2 px-4 py-2.5 border border-[color:var(--color-ink)] font-mono text-[10px] uppercase tracking-[0.18em] hover:bg-[color:var(--color-ink)] hover:text-[color:var(--color-paper)] transition-colors disabled:opacity-40"
        >
          {currentUrl ? "Reemplazar" : "Subir marca de agua"}
        </button>
        {currentUrl && (
          <button
            onClick={handleDelete}
            disabled={busy}
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-safelight)] hover:underline underline-offset-4 disabled:opacity-40 transition-opacity"
          >
            Eliminar
          </button>
        )}
      </div>

      {msg && (
        <p className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: status === "error" ? "var(--color-safelight)" : "#16a34a" }}>
          {msg}
        </p>
      )}

      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[color:var(--color-grey-500)] border-l-2 border-[color:var(--color-grey-300)] pl-3 py-1">
        La marca de agua se aplica a los píxeles — no se puede quitar con DevTools.
      </p>
    </div>
  );
}
