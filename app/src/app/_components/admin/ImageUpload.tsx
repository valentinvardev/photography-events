"use client";

import { useRef, useState } from "react";

export function ImageUpload({
  value,
  onChange,
  storagePath,
  label = "Imagen",
}: {
  value: string | null;
  onChange: (path: string) => void;
  storagePath: string;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Solo se permiten imágenes.");
      return;
    }
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setStatus("uploading");
    setErrorMsg("");

    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${storagePath}.${ext}`;

    try {
      const signRes = await fetch("/api/uploads/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
      if (!signRes.ok) throw new Error("No se pudo obtener URL de subida.");
      const { signedUrl } = await signRes.json() as { signedUrl: string };

      const upRes = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!upRes.ok) throw new Error("Error al subir la imagen.");

      onChange(path);
      setStatus("done");
    } catch (e) {
      setStatus("error");
      setErrorMsg(e instanceof Error ? e.message : "Error desconocido.");
      URL.revokeObjectURL(localPreview);
      setPreview(null);
    }
  };

  const displayed = preview ?? (value?.startsWith("http") ? value : null);

  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)]">
        {label}
      </label>

      <div
        className="relative overflow-hidden border border-dashed border-[color:var(--color-grey-300)] cursor-pointer group hover:border-[color:var(--color-ink)] transition-colors"
        style={{ height: 120 }}
        onClick={() => inputRef.current?.click()}
      >
        {displayed ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayed}
              alt={label}
              className="w-full h-full object-cover transition-opacity group-hover:opacity-70"
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[color:var(--color-paper)] bg-[color:var(--color-ink)]/80 px-3 py-1.5">
                Cambiar imagen
              </span>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[color:var(--color-grey-400)]">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="font-mono text-[9px] uppercase tracking-[0.18em]">
              {status === "uploading" ? "Subiendo…" : "Subir imagen"}
            </p>
          </div>
        )}

        {status === "uploading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-[color:var(--color-paper)]/60">
            <div className="w-6 h-6 border border-[color:var(--color-grey-400)] border-t-[color:var(--color-ink)] rounded-full animate-spin" />
          </div>
        )}
      </div>

      {status === "done" && (
        <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-green-600">✓ Imagen guardada</p>
      )}
      {errorMsg && (
        <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-red-600">{errorMsg}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); }}
      />
    </div>
  );
}
