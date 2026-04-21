"use client";

import { useRef, useState } from "react";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";

export function CoverUploader({
  collectionId,
  currentUrl,
}: {
  collectionId: string;
  currentUrl: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const update = api.collection.update.useMutation({ onSuccess: () => router.refresh() });

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Solo se permiten imágenes.");
      return;
    }
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setStatus("uploading");
    setErrorMsg("");

    const path = `covers/${collectionId}.${file.name.split(".").pop() ?? "jpg"}`;

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

      await update.mutateAsync({ id: collectionId, coverUrl: path });
      setStatus("done");
    } catch (e) {
      setStatus("error");
      setErrorMsg(e instanceof Error ? e.message : "Error desconocido.");
      URL.revokeObjectURL(localPreview);
      setPreview(null);
    }
  };

  const displayed = preview ?? currentUrl;

  return (
    <div>
      <label className="block text-xs mb-2" style={{ color: "#64748b" }}>
        Miniatura / portada de la colección
      </label>

      <div
        className="relative overflow-hidden rounded-xl border-2 border-dashed cursor-pointer transition-all group"
        style={{
          borderColor: status === "error" ? "#ef444450" : "#1e1e35",
          background: "#0a0a15",
          height: "160px",
        }}
        onClick={() => inputRef.current?.click()}
      >
        {displayed ? (
          <>
            <img
              src={displayed}
              alt="Portada"
              className="w-full h-full object-cover transition-opacity group-hover:opacity-75"
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
                style={{ background: "rgba(0,0,0,0.75)", color: "#fff" }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                Cambiar imagen
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <svg className="w-8 h-8" style={{ color: "#334155" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M13.5 12H21m-9 3.75h.008v.008H12v-.008zM3.75 20.25h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12.75c0 .828.672 1.5 1.5 1.5z" />
            </svg>
            <p className="text-xs" style={{ color: "#475569" }}>Hacé clic para subir una imagen</p>
          </div>
        )}

        {/* Uploading spinner */}
        {status === "uploading" && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#f59e0b40", borderTopColor: "#f59e0b" }} />
          </div>
        )}
      </div>

      {status === "done" && (
        <p className="text-xs mt-1.5" style={{ color: "#34d399" }}>Portada actualizada.</p>
      )}
      {errorMsg && (
        <p className="text-xs mt-1.5" style={{ color: "#f87171" }}>{errorMsg}</p>
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
