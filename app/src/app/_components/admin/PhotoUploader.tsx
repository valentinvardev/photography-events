"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { StorageBar } from "./StorageBar";

type UploadStatus = "pending" | "uploading" | "done" | "error";
type OcrStatus = "idle" | "queued" | "processing" | "found" | "not-found" | "error";

const VIDEO_RE = /^video\//;

function isVideoFile(file: File) {
  return VIDEO_RE.test(file.type) || /\.(mp4|mov|avi|webm|mkv|m4v)$/i.test(file.name);
}

type FileEntry = {
  id: string;
  file: File;
  isVideo: boolean;
  status: UploadStatus;
  previewUrl: string;
  errorMsg?: string;
  visible: boolean;
  photoId?: string;
  ocrStatus: OcrStatus;
  bib?: string;
  ocrSource?: string;
};

const ROW_HEIGHT = 60;
const VISIBLE_ROWS = 4;
const POLL_INTERVAL_MS = 4_000;
const POLL_MAX_ATTEMPTS = 30;
const UPLOAD_CONCURRENCY = 3;
const UPLOAD_MAX_RETRIES = 3;

// ── Status indicator ──────────────────────────────────────────────────────────

function StatusDot({ status }: { status: UploadStatus }) {
  if (status === "done") return (
    <span className="font-mono text-[10px] text-[#16a34a] shrink-0">✓</span>
  );
  if (status === "uploading") return (
    <div className="w-3 h-3 border border-[color:var(--color-grey-300)] border-t-[color:var(--color-ink)] rounded-full animate-spin shrink-0" />
  );
  if (status === "error") return (
    <span className="font-mono text-[10px] text-[color:var(--color-safelight)] shrink-0">✗</span>
  );
  return <div className="w-1.5 h-1.5 rounded-full bg-[color:var(--color-grey-300)] shrink-0 mt-0.5" />;
}

function OcrBadge({ status, bib, ocrSource }: { status: OcrStatus; bib?: string; ocrSource?: string }) {
  if (status === "idle") return null;
  if (status === "queued") return (
    <span className="font-mono text-[9px] uppercase tracking-[0.10em] text-[color:var(--color-grey-400)]">
      OCR en cola
    </span>
  );
  if (status === "processing") return (
    <span className="font-mono text-[9px] uppercase tracking-[0.10em] text-[color:var(--color-grey-500)] flex items-center gap-1">
      <div className="w-2 h-2 border border-[color:var(--color-grey-300)] border-t-[color:var(--color-ink)] rounded-full animate-spin" />
      Leyendo dorsal…
    </span>
  );
  if (status === "found" && bib) {
    const bibs = bib.split(",").map((b) => b.trim()).filter(Boolean);
    return (
      <span className="font-mono text-[9px] font-bold text-[color:var(--color-ink)]" title={ocrSource ?? undefined}>
        {bibs.map((b) => `#${b}`).join(" · ")}
      </span>
    );
  }
  if (status === "not-found") return (
    <span className="font-mono text-[9px] text-[color:var(--color-grey-300)]">Sin dorsal</span>
  );
  if (status === "error") return (
    <span className="font-mono text-[9px] text-[color:var(--color-safelight)]">OCR falló</span>
  );
  return null;
}

