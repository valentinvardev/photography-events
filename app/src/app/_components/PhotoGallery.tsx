"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  /** Set by /api/download/file when it bounces a download back here. */
  errorCode?: string | null;
};

const PAGE_SIZE = 24;

const WA_URL = "https://wa.me/5493518000368";

// Fallback batch only: gap between hidden frames. Each file gets its own frame,
// so they can't cancel each other; spacing keeps the burst from looking abusive.
const BATCH_STAGGER_MS = 700;

// Parallel fetches from S3 while building the ZIP.
const ZIP_CONCURRENCY = 4;

// "frames-done": every frame is out, but Chrome may still be holding files 2..N
// behind its multiple-downloads prompt, so it isn't "Listo" yet.
type BatchStage = "fetch" | "zip" | "frames" | "frames-done" | "done";

// Characters Windows rejects in file names, plus the path separators that
// would make JSZip create folders.
const unsafeFilename = /[<>:"/\\|?*\u0000-\u001f]/g;

const DOWNLOAD_ERRORS = {
  foto: "No encontramos esa foto en tu compra.",
  archivo: "No pudimos preparar la descarga. Probá de nuevo en unos segundos.",
  link: "Este link de descarga ya no es válido.",
} as const;

function downloadErrorMessage(code: string): string {
  // hasOwn, not `in`: `in` walks the prototype, so ?error=constructor would
  // hand React a function and crash the page.
  return Object.hasOwn(DOWNLOAD_ERRORS, code)
    ? DOWNLOAD_ERRORS[code as keyof typeof DOWNLOAD_ERRORS]
    : DOWNLOAD_ERRORS.archivo;
}

// While a phone download is still a pending navigation (endpoint + S3 headers,
// ~2 s in production), a second one in the same window would cancel it.
const NAV_LOCK_MS = 3000;

// Phones and tablets, by capability rather than touch alone: touch laptops
// report touch points too, and belong on the desktop path (ZIP, frames).
const isPhone = () =>
  typeof window !== "undefined" && window.matchMedia("(hover: none) and (pointer: coarse)").matches;

export function PhotoGallery({
  token,
  bibNumber,
  collectionTitle,
  buyerName,
  photos,
  suggestions: _,
  errorCode = null,
}: Props) {
  void _;
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");
  // Desktop batch progress; null when idle.
  // `missing`: photos left out of a finished ZIP, so the button can't say "Listo".
  const [batch, setBatch] = useState<{
    done: number;
    total: number;
    stage: BatchStage;
    missing?: number;
  } | null>(null);
  // The guard lives in a ref, not in `batch`: a double click lands before the
  // re-render, so both clicks would read batch === null and build two ZIPs.
  const batchRunning = useRef(false);
  // Each batch's delayed reset only clears its own state, never a newer one's.
  const batchRun = useRef(0);
  // Brief "Descargando…" on the button that was just used.
  const [startedId, setStartedId] = useState<string | null>(null);
  // Phone downloads are navigations: one at a time (see NAV_LOCK_MS).
  const navLock = useRef(false);
  const [navPendingId, setNavPendingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(
    errorCode ? downloadErrorMessage(errorCode) : null,
  );
  const [showDownloadPanel, setShowDownloadPanel] = useState(false);
  const [downloadPanelPhotos, setDownloadPanelPhotos] = useState<Photo[]>([]);
  // Rows of the mobile panel already tapped, so a 45-photo list shows progress.
  const [tappedIds, setTappedIds] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  // Share sheet support ("Guardar en Fotos"), resolved on the client.
  const [canShareFiles, setCanShareFiles] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const shareCache = useRef(new Map<string, File>());
  const [shareStatus, setShareStatus] = useState<{ id: string; ok: boolean } | null>(null);
  // Bumped to re-run the prefetch after our own download navigation killed it.
  const [shareRetry, setShareRetry] = useState(0);

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

  const fileUrl = (photoId: string, inFrame = false) =>
    `/api/download/file?token=${encodeURIComponent(token)}&photoId=${encodeURIComponent(photoId)}${
      inFrame ? "&frame=1" : ""
    }`;

  // The endpoint redirects to S3 with Content-Disposition: attachment, so the
  // browser saves the file with its own progress UI. Either way it runs
  // synchronously in the click: an await first would spend the user
  // activation that browsers require to start a download.
  //
  // Desktop: a hidden frame per file. A navigation of this window stays
  // pending until S3's headers arrive; a second click in that gap cancels the
  // first, and Firefox/WebKit also abort the page's in-flight fetches (the ZIP
  // being built). Separate frames avoid both.
  //
  // Phones: a navigation of this window, one at a time. Frame-initiated
  // downloads can't be verified on iOS Safari, and there a silent failure
  // would mean no downloads at all.
  const openFrame = (photoId: string) => {
    const frame = document.createElement("iframe");
    frame.style.display = "none";
    frame.src = fileUrl(photoId, true);
    document.body.appendChild(frame);
    // The download outlives its frame once started; this only tidies the DOM.
    setTimeout(() => frame.remove(), 5 * 60_000);
  };

  /** Claims the single phone-download slot; false while one is still pending. */
  const beginNav = (photoId: string): boolean => {
    if (navLock.current) return false;
    navLock.current = true;
    setNavPendingId(photoId);
    setTimeout(() => {
      navLock.current = false;
      setNavPendingId(null);
    }, NAV_LOCK_MS);
    return true;
  };

  const startDownload = (photoId: string) => {
    if (isPhone()) {
      if (!beginNav(photoId)) return;
      const a = document.createElement("a");
      // No `download` attribute: with it an error redirect would be saved as
      // an HTML file instead of shown.
      a.href = fileUrl(photoId);
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      openFrame(photoId);
    }
    setErrorMsg(null);
    setStartedId(photoId);
    setTimeout(() => setStartedId((id) => (id === photoId ? null : id)), 3000);
  };

  // Fallback batch: one hidden frame per file. Chrome only lets the first of
  // these through; the rest wait behind a "descargar varios archivos" prompt,
  // hence the banner, which stays up after the last frame (stage
  // "frames-done") because the page can't see whether the buyer allowed it.
  const downloadFrames = async (list: Photo[]) => {
    for (let i = 0; i < list.length; i++) {
      openFrame(list[i]!.id);
      setBatch({ done: i + 1, total: list.length, stage: "frames" });
      if (i < list.length - 1) await new Promise((r) => setTimeout(r, BATCH_STAGGER_MS));
    }
  };

  // Desktop batch: a single ZIP built in the browser. Separate downloads trip
  // Chrome's multiple-downloads guard — everything after the first is held
  // behind a prompt the buyer rarely sees, and the page can't tell. One ZIP
  // right after the click is one download, so it goes through. Files come
  // straight from S3 via the presigned URLs already on the page, not through
  // the VPS. Where S3 CORS refuses the origin (www.) or the URLs have expired
  // (page open > 24 h), every fetch fails and it falls back to frames.
  const downloadBatch = async (list: Photo[]) => {
    if (batchRunning.current || list.length === 0) return;
    if (list.length === 1) {
      startDownload(list[0]!.id);
      return;
    }
    batchRunning.current = true;
    const run = ++batchRun.current;
    setErrorMsg(null);
    setBatch({ done: 0, total: list.length, stage: "fetch" });
    let usedFrames = false;
    let zipped = false;
    let missing = 0;
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      const used = new Set<string>();
      // Two photos can share a filename; JSZip would silently keep only one.
      const uniqueName = (raw: string) => {
        const name = raw.replace(unsafeFilename, "_") || "foto.jpg";
        const dot = name.lastIndexOf(".");
        const base = dot > 0 ? name.slice(0, dot) : name;
        const ext = dot > 0 ? name.slice(dot) : "";
        let candidate = name;
        for (let n = 2; used.has(candidate); n++) candidate = `${base} (${n})${ext}`;
        used.add(candidate);
        return candidate;
      };

      const failed: Photo[] = [];
      let next = 0;
      let done = 0;
      const worker = async () => {
        while (next < list.length) {
          const photo = list[next++]!;
          try {
            // no-store: the thumbnail <img> cached this URL without CORS
            // headers, and S3 sends no Vary: Origin.
            const res = await fetch(photo.url, { cache: "no-store" });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            zip.file(uniqueName(photo.filename), await res.blob(), { binary: true });
          } catch {
            failed.push(photo);
          }
          done++;
          setBatch({ done, total: list.length, stage: "fetch" });
        }
      };
      await Promise.all(Array.from({ length: Math.min(ZIP_CONCURRENCY, list.length) }, worker));

      if (failed.length === list.length) {
        usedFrames = true;
        await downloadFrames(list);
      } else {
        setBatch({ done: list.length, total: list.length, stage: "zip" });
        // STORE: JPEGs are already compressed; deflating them only burns CPU.
        const blob = await zip.generateAsync({ type: "blob", compression: "STORE" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${collectionTitle.replace(unsafeFilename, "_")} - fotos.zip`;
        document.body.appendChild(a);
        zipped = true;
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 60_000);
        missing = failed.length;
        if (missing > 0) {
          setErrorMsg(
            `Se descargaron ${list.length - missing} de ${list.length}. Las que faltan las podés bajar de a una con «Descargar».`,
          );
        }
      }
      setBatch({ done: list.length, total: list.length, stage: usedFrames ? "frames-done" : "done", missing });
    } catch {
      // A throw rather than refused fetches: most often the jszip chunk is gone
      // because the site was redeployed while this tab stayed open
      // (ChunkLoadError, and it fails the same way on every retry), or the ZIP
      // didn't fit in memory. The per-file endpoint needs neither.
      if (!zipped && !usedFrames) {
        usedFrames = true;
        try {
          await downloadFrames(list);
          setBatch({ done: list.length, total: list.length, stage: "frames-done" });
        } catch {
          setErrorMsg(DOWNLOAD_ERRORS.archivo);
        }
      } else {
        setErrorMsg(DOWNLOAD_ERRORS.archivo);
      }
    } finally {
      // Whatever happened, never leave the button stuck. The frames banner
      // lingers longer: the permission prompt may still be waiting.
      batchRunning.current = false;
      setTimeout(
        () => {
          if (batchRun.current === run) setBatch(null);
        },
        usedFrames ? 15_000 : 4000,
      );
    }
  };

  // The share sheet's "Guardar imagen" is the only route into the Photos app on
  // iPhone; a plain download lands in Files › Downloads, where buyers don't
  // look. share() must also run synchronously in the tap, so the file is
  // fetched ahead (see the effect below) and handed over here.
  const saveToPhotos = (photo: Photo) => {
    const file = shareCache.current.get(photo.id);
    if (!file) return;
    navigator.share({ files: [file] }).catch((err: unknown) => {
      // AbortError is the buyer closing the sheet.
      if ((err as { name?: string }).name !== "AbortError") {
        setErrorMsg("No se pudo abrir el menú para guardar. Probá con «Descargar».");
      }
    });
  };

  const openDownloadPanel = (photosToDownload: Photo[]) => {
    setDownloadPanelPhotos(photosToDownload);
    setShowDownloadPanel(true);
  };

  const handleDownloadSelected = () => {
    // Numeric sort — the default sort() compares as strings (10 before 2).
    const selectedPhotos = Array.from(selected)
      .sort((a, b) => a - b)
      .map((i) => photos[i]!);
    if (isPhone()) {
      openDownloadPanel(selectedPhotos);
      return;
    }
    void downloadBatch(selectedPhotos);
  };
  const handleDownloadAll = () => {
    if (isPhone()) {
      openDownloadPanel(photos);
      return;
    }
    void downloadBatch(photos);
  };

  const handleShare = () => {
    void navigator.clipboard.writeText(window.location.href).then(() => {
      setShareState("copied");
      setTimeout(() => setShareState("idle"), 2500);
    });
  };

  const currentPhoto = lightboxIdx !== null ? photos[lightboxIdx] : null;

  useEffect(() => {
    const touch = navigator.maxTouchPoints > 1;
    // iPadOS reports itself as a Mac; the touch points give it away.
    const ios = /iP(hone|ad|od)/.test(navigator.userAgent) || (/Mac/.test(navigator.userAgent) && touch);
    setIsIOS(ios);
    // iOS only: that's where a plain download misses the Photos app. Android
    // already lists Downloads in its gallery, and a share sheet there would
    // offer "Guardar en Fotos" with no Photos app behind it.
    try {
      setCanShareFiles(
        ios &&
          typeof navigator.canShare === "function" &&
          navigator.canShare({ files: [new File([""], "x.jpg", { type: "image/jpeg" })] }),
      );
    } catch {
      setCanShareFiles(false);
    }
  }, []);

  // Show ?error= once; a reload shouldn't bring it back. Not router.replace:
  // that re-renders the page on the server, re-querying the purchase and
  // re-signing every photo URL, so all the images load again. Next patches
  // history.replaceState to keep its own copy of the URL in sync, but installs
  // the patch in the app router's effect, which runs after this one — hence
  // the tick. Unpatched, Next would later restore the stale ?error= URL.
  useEffect(() => {
    if (!errorCode) return;
    const t = setTimeout(() => window.history.replaceState(null, "", window.location.pathname), 0);
    return () => clearTimeout(t);
  }, [errorCode]);

  // Desktop downloads run in hidden frames, where a failure is invisible; the
  // endpoint's error page reports it here instead. Same origin only, and only
  // the code is used, mapped through a fixed table.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const data = e.data as { type?: unknown; code?: unknown } | null;
      if (data?.type !== "download-error" || typeof data.code !== "string") return;
      setErrorMsg(downloadErrorMessage(data.code));
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Prefetch the photo open in the viewer so "Guardar en Fotos" can share it
  // synchronously. cache: "no-store" because the thumbnail <img> already cached
  // this URL without CORS headers and S3 sends no Vary: Origin — reusing that
  // entry would fail the CORS check. Fails quietly where S3 CORS doesn't
  // allow the origin (e.g. www.): the button just never appears.
  useEffect(() => {
    if (!canShareFiles || !currentPhoto || isVideoItem(currentPhoto)) return;
    const photo = currentPhoto;
    if (shareCache.current.has(photo.id)) {
      setShareStatus({ id: photo.id, ok: true });
      return;
    }
    const ctrl = new AbortController();
    let retry: ReturnType<typeof setTimeout> | undefined;
    fetch(photo.url, { cache: "no-store", signal: ctrl.signal })
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((blob) => {
        const cache = shareCache.current;
        cache.set(photo.id, new File([blob], photo.filename, { type: blob.type || "image/jpeg" }));
        // Originals run 1-2 MB; a phone shouldn't hold more than a few.
        while (cache.size > 4) cache.delete(cache.keys().next().value!);
        setShareStatus({ id: photo.id, ok: true });
      })
      .catch(() => {
        if (ctrl.signal.aborted) return;
        // Our own download navigation cancels the page's fetches in WebKit;
        // that isn't CORS, so try again once it has settled.
        if (navLock.current) {
          retry = setTimeout(() => setShareRetry((n) => n + 1), NAV_LOCK_MS);
          return;
        }
        setShareStatus({ id: photo.id, ok: false });
      });
    return () => {
      ctrl.abort();
      clearTimeout(retry);
    };
  }, [canShareFiles, currentPhoto, shareRetry]);

  const shareReady = !!currentPhoto && shareStatus?.id === currentPhoto.id && shareStatus.ok;
  const shareFailed = !!currentPhoto && shareStatus?.id === currentPhoto.id && !shareStatus.ok;

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
              {/* Icon-only on narrow phones, or "Descargar todo" gets pushed off-screen. */}
              <span
                className={`${shareState === "copied" ? "" : "hidden sm:inline"} font-mono text-[10px] uppercase tracking-[0.22em]`}
              >
                {shareState === "copied" ? "Copiado" : "Compartir"}
              </span>
            </button>
            <button
              onClick={handleDownloadAll}
              disabled={!!batch || photos.length === 0}
              className="group inline-flex items-center gap-2 border border-[color:var(--color-ink)] bg-[color:var(--color-ink)] text-[color:var(--color-paper)] px-4 py-2 hover:bg-transparent hover:text-[color:var(--color-ink)] transition-colors disabled:opacity-40"
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.22em]">
                {!batch
                  ? "Descargar todo"
                  : batch.stage === "fetch"
                    ? `Preparando ${batch.done}/${batch.total}…`
                    : batch.stage === "zip"
                      ? "Armando ZIP…"
                      : batch.stage === "frames"
                        ? `Descargando ${batch.done}/${batch.total}…`
                        : batch.stage === "frames-done"
                          ? "Revisá Descargas"
                          : batch.missing
                            ? `Faltan ${batch.missing} · ver aviso`
                            : "Listo · revisá Descargas"}
              </span>
              <span className="font-mono text-[10px] tracking-[0.22em] hidden sm:inline transition-transform group-hover:translate-y-0.5">
                ↓
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Notices float at the bottom. In the page flow they sat above the
          fold: a buyer scrolled into the grid got a failed download, or a ZIP
          missing photos, with nothing on screen to say so. With the viewer
          open these sit under it; the viewer shows its own. */}
      {lightboxIdx === null && (!!errorMsg || (!!batch && batch.stage !== "done")) && (
        <div
          className={`fixed left-1/2 -translate-x-1/2 z-40 w-[min(560px,calc(100vw-32px))] flex flex-col gap-2 ${
            // Above the selection bar when it's showing.
            selectMode && selected.size > 0 ? "bottom-28" : "bottom-5"
          }`}
        >
          {batch && batch.stage !== "done" && (
            <p
              role="status"
              className="px-5 py-3 bg-[color:var(--color-ink)] text-[color:var(--color-paper)]/80 font-mono text-[10px] uppercase tracking-[0.18em] leading-[1.7] shadow-[0_24px_60px_rgba(0,0,0,0.35)]"
            >
              {batch.stage === "frames" || batch.stage === "frames-done"
                ? "Si el navegador pregunta, permití descargar varios archivos."
                : "Juntamos tus fotos en un solo ZIP. No cierres la página."}
            </p>
          )}
          {errorMsg && (
            <div
              role="alert"
              className="px-5 py-4 flex items-start justify-between gap-4 border border-[color:var(--color-safelight)] bg-[color:var(--color-ink)] shadow-[0_24px_60px_rgba(0,0,0,0.35)]"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] leading-[1.7] text-[color:var(--color-paper)]">
                {errorMsg}{" "}
                <a href={WA_URL} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                  Escribinos por WhatsApp
                </a>
              </p>
              <button
                onClick={() => setErrorMsg(null)}
                className="shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-paper)]/60 hover:text-[color:var(--color-paper)]"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      )}

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
        {photos.length === 0 && (
          <div className="border border-dashed border-[color:var(--color-grey-300)] py-20 px-6 text-center">
            <p className="font-display italic text-[32px] leading-tight">
              No encontramos las fotos de esta compra.
            </p>
            <p className="mt-4 font-sans text-[15px] leading-[1.6] text-[color:var(--color-grey-700)]">
              Tu pago está registrado. Escribinos y te las mandamos.
            </p>
            <a
              href={WA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-8 border border-[color:var(--color-ink)] px-6 py-3 font-mono text-[11px] uppercase tracking-[0.22em] hover:bg-[color:var(--color-ink)] hover:text-[color:var(--color-paper)] transition-colors"
            >
              Escribinos por WhatsApp
            </a>
          </div>
        )}
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
                      className={`inline-flex items-center justify-center w-4 h-4 border ${
                        isSelected
                          ? "bg-[color:var(--color-ink)] border-[color:var(--color-ink)]"
                          : "border-[color:var(--color-grey-500)]"
                      }`}
                      aria-hidden
                    >
                      {isSelected && (
                        <svg width="8" height="8" viewBox="0 0 10 8" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="1,4 4,7 9,1" />
                        </svg>
                      )}
                    </span>
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

                  {/* Only where hover exists. On touch this strip stayed invisible
                      yet caught taps: the bottom of every thumbnail neither opened
                      the viewer nor showed that it had started a download. */}
                  {!selectMode && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute inset-x-0 bottom-0 z-10 hidden [@media(hover:hover)]:flex items-end justify-end p-3 bg-gradient-to-t from-[color:var(--color-ink)]/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startDownload(photo.id);
                        }}
                        className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-paper)] border border-[color:var(--color-paper)] px-3 py-1.5 hover:bg-[color:var(--color-paper)] hover:text-[color:var(--color-ink)] transition-colors"
                      >
                        {startedId === photo.id ? "Descargando…" : "Descargar ↓"}
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
                    {downloadPanelPhotos.length} foto{downloadPanelPhotos.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  onClick={() => setShowDownloadPanel(false)}
                  className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] hover:text-[color:var(--color-ink)]"
                >
                  Cerrar
                </button>
              </div>
              <p className="px-6 py-3 font-mono text-[9px] uppercase tracking-[0.16em] leading-[1.7] text-[color:var(--color-grey-500)] border-b border-[color:var(--color-grey-300)] shrink-0">
                Tocá cada foto para descargarla
                {isIOS && (
                  <>
                    <br />
                    En iPhone se guardan en Archivos › Descargas.
                    {canShareFiles && " Para pasarlas a Fotos, abrí la foto y tocá «Guardar en Fotos»."}
                  </>
                )}
              </p>

              {/* List */}
              <div className="overflow-y-auto flex-1">
                {downloadPanelPhotos.map((photo, i) => {
                  const tapped = tappedIds.has(photo.id);
                  const pending = navPendingId === photo.id;
                  // Another row's download is still a pending navigation;
                  // following this link now would cancel it.
                  const locked = navPendingId !== null && !pending;
                  return (
                    // A real link, so the tap itself navigates. No `download`
                    // attribute: see startDownload.
                    <a
                      key={photo.id}
                      href={fileUrl(photo.id)}
                      aria-disabled={locked || undefined}
                      onClick={(e) => {
                        if (!beginNav(photo.id)) {
                          e.preventDefault();
                          return;
                        }
                        setErrorMsg(null);
                        setTappedIds((prev) => new Set(prev).add(photo.id));
                      }}
                      className={`flex items-center gap-4 px-6 py-3.5 border-b border-[color:var(--color-grey-200)] hover:bg-[color:var(--color-grey-100)] active:bg-[color:var(--color-grey-200)] transition-opacity ${
                        locked ? "opacity-40" : ""
                      }`}
                    >
                      {/* Lazy: these are full originals, and all of them loading at
                          once competed with the downloads for the phone's bandwidth. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.url}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="w-12 h-12 object-cover shrink-0 bg-[color:var(--color-grey-300)]"
                      />
                      <span className="flex-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-ink)] truncate">
                        {String(i + 1).padStart(3, "0")} · {photo.filename}
                      </span>
                      <span
                        className={`font-mono text-[10px] tracking-[0.14em] shrink-0 ${
                          tapped && !pending ? "text-[#16a34a]" : "text-[color:var(--color-grey-500)]"
                        }`}
                      >
                        {pending ? "Descargando…" : tapped ? "✓" : "↓"}
                      </span>
                    </a>
                  );
                })}
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
                <span className="hidden sm:inline font-display italic text-[18px] text-[color:var(--color-paper)]">
                  Ivana Maritano
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-paper)]/60">
                  {String(lightboxIdx + 1).padStart(2, "0")} /{" "}
                  {String(photos.length).padStart(2, "0")}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => startDownload(currentPhoto.id)}
                  // Phones only: one download navigation at a time.
                  disabled={navPendingId !== null}
                  className="group inline-flex items-center gap-3 border border-[color:var(--color-paper)] bg-[color:var(--color-paper)] text-[color:var(--color-ink)] px-4 py-2.5 hover:bg-transparent hover:text-[color:var(--color-paper)] transition-colors disabled:opacity-60"
                >
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em]">
                    {startedId === currentPhoto.id || navPendingId === currentPhoto.id
                      ? "Descargando…"
                      : "Descargar"}
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.22em] transition-transform group-hover:translate-y-0.5">
                    ↓
                  </span>
                </button>
                <button
                  onClick={closeLightbox}
                  className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-paper)]/80 hover:text-[color:var(--color-paper)] transition-colors"
                >
                  Cerrar<span className="hidden sm:inline"> [esc]</span>
                </button>
              </div>
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="shrink-0 mx-4 md:mx-10 mb-2 px-4 py-2.5 flex items-center justify-between gap-4 border border-[color:var(--color-safelight)]/60 bg-[color:var(--color-safelight)]/20"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-paper)]">
                  {errorMsg}{" "}
                  <a href={WA_URL} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                    Escribinos por WhatsApp
                  </a>
                </p>
                <button
                  onClick={() => setErrorMsg(null)}
                  className="shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-paper)]/60 hover:text-[color:var(--color-paper)]"
                >
                  Cerrar
                </button>
              </div>
            )}

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

            {/* Save to Photos — wide and at the bottom: it's the action a phone
                buyer actually wants, and it doesn't fit in the top bar. */}
            {canShareFiles && !isVideoItem(currentPhoto) && !shareFailed && (
              <div className="shrink-0 px-4 md:px-10 pt-2 flex justify-center" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => saveToPhotos(currentPhoto)}
                  disabled={!shareReady}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 border border-[color:var(--color-paper)] bg-[color:var(--color-paper)] text-[color:var(--color-ink)] px-6 py-3 disabled:opacity-50 transition-opacity"
                >
                  <span className="font-mono text-[11px] uppercase tracking-[0.22em]">
                    {shareReady ? "Guardar en Fotos" : "Preparando…"}
                  </span>
                </button>
              </div>
            )}

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
                  {/* Lazy: full originals — all of them loading on open is tens of MB. */}
                  <img src={p.url} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
