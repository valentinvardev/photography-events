"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";

type Photo = { id: string; filename: string; url: string; mimeType?: string | null };

function isVideoItem(photo: Photo) {
  if (photo.mimeType) return photo.mimeType.startsWith("video/");
  return /\.(mp4|mov|avi|webm|mkv|m4v)$/i.test(photo.filename);
}

type Props = {
  token: string;
  bibNumber: string | null;
  collectionTitle: string;
  buyerName: string | null;
  isPublicInit: boolean;
  photos: Photo[];
  suggestions: unknown[];
};

const PAGE_SIZE = 24;

export function PhotoGallery({
  token,
  bibNumber,
  collectionTitle,
  buyerName,
  photos,
  suggestions: _,
}: Props) {
  void _;
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [showDownloadPanel, setShowDownloadPanel] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const isTouchDevice = () =>
    typeof navigator !== "undefined" && navigator.maxTouchPoints > 1;

  const visiblePhotos = photos.slice(0, visibleCount);
  const hasMore = visibleCount < photos.length;

  const closeLightbox = useCallback(() => setLightboxIdx(null), []);
  const prevPhoto = useCallback(
    () =>
      setLightboxIdx((i) => (i !== null ? (i - 1 + photos.length) % photos.length : null)),
    [photos.length],
  );
  const nextPhoto = useCallback(
    () => setLightboxIdx((i) => (i !== null ? (i + 1) % photos.length : null)),
    [photos.length],
  );

  useEffect(() => {
    if (lightboxIdx === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prevPhoto();
      if (e.key === "ArrowRight") nextPhoto();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = prev;
    };
  }, [lightboxIdx, closeLightbox, prevPhoto, nextPhoto]);

  const toggleSelect = (i: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };
  const selectAll = () => setSelected(new Set(photos.map((_, i) => i)));
  const clearSelection = () => setSelected(new Set());
  const exitSelectMode = () => {
    setSelectMode(false);
    clearSelection();
  };

  // Fetches from same-origin proxy → blob URL → forced download.
  // Blob URLs with a.download always trigger a save dialog regardless of content type.
  const downloadPhoto = async (photoId: string, filename: string) => {
    const proxyUrl = `/api/download/file?token=${encodeURIComponent(token)}&photoId=${encodeURIComponent(photoId)}`;
    const res = await fetch(proxyUrl);
    if (!res.ok) return;
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000);
  };

  const downloadPhotos = async (indices: number[]) => {
    for (let i = 0; i < indices.length; i++) {
      const photo = photos[indices[i]!]!;
      await downloadPhoto(photo.id, photo.filename);
      if (i < indices.length - 1) await new Promise((r) => setTimeout(r, 300));
    }
  };

  const handleDownloadSelected = () => void downloadPhotos(Array.from(selected).sort());
  const handleDownloadAll = async () => {
    if (isTouchDevice()) {
      setShowDownloadPanel(true);
      return;
    }
    setDownloadingAll(true);
    await downloadPhotos(photos.map((_, i) => i));
    setDownloadingAll(false);
  };

  const handleShare = () => {
    void navigator.clipboard.writeText(window.location.href).then(() => {
      setShareState("copied");
      setTimeout(() => setShareState("idle"), 2500);
    });
  };

  const currentPhoto = lightboxIdx !== null ? photos[lightboxIdx] : null;

  return (
    <main className="min-h-screen bg-[color:var(--color-paper)] text-[color:var(--color-ink)]">
      {/* ── Editorial header ────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-[color:var(--color-paper)]/90 backdrop-blur-xl border-b border-[color:var(--color-grey-300)]">
        <div className="max-w-[1600px] mx-auto px-6 md:px-10 h-16 flex items-center gap-6">
          <Link
            href="/"
            className="link-draw font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-700)] hover:text-[color:var(--color-ink)] transition-colors flex items-center gap-2 shrink-0"
          >
            <span aria-hidden>←</span>
            Inicio
          </Link>
          <span className="font-display italic text-[18px] hidden sm:inline shrink-0">
            Ivana Maritano
          </span>
          <span
            className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] truncate flex-1"
            title={collectionTitle}
          >
            · {collectionTitle}
          </span>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleShare}
              className={`group inline-flex items-center gap-2 border px-3 py-2 transition-colors ${
                shareState === "copied"
                  ? "border-[color:var(--color-ink)] bg-[color:var(--color-ink)] text-[color:var(--color-paper)]"
                  : "border-[color:var(--color-ink)] text-[color:var(--color-ink)] hover:bg-[color:var(--color-ink)] hover:text-[color:var(--color-paper)]"
              }`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <circle cx="18" cy="5" r="3"/>
                <circle cx="6" cy="12" r="3"/>
                <circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              <span className="font-mono text-[10px] uppercase tracking-[0.22em]">
                {shareState === "copied" ? "Copiado" : "Compartir"}
              </span>
            </button>
            <button
              onClick={handleDownloadAll}
              disabled={downloadingAll}
              className="group inline-flex items-center gap-2 border border-[color:var(--color-ink)] bg-[color:var(--color-ink)] text-[color:var(--color-paper)] px-4 py-2 hover:bg-transparent hover:text-[color:var(--color-ink)] transition-colors disabled:opacity-40"
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.22em]">
                {downloadingAll ? "Descargando…" : "Descargar todo"}
              </span>
              <span className="font-mono text-[10px] tracking-[0.22em] hidden sm:inline transition-transform group-hover:translate-y-0.5">
                ↓
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero block ──────────────────────────────────── */}
      <section className="px-6 md:px-10 pt-16 md:pt-24 pb-12">
        <div className="max-w-[1600px] mx-auto grid grid-cols-12 gap-6">
          <p className="col-span-12 md:col-span-3 eyebrow">(00) — Tu archivo</p>

          <div className="col-span-12 md:col-span-9 md:col-start-4">
            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="font-display italic font-light leading-[0.92] tracking-[-0.04em]"
              style={{ fontSize: "clamp(48px, 9vw, 140px)" }}
            >
              {bibNumber ? (
                <>
                  Dorsal{" "}
                  <span className="not-italic font-display">#{bibNumber}.</span>
                </>
              ) : (
                <>Tus fotos.</>
              )}
            </motion.h1>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.18 }}
              className="mt-8 grid grid-cols-3 gap-6 max-w-2xl"
            >
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mb-1">
                  Capturas
                </p>
                <p className="font-display italic text-[28px] leading-tight">
                  {String(photos.length).padStart(3, "0")}
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mb-1">
                  Resolución
                </p>
                <p className="font-display italic text-[28px] leading-tight">HD</p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mb-1">
                  Marca de agua
                </p>
                <p className="font-display italic text-[28px] leading-tight">no</p>
              </div>
            </motion.div>
            {buyerName && buyerName !== "public@system" && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-8 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)]"
              >
                Comprador · {buyerName}
              </motion.p>
            )}
          </div>
        </div>
      </section>

      {/* ── Toolbar ─────────────────────────────────────── */}
      <div className="border-y border-[color:var(--color-grey-300)] sticky top-16 z-20 bg-[color:var(--color-paper)]/90 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-6 md:px-10 h-12 flex items-center justify-between gap-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)]">
            {String(photos.length).padStart(3, "0")} {photos.length === 1 ? "foto" : "fotos"}
            {selectMode && selected.size > 0 && (
              <span className="text-[color:var(--color-ink)]">
                {" "}
                · {selected.size} seleccionada{selected.size !== 1 ? "s" : ""}
              </span>
            )}
          </p>

          <div className="flex items-center gap-2">
            {!selectMode ? (
              <button
                onClick={() => setSelectMode(true)}
                className="inline-flex items-center gap-1.5 border border-[color:var(--color-ink)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-ink)] hover:bg-[color:var(--color-ink)] hover:text-[color:var(--color-paper)] transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <polyline points="9 11 12 14 22 4"/>
                  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                </svg>
                Seleccionar
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={selected.size === photos.length ? clearSelection : selectAll}
                  className="inline-flex items-center border border-[color:var(--color-ink)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-ink)] hover:bg-[color:var(--color-ink)] hover:text-[color:var(--color-paper)] transition-colors"
                >
                  {selected.size === photos.length ? "Ninguna" : "Todas"}
                </button>
                <button
                  onClick={exitSelectMode}
                  className="inline-flex items-center border border-[color:var(--color-grey-400)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-600)] hover:border-[color:var(--color-ink)] hover:text-[color:var(--color-ink)] transition-colors"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Grid ────────────────────────────────────────── */}
      <div className="max-w-[1600px] mx-auto px-6 md:px-10 py-12 pb-32">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-3 gap-y-8">
          {visiblePhotos.map((photo, i) => {
            const isSelected = selected.has(i);
            return (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: Math.min(i * 0.02, 0.35),
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="group cursor-pointer"
                onClick={() => (selectMode ? toggleSelect(i) : setLightboxIdx(i))}
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mb-2 flex items-center justify-between">
                  <span>F. {String(i + 1).padStart(3, "0")}</span>
                  {selectMode && (
                    <span
                      className={`inline-block w-3 h-3 border ${
                        isSelected
                          ? "bg-[color:var(--color-ink)] border-[color:var(--color-ink)]"
                          : "border-[color:var(--color-grey-500)]"
                      }`}
                      aria-hidden
                    />
                  )}
                </p>
                <div
                  className={`relative overflow-hidden bg-[color:var(--color-grey-300)] transition-all ${
                    isSelected ? "outline outline-2 outline-[color:var(--color-ink)]" : ""
                  }`}
                  style={{ aspectRatio: "1/1" }}
                >
                  {/* Viewfinder corners on hover */}
                  <span className="pointer-events-none absolute top-0 left-0 w-3 h-3 border-l border-t border-[color:var(--color-paper)] z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="pointer-events-none absolute top-0 right-0 w-3 h-3 border-r border-t border-[color:var(--color-paper)] z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="pointer-events-none absolute bottom-0 left-0 w-3 h-3 border-l border-b border-[color:var(--color-paper)] z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="pointer-events-none absolute bottom-0 right-0 w-3 h-3 border-r border-b border-[color:var(--color-paper)] z-10 opacity-0 group-hover:opacity-100 transition-opacity" />

                  {isVideoItem(photo) ? (
                    <video
                      src={photo.url}
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      onMouseEnter={(e) => void (e.currentTarget as HTMLVideoElement).play()}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLVideoElement).pause(); (e.currentTarget as HTMLVideoElement).currentTime = 0; }}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <img
                      src={photo.url}
                      alt={photo.filename}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                  )}

                  {!selectMode && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-end p-3 bg-gradient-to-t from-[color:var(--color-ink)]/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void downloadPhoto(photo.id, photo.filename);
                        }}
                        className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-paper)] border border-[color:var(--color-paper)] px-3 py-1.5 hover:bg-[color:var(--color-paper)] hover:text-[color:var(--color-ink)] transition-colors"
                      >
                        Descargar ↓
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {hasMore && (
          <div className="flex flex-col items-center gap-3 mt-16">
            <button
              onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
              className="group inline-flex items-center gap-3 border border-[color:var(--color-ink)] px-6 py-4 hover:bg-[color:var(--color-ink)] hover:text-[color:var(--color-paper)] transition-colors"
            >
              <span className="font-mono text-[11px] uppercase tracking-[0.22em]">
                Ver más · {photos.length - visibleCount} restantes
              </span>
              <span className="font-mono text-[11px] tracking-[0.22em] transition-transform group-hover:translate-y-0.5">
                ↓
              </span>
            </button>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)]">
              {visibleCount} / {photos.length}
            </p>
          </div>
        )}

        <p className="text-center font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mt-16">
          Link permanente · no expira
        </p>
      </div>

      {/* ── Selection bar ──────────────────────────────── */}
      <AnimatePresence>
        {selectMode && selected.size > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[min(560px,calc(100vw-32px))]"
          >
            <div className="flex items-center gap-3 px-5 py-4 bg-[color:var(--color-ink)] text-[color:var(--color-paper)] shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-paper)]/60">
                ({String(selected.size).padStart(2, "0")})
              </span>
              <p className="font-display italic text-[20px] leading-tight flex-1">
                {selected.size} {selected.size === 1 ? "foto" : "fotos"}
              </p>
              <button
                onClick={handleDownloadSelected}
                className="group inline-flex items-center gap-3 border border-[color:var(--color-paper)] bg-[color:var(--color-paper)] text-[color:var(--color-ink)] px-4 py-2.5 hover:bg-transparent hover:text-[color:var(--color-paper)] transition-colors"
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.22em]">Descargar</span>
                <span className="font-mono text-[10px] tracking-[0.22em] transition-transform group-hover:translate-y-0.5">
                  ↓
                </span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mobile download panel ─────────────────────── */}
      <AnimatePresence>
        {showDownloadPanel && (
          <motion.div
            key="dl-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[color:var(--color-ink)]/60 flex flex-col justify-end"
            onClick={() => setShowDownloadPanel(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[color:var(--color-paper)] rounded-t-none max-h-[80dvh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-[color:var(--color-grey-300)] shrink-0">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)]">
                    Descargas
                  </p>
                  <p className="font-display italic text-[22px] leading-tight text-[color:var(--color-ink)]">
                    {photos.length} foto{photos.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  onClick={() => setShowDownloadPanel(false)}
                  className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] hover:text-[color:var(--color-ink)]"
                >
                  Cerrar
                </button>
              </div>
              <p className="px-6 py-3 font-mono text-[9px] uppercase tracking-[0.16em] text-[color:var(--color-grey-500)] border-b border-[color:var(--color-grey-300)] shrink-0">
                Tocá cada foto para descargarla
              </p>

              {/* List */}
              <div className="overflow-y-auto flex-1">
                {photos.map((photo, i) => (
                  <a
                    key={photo.id}
                    href={`/api/download/file?token=${encodeURIComponent(token)}&photoId=${encodeURIComponent(photo.id)}`}
                    download={photo.filename}
                    className="flex items-center gap-4 px-6 py-3.5 border-b border-[color:var(--color-grey-200)] hover:bg-[color:var(--color-grey-100)] active:bg-[color:var(--color-grey-200)] transition-colors"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt=""
                      className="w-12 h-12 object-cover shrink-0 bg-[color:var(--color-grey-300)]"
                    />
                    <span className="flex-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-ink)] truncate">
                      {String(i + 1).padStart(3, "0")} · {photo.filename}
                    </span>
                    <span className="font-mono text-[10px] tracking-[0.14em] text-[color:var(--color-grey-500)] shrink-0">
                      ↓
                    </span>
                  </a>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Lightbox ───────────────────────────────────── */}
      <AnimatePresence>
        {lightboxIdx !== null && currentPhoto && (
          <motion.div
            key="lb"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-[color:var(--color-ink)]/97 flex flex-col"
            onClick={closeLightbox}
          >
            {/* Top bar */}
            <div
              className="flex items-center justify-between px-6 md:px-10 h-16 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-5">
                <span className="font-display italic text-[18px] text-[color:var(--color-paper)]">
                  Ivana Maritano
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-paper)]/60">
                  {String(lightboxIdx + 1).padStart(2, "0")} /{" "}
                  {String(photos.length).padStart(2, "0")}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => void downloadPhoto(currentPhoto.id, currentPhoto.filename)}
                  className="group inline-flex items-center gap-3 border border-[color:var(--color-paper)] bg-[color:var(--color-paper)] text-[color:var(--color-ink)] px-4 py-2.5 hover:bg-transparent hover:text-[color:var(--color-paper)] transition-colors"
                >
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em]">Descargar</span>
                  <span className="font-mono text-[10px] tracking-[0.22em] transition-transform group-hover:translate-y-0.5">
                    ↓
                  </span>
                </button>
                <button
                  onClick={closeLightbox}
                  className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-paper)]/80 hover:text-[color:var(--color-paper)] transition-colors"
                >
                  Cerrar [esc]
                </button>
              </div>
            </div>

            {/* Image */}
            <div
              className="relative flex-1 flex items-center justify-center px-4 md:px-16 py-2 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {isVideoItem(currentPhoto) ? (
                <video
                  key={currentPhoto.url}
                  src={currentPhoto.url}
                  controls
                  autoPlay
                  playsInline
                  className="max-w-full max-h-full object-contain"
                  style={{ maxHeight: "calc(100vh - 220px)" }}
                />
              ) : (
                <motion.img
                  key={currentPhoto.url}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  src={currentPhoto.url}
                  alt={currentPhoto.filename}
                  className="max-w-full max-h-full object-contain select-none"
                  style={{ maxHeight: "calc(100vh - 220px)" }}
                  draggable={false}
                />
              )}

              {photos.length > 1 && (
                <>
                  <button
                    onClick={prevPhoto}
                    aria-label="Anterior"
                    className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 group flex items-center gap-2"
                  >
                    <span className="w-10 h-10 border border-[color:var(--color-paper)]/40 group-hover:border-[color:var(--color-paper)] flex items-center justify-center transition-colors text-[color:var(--color-paper)]">
                      ←
                    </span>
                  </button>
                  <button
                    onClick={nextPhoto}
                    aria-label="Siguiente"
                    className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 group flex items-center gap-2"
                  >
                    <span className="w-10 h-10 border border-[color:var(--color-paper)]/40 group-hover:border-[color:var(--color-paper)] flex items-center justify-center transition-colors text-[color:var(--color-paper)]">
                      →
                    </span>
                  </button>
                </>
              )}
            </div>

            {/* Filename */}
            <p
              className="shrink-0 px-6 md:px-10 py-2 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-paper)]/35"
              onClick={(e) => e.stopPropagation()}
            >
              {currentPhoto.filename}
            </p>

            {/* Thumbnails */}
            <div
              className="shrink-0 flex gap-1.5 px-4 md:px-10 pb-6 overflow-x-auto justify-center"
              onClick={(e) => e.stopPropagation()}
              style={{ scrollbarWidth: "none" }}
            >
              {photos.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => setLightboxIdx(i)}
                  className={`shrink-0 w-12 h-12 overflow-hidden transition-all ${
                    i === lightboxIdx
                      ? "outline outline-2 outline-[color:var(--color-paper)] opacity-100"
                      : "opacity-30 hover:opacity-70"
                  }`}
                >
                  <img src={p.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