function FileRow({ entry }: { entry: FileEntry }) {
  return (
    <div
      className="flex items-center gap-3 px-3 py-2 border border-[color:var(--color-grey-200)]"
      style={{
        opacity: entry.visible ? 1 : 0,
        transform: entry.visible ? "translateY(0)" : "translateY(-6px)",
        transition: "opacity 0.3s ease, transform 0.3s ease",
        borderColor: entry.status === "error"
          ? "var(--color-safelight)"
          : entry.ocrStatus === "found"
          ? "var(--color-ink)"
          : entry.status === "done"
          ? "var(--color-grey-300)"
          : "var(--color-grey-200)",
      }}
    >
      <div className="w-9 h-9 overflow-hidden flex-shrink-0 relative bg-[color:var(--color-grey-100)]">
        {entry.isVideo ? (
          <div className="w-full h-full flex items-center justify-center bg-[color:var(--color-grey-200)]">
            <svg className="w-4 h-4 text-[color:var(--color-grey-500)]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        ) : (
          <img src={entry.previewUrl} alt={entry.file.name} className="w-full h-full object-cover" />
        )}
        {entry.status === "uploading" && (
          <div className="absolute inset-0 animate-pulse bg-[color:var(--color-ink)]/10" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-mono text-[10px] text-[color:var(--color-ink)] truncate">{entry.file.name}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <p className="font-mono text-[9px] uppercase tracking-[0.10em]" style={{
            color: entry.status === "uploading" ? "var(--color-ink)"
              : entry.status === "done" ? "#16a34a"
              : entry.status === "error" ? "var(--color-safelight)"
              : "var(--color-grey-400)",
          }}>
            {entry.status === "uploading" ? "Subiendo…"
              : entry.status === "done" ? (entry.isVideo ? "Video subido" : "Subida")
              : entry.status === "error" ? (entry.errorMsg ?? "Error")
              : "En cola"}
          </p>
          {entry.status === "done" && (
            <OcrBadge status={entry.ocrStatus} bib={entry.bib} ocrSource={entry.ocrSource} />
          )}
        </div>
      </div>
      <StatusDot status={entry.status} />
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function PhotoUploader({ collectionId }: { collectionId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const bulkAdd = api.photo.bulkAdd.useMutation({ onSuccess: () => router.refresh() });
  const getS3UploadUrl = api.photo.getS3UploadUrl.useMutation();

  const updateEntry = useCallback((id: string, patch: Partial<FileEntry>) =>
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e))), []);

  const pollBib = useCallback(async (entryId: string, photoId: string) => {
    updateEntry(entryId, { ocrStatus: "processing" });
    for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      try {
        const res = await fetch(`/api/ocr-status?photoId=${photoId}`);
        if (!res.ok) continue;
        const data = await res.json() as { bib: string | null };
        if (data.bib) {
          updateEntry(entryId, { ocrStatus: "found", bib: data.bib });
          router.refresh();
          return;
        }
      } catch {
        // keep polling
      }
    }
    updateEntry(entryId, { ocrStatus: "not-found" });
    router.refresh();
  }, [updateEntry, router]);

  const startOcrPolling = useCallback((entryId: string, photoId: string) => {
    updateEntry(entryId, { photoId, ocrStatus: "processing" });
    void pollBib(entryId, photoId);
  }, [updateEntry, pollBib]);

  const handleFiles = async (files: FileList) => {
    if (!files.length) return;
    setGlobalError(null);

    const HEIC_RE = /\.(heic|heif)$/i;
    const allFiles = Array.from(files);
    const heicCount = allFiles.filter((f) => HEIC_RE.test(f.name) || f.type === "image/heic" || f.type === "image/heif").length;
    const validFiles = allFiles.filter((f) => !HEIC_RE.test(f.name) && f.type !== "image/heic" && f.type !== "image/heif");

    if (heicCount > 0 && validFiles.length === 0) {
      setGlobalError("Las fotos HEIC no son compatibles. Convertí a JPG antes de subir.");
      return;
    }
    if (heicCount > 0) {
      setGlobalError(`Se ignoraron ${heicCount} foto${heicCount !== 1 ? "s" : ""} HEIC.`);
    }
    if (!validFiles.length) return;

    const newEntries: FileEntry[] = validFiles.map((file, i) => ({
      id: `${Date.now()}-${i}`,
      file,
      isVideo: isVideoFile(file),
      status: "pending",
      previewUrl: URL.createObjectURL(file),
      visible: false,
      ocrStatus: "idle",
    }));

    setEntries((prev) => [...newEntries, ...prev]);
    for (let i = 0; i < newEntries.length; i++) {
      const id = newEntries[i]!.id;
      setTimeout(() => updateEntry(id, { visible: true }), i * 60);
    }

    type UploadResult = { storageKey: string; filename: string; mimeType: string; fileSize: number; entryId: string; isVideo: boolean };

    const uploadOne = async (entry: FileEntry): Promise<UploadResult | null> => {
      updateEntry(entry.id, { status: "uploading" });
      const contentType = entry.file.type || (entry.isVideo ? "video/mp4" : "image/jpeg");

      for (let attempt = 1; attempt <= UPLOAD_MAX_RETRIES; attempt++) {
        try {
          const { uploadUrl, key } = await getS3UploadUrl.mutateAsync({
            collectionId,
            filename: entry.file.name,
            contentType,
          });
          const uploadRes = await fetch(uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": contentType },
            body: entry.file,
          });
          if (!uploadRes.ok) throw new Error(uploadRes.statusText);
          updateEntry(entry.id, { status: "done" });
          return { storageKey: key, filename: entry.file.name, mimeType: contentType, fileSize: entry.file.size, entryId: entry.id, isVideo: entry.isVideo };
        } catch (err) {
          // Non-retriable: limit reached
          const isForbidden = err != null && typeof err === "object" && "data" in err &&
            (err as { data?: { code?: string } }).data?.code === "FORBIDDEN";
          if (isForbidden) {
            const msg = err instanceof Error ? err.message : "Límite de fotos alcanzado";
            updateEntry(entry.id, { status: "error", errorMsg: msg });
            return null;
          }
          if (attempt < UPLOAD_MAX_RETRIES) {
            // exponential backoff: 1s, 2s, 4s
            await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
            continue;
          }
          const msg = err instanceof Error ? err.message : "Error de red";
          updateEntry(entry.id, { status: "error", errorMsg: `Intento ${attempt}/${UPLOAD_MAX_RETRIES}: ${msg}` });
          return null;
        }
      }
      return null;
    };

    const pendingPolls: { entryId: string; photoId: string }[] = [];

    for (let i = 0; i < newEntries.length; i += UPLOAD_CONCURRENCY) {
      const chunk = newEntries.slice(i, i + UPLOAD_CONCURRENCY);
      const results = await Promise.all(chunk.map(uploadOne));
      const chunkUploaded = results.filter((r): r is UploadResult => r !== null);
      if (chunkUploaded.length === 0) continue;

      void bulkAdd.mutateAsync({
        collectionId,
        photos: chunkUploaded.map(({ storageKey, filename, mimeType, fileSize }) => ({
          storageKey,
          filename,
          mimeType,
          fileSize,
        })),
      }).then((result) => {
        if (!result?.ids) return;
        for (let j = 0; j < result.ids.length; j++) {
          const photoId = result.ids[j];
          const uploaded = chunkUploaded[j];
          // Only poll OCR for images — videos don't have bib numbers
          if (photoId && uploaded?.entryId && !uploaded.isVideo) {
            pendingPolls.push({ entryId: uploaded.entryId, photoId });
          }
        }
      });
    }

    await new Promise((r) => setTimeout(r, 2_000));
    for (let i = 0; i < pendingPolls.length; i++) {
      const { entryId, photoId } = pendingPolls[i]!;
      setTimeout(() => startOcrPolling(entryId, photoId), i * 400);
    }
  };

  const isUploading = entries.some((e) => e.status === "uploading" || e.status === "pending");
  const doneCount = entries.filter((e) => e.status === "done").length;
  const errorCount = entries.filter((e) => e.status === "error").length;
  const allSettled = entries.length > 0 && !isUploading;
  const ocrDone = entries.filter((e) => e.ocrStatus === "found").length;

  const clearAll = () => {
    entries.forEach((e) => URL.revokeObjectURL(e.previewUrl));
    setEntries([]);
  };

  const sorted = [
    ...entries.filter((e) => e.status === "uploading" || e.status === "pending"),
    ...entries.filter((e) => e.status === "done" || e.status === "error"),
  ];
  const showCap = sorted.length > VISIBLE_ROWS;
  const capHeight = VISIBLE_ROWS * ROW_HEIGHT;

  return (
    <div>
      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files) void handleFiles(e.dataTransfer.files); }}
        className="border border-dashed border-[color:var(--color-grey-300)] hover:border-[color:var(--color-ink)] p-8 text-center cursor-pointer transition-colors"
        style={{
          borderColor: isDragging ? "var(--color-ink)" : undefined,
          background: isDragging ? "var(--color-grey-100)" : undefined,
        }}
      >
        <svg className="w-7 h-7 text-[color:var(--color-grey-300)] mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-grey-600)]">
          {isUploading ? "Subiendo archivos…" : "Arrastrá fotos o videos aquí"}
        </p>
        <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[color:var(--color-grey-400)] mt-1">
          {isUploading
            ? `${doneCount} de ${entries.length} subidos`
            : "JPG, PNG, MP4, MOV y más"}
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(e) => { if (e.target.files) void handleFiles(e.target.files); }}
      />

      {globalError && (
        <div className="mt-3 px-4 py-3 border-l-2 border-[color:var(--color-safelight)]">
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[color:var(--color-safelight)]">
            {globalError}
          </p>
        </div>
      )}

      {/* Summary */}
      {entries.length > 0 && (
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            {doneCount > 0 && (
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#16a34a]">
                ✓ {doneCount} subida{doneCount !== 1 ? "s" : ""}
              </span>
            )}
            {ocrDone > 0 && (
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[color:var(--color-ink)] font-bold">
                #{ocrDone} dorsal{ocrDone !== 1 ? "es" : ""} detectado{ocrDone !== 1 ? "s" : ""}
              </span>
            )}
            {errorCount > 0 && (
              <>
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[color:var(--color-safelight)]">
                  ✕ {errorCount} con error
                </span>
                {allSettled && (
                  <button
                    onClick={() => {
                      const failed = entries.filter((e) => e.status === "error");
                      const fileList = Object.assign(
                        failed.reduce<Record<number, File>>((acc, e, i) => { acc[i] = e.file; return acc; }, {}),
                        { length: failed.length, item: (i: number) => failed[i]?.file ?? null },
                      ) as unknown as FileList;
                      void handleFiles(fileList);
                    }}
                    className="font-mono text-[9px] uppercase tracking-[0.12em] text-[color:var(--color-safelight)] underline underline-offset-2 hover:opacity-70 transition-opacity"
                  >
                    Reintentar {errorCount}
                  </button>
                )}
              </>
            )}
            {isUploading && (
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[color:var(--color-grey-400)] flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse bg-[color:var(--color-ink)]" />
                Subiendo…
              </span>
            )}
          </div>
          {allSettled && (
            <button
              onClick={clearAll}
              className="font-mono text-[9px] uppercase tracking-[0.12em] text-[color:var(--color-grey-400)] hover:text-[color:var(--color-ink)] transition-colors"
            >
              Limpiar
            </button>
          )}
        </div>
      )}

      {/* Feed */}
      {sorted.length > 0 && (
        <div className="mt-3 relative">
          <div
            className="flex flex-col gap-1.5 overflow-hidden"
            style={{ maxHeight: showCap ? `${capHeight}px` : "none" }}
          >
            {sorted.map((entry) => <FileRow key={entry.id} entry={entry} />)}
          </div>
          {showCap && (
            <div
              className="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-end pb-2"
              style={{
                height: 80,
                background: "linear-gradient(to top, var(--color-paper) 20%, transparent 100%)",
                pointerEvents: "none",
              }}
            >
              <button
                onClick={() => setModalOpen(true)}
                className="font-mono text-[9px] uppercase tracking-[0.14em] border border-[color:var(--color-grey-300)] px-3 py-1.5 text-[color:var(--color-grey-600)] hover:border-[color:var(--color-ink)] hover:text-[color:var(--color-ink)] transition-colors"
                style={{ pointerEvents: "all" }}
              >
                Ver todas ({sorted.length})
              </button>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-[color:var(--color-grey-200)]">
        <StorageBar />
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
          style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full sm:max-w-md border border-[color:var(--color-grey-300)] bg-[color:var(--color-paper)] flex flex-col"
            style={{ maxHeight: "80vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[color:var(--color-grey-300)] flex-shrink-0">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)]">
                  Progreso de subida
                </p>
                <p className="font-mono text-[10px] text-[color:var(--color-ink)] mt-0.5">
                  {doneCount} subidas · {ocrDone} dorsales · {errorCount} errores
                </p>
              </div>
              <div className="flex items-center gap-2">
                {allSettled && (
                  <button
                    onClick={() => { clearAll(); setModalOpen(false); }}
                    className="font-mono text-[9px] uppercase tracking-[0.14em] text-[color:var(--color-grey-400)] hover:text-[color:var(--color-ink)] transition-colors"
                  >
                    Limpiar
                  </button>
                )}
                <button
                  onClick={() => setModalOpen(false)}
                  className="font-mono text-[14px] text-[color:var(--color-grey-400)] hover:text-[color:var(--color-ink)] transition-colors px-1"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 px-4 py-3 flex flex-col gap-1.5">
              {sorted.map((entry) => <FileRow key={entry.id} entry={entry} />)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
