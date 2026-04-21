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
      <div
        className="relative rounded-xl border-2 border-dashed cursor-pointer transition-all group overflow-hidden"
        style={{ borderColor: status === "error" ? "#fecaca" : "#e2e8f0", background: "#f8fafc", height: "160px" }}
        onClick={() => !busy && inputRef.current?.click()}
      >
        {status === "loading" ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#bfdbfe", borderTopColor: "#2563eb" }} />
          </div>
        ) : displayed ? (
          <>
            <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)", backgroundSize: "16px 16px", backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px" }} />
            <img src={displayed} alt="Watermark" className="relative w-full h-full object-contain p-6 transition-opacity group-hover:opacity-75" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-xs font-medium px-3 py-1.5 rounded-lg" style={{ background: "rgba(0,0,0,0.75)", color: "#fff" }}>Cambiar imagen</span>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-xs text-gray-400">Subir PNG con transparencia</p>
          </div>
        )}
        {busy && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/70">
            <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#bfdbfe", borderTopColor: "#2563eb" }} />
            <p className="text-xs text-gray-500">{status === "uploading" ? "Subiendo..." : "Eliminando..."}</p>
          </div>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/png,image/svg+xml,image/webp" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); e.target.value = ""; }} />

      <div className="flex items-center gap-3">
        <button onClick={() => inputRef.current?.click()} disabled={busy}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl font-semibold text-white disabled:opacity-50 transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #1a3a6b, #2563eb)" }}>
          {currentUrl ? "Reemplazar" : "Subir marca de agua"}
        </button>
        {currentUrl && (
          <button onClick={handleDelete} disabled={busy}
            className="text-xs px-3 py-2 rounded-xl disabled:opacity-50 transition-all bg-red-50 text-red-500 hover:bg-red-100">
            Eliminar
          </button>
        )}
      </div>

      {msg && <p className="text-xs" style={{ color: status === "error" ? "#ef4444" : "#16a34a" }}>{msg}</p>}

      <div className="rounded-xl px-4 py-3 flex gap-3 bg-gray-50 border border-gray-100">
        <p className="text-xs leading-relaxed text-gray-500">
          La marca de agua se aplica directamente a los píxeles de la imagen — no se puede quitar con DevTools.
        </p>
      </div>
    </div>
  );
}
