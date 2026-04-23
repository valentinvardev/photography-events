"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";

type Props = {
  open: boolean;
  onClose: () => void;
  url: string | null;
  mimeType?: string | null;
  filename?: string | null;
  caption?: React.ReactNode;
  onPrev?: () => void;
  onNext?: () => void;
  toolbar?: React.ReactNode;
  index?: number;
  total?: number;
};

const VIDEO_EXT = /\.(mp4|mov|avi|webm|mkv|m4v)$/i;

function fmt(s: number) {
  if (!isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function guessVideoType(url: string, mimeType?: string | null, filename?: string | null): string {
  if (mimeType?.startsWith("video/")) return mimeType;
  const name = filename ?? url;
  if (/\.webm$/i.test(name)) return "video/webm";
  if (/\.mov$/i.test(name)) return "video/quicktime";
  return "video/mp4";
}

function VideoPlayer({ url, mimeType, filename }: { url: string; mimeType?: string | null; filename?: string | null }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [error, setError] = useState(false);
  const videoType = guessVideoType(url, mimeType, filename);

  useEffect(() => {
    setError(false);
    const v = ref.current;
    if (!v) return;
    v.currentTime = 0;
    void v.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [url]);

  const toggle = useCallback(() => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) { void v.play(); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
  }, []);

  const seek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = ref.current;
    if (!v) return;
    v.currentTime = Number(e.target.value);
    setCurrent(Number(e.target.value));
  }, []);

  const pct = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div className="flex flex-col items-center w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
      {/* Video element */}
      <div className="relative w-full" style={{ maxHeight: "calc(100vh - 220px)" }}>
        {error ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-[color:var(--color-paper)]/50">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em]">No se pudo cargar el video</p>
          </div>
        ) : (
          <video
            ref={ref}
            key={url}
            playsInline
            muted={muted}
            onTimeUpdate={() => !seeking && setCurrent(ref.current?.currentTime ?? 0)}
            onDurationChange={() => setDuration(ref.current?.duration ?? 0)}
            onEnded={() => setPlaying(false)}
            onError={() => setError(true)}
            onClick={toggle}
            className="w-full object-contain cursor-pointer"
            style={{ maxHeight: "calc(100vh - 220px)" }}
          >
            <source src={url} type={videoType} />
          </video>
        )}
        {/* Play overlay when paused */}
        {!error && !playing && (
          <div
            className="absolute inset-0 flex items-center justify-center cursor-pointer"
            onClick={toggle}
          >
            <div className="w-16 h-16 bg-[color:var(--color-paper)]/20 border border-[color:var(--color-paper)]/40 flex items-center justify-center backdrop-blur-sm">
              <svg className="w-6 h-6 text-[color:var(--color-paper)] translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="w-full mt-3 px-1 flex flex-col gap-2">
        {/* Progress */}
        <div className="relative h-1 bg-[color:var(--color-paper)]/20 w-full group/bar cursor-pointer">
          <div
            className="absolute inset-y-0 left-0 bg-[color:var(--color-paper)]"
            style={{ width: `${pct}%` }}
          />
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={current}
            onMouseDown={() => setSeeking(true)}
            onMouseUp={() => setSeeking(false)}
            onChange={seek}
            className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
          />
        </div>

        {/* Buttons row */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggle}
            className="w-7 h-7 border border-[color:var(--color-paper)]/40 hover:border-[color:var(--color-paper)] flex items-center justify-center transition-colors text-[color:var(--color-paper)] shrink-0"
          >
            {playing ? (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6zm8-14v14h4V5z" />
              </svg>
            ) : (
              <svg className="w-3 h-3 translate-x-px" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <span className="font-mono text-[10px] text-[color:var(--color-paper)]/60 tabular-nums">
            {fmt(current)} / {fmt(duration)}
          </span>
          <div className="flex-1" />
          <button
            onClick={() => { setMuted((m) => !m); if (ref.current) ref.current.muted = !muted; }}
            className="w-7 h-7 border border-[color:var(--color-paper)]/40 hover:border-[color:var(--color-paper)] flex items-center justify-center transition-colors text-[color:var(--color-paper)] shrink-0"
          >
            {muted ? (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l-4-4m4 0l-4 4" />
              </svg>
            ) : (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M12 6v12m-3.536-9.536a5 5 0 000 7.072M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            )}
          </button>
          <button
            onClick={() => ref.current?.requestFullscreen?.()}
            className="w-7 h-7 border border-[color:var(--color-paper)]/40 hover:border-[color:var(--color-paper)] flex items-center justify-center transition-colors text-[color:var(--color-paper)] shrink-0"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export function Lightbox({ open, onClose, url, mimeType, filename, caption, onPrev, onNext, toolbar, index, total }: Props) {
  const isVideo = !!mimeType?.startsWith("video/") || (!!filename && VIDEO_EXT.test(filename));

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && onPrev) onPrev();
      if (e.key === "ArrowRight" && onNext) onNext();
      if (e.key === " " && isVideo) e.preventDefault();
    };
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = document.body.style.overflow;
    const prevPadding = document.body.style.paddingRight;
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPadding;
    };
  }, [open, onClose, onPrev, onNext, isVideo]);

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
          data-cursor="dark"
          className="fixed inset-0 z-[120] bg-[color:var(--color-ink)]/97 flex flex-col cursor-none"
        >
          {/* top bar */}
          <div
            className="flex items-center justify-between px-6 md:px-10 h-16 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
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

          {/* content — clicking backdrop closes, clicking content stops propagation */}
          <div className="relative flex-1 flex items-center justify-center px-4 md:px-16 py-2 overflow-hidden">
            {isVideo ? (
              <VideoPlayer url={url} mimeType={mimeType} filename={filename} />
            ) : (
              <motion.img
                key={url}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                src={url}
                alt=""
                className="max-w-full max-h-full object-contain select-none"
                style={{ maxHeight: "calc(100vh - 200px)" }}
                draggable={false}
                onClick={(e) => e.stopPropagation()}
              />
            )}

            {onPrev && (
              <button
                onClick={(e) => { e.stopPropagation(); onPrev(); }}
                aria-label="Anterior"
                className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 group flex items-center gap-2"
              >
                <span className="w-10 h-10 border border-[color:var(--color-paper)]/40 group-hover:border-[color:var(--color-paper)] flex items-center justify-center transition-colors text-[color:var(--color-paper)]">←</span>
                <span className="hidden md:inline font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-paper)]/0 group-hover:text-[color:var(--color-paper)]/80 transition-colors">prev</span>
              </button>
            )}
            {onNext && (
              <button
                onClick={(e) => { e.stopPropagation(); onNext(); }}
                aria-label="Siguiente"
                className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 group flex items-center gap-2"
              >
                <span className="hidden md:inline font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-paper)]/0 group-hover:text-[color:var(--color-paper)]/80 transition-colors">next</span>
                <span className="w-10 h-10 border border-[color:var(--color-paper)]/40 group-hover:border-[color:var(--color-paper)] flex items-center justify-center transition-colors text-[color:var(--color-paper)]">→</span>
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
