"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

type Props = {
  open: boolean;
  onClose: () => void;
  url: string | null;
  mimeType?: string | null;
  caption?: React.ReactNode;
  onPrev?: () => void;
  onNext?: () => void;
  toolbar?: React.ReactNode;
  index?: number;
  total?: number;
};

export function Lightbox({ open, onClose, url, mimeType, caption, onPrev, onNext, toolbar, index, total }: Props) {
  const isVideo = !!mimeType?.startsWith("video/");
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && onPrev) onPrev();
      if (e.key === "ArrowRight" && onNext) onNext();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, onPrev, onNext]);

  return (
    <AnimatePresence>
      {open && url && (
        <motion.div
          key="lb"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
          className="fixed inset-0 z-[120] bg-[color:var(--color-ink)]/97 flex flex-col"
        >
          {/* top bar */}
          <div className="flex items-center justify-between px-6 md:px-10 h-16 shrink-0" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-5">
              <span className="font-display italic text-[18px] text-[color:var(--color-paper)]">
                Ivana Maritano
              </span>
              {typeof index === "number" && typeof total === "number" && (
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-paper)]/60">
                  {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {toolbar}
              <button
                onClick={onClose}
                className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-paper)]/80 hover:text-[color:var(--color-paper)] transition-colors"
              >
                Cerrar [esc]
              </button>
            </div>
          </div>

          {/* image */}
          <div className="relative flex-1 flex items-center justify-center px-4 md:px-16 py-2 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {isVideo ? (
              <video
                key={url}
                src={url ?? undefined}
                controls
                autoPlay
                playsInline
                className="max-w-full max-h-full object-contain select-none"
                style={{ maxHeight: "calc(100vh - 200px)" }}
              />
            ) : (
              <motion.img
                key={url}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                src={url ?? undefined}
                alt=""
                className="max-w-full max-h-full object-contain select-none"
                style={{ maxHeight: "calc(100vh - 200px)" }}
                draggable={false}
              />
            )}

            {onPrev && (
              <button
                onClick={onPrev}
                aria-label="Anterior"
                className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 group flex items-center gap-2"
              >
                <span className="w-10 h-10 border border-[color:var(--color-paper)]/40 group-hover:border-[color:var(--color-paper)] flex items-center justify-center transition-colors text-[color:var(--color-paper)]">
                  ←
                </span>
                <span className="hidden md:inline font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-paper)]/0 group-hover:text-[color:var(--color-paper)]/80 transition-colors">
                  prev
                </span>
              </button>
            )}
            {onNext && (
              <button
                onClick={onNext}
                aria-label="Siguiente"
                className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 group flex items-center gap-2"
              >
                <span className="hidden md:inline font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-paper)]/0 group-hover:text-[color:var(--color-paper)]/80 transition-colors">
                  next
                </span>
                <span className="w-10 h-10 border border-[color:var(--color-paper)]/40 group-hover:border-[color:var(--color-paper)] flex items-center justify-center transition-colors text-[color:var(--color-paper)]">
                  →
                </span>
              </button>
            )}
          </div>

          {/* caption */}
          {caption && (
            <div className="shrink-0 px-6 md:px-10 pb-6 pt-2" onClick={(e) => e.stopPropagation()}>
              {caption}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
