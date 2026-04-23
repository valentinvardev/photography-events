"use client";

import { useState, useRef, useEffect, useMemo, useCallback, memo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { api } from "~/trpc/react";
import { BibCheckoutModal } from "~/app/_components/FolderModal";
import { useCart } from "~/app/_components/CartContext";
import { Lightbox } from "~/app/_components/design/Lightbox";

// ─── Photo tile ───────────────────────────────────────────────────────────────
// URL is passed from parent batch query — no per-tile API call.
// memo'd so it only re-renders when its own props change (e.g. inCart flips).

function isTileVideo(mimeType: string | null | undefined, filename?: string): boolean {
  if (mimeType) return mimeType.startsWith("video/");
  if (!filename) return false;
  return /\.(mp4|mov|avi|webm|mkv|m4v)$/i.test(filename);
}

const PhotoTile = memo(function PhotoTile({
  photoId,
  bibNumber,
  index,
  price,
  inCart,
  isFuzzy,
  url,
  mimeType,
  filename,
  onOpenLightbox,
  onToggleCart,
}: {
  photoId: string;
  bibNumber: string | null;
  index: number;
  price: number;
  inCart: boolean;
  isFuzzy?: boolean;
  url: string | null;
  mimeType?: string | null;
  filename?: string;
  onOpenLightbox: (photoId: string, bibNumber: string | null, url: string) => void;
  onToggleCart: (photoId: string, bibNumber: string | null, url: string, price: number) => void;
}) {
  const isVideo = isTileVideo(mimeType, filename);
  return (
    <div
      className="group relative cursor-pointer"
      onClick={() => url && onOpenLightbox(photoId, bibNumber, url)}
    >
      {/* Frame number */}
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mb-2 flex items-center justify-between">
        <span>F. {String(index + 1).padStart(3, "0")}</span>
        {bibNumber && <span className="text-[color:var(--color-ink)]">#{bibNumber}</span>}
        {isFuzzy && <span className="text-[color:var(--color-safelight)]">SIMILAR</span>}
      </p>

      {/* Photo */}
      <div
        className="relative overflow-hidden bg-[color:var(--color-grey-300)]"
        style={{ aspectRatio: "4/3" }}
      >
        {/* Viewfinder corners */}
        <span className="pointer-events-none absolute top-0 left-0 w-3 h-3 border-l border-t border-[color:var(--color-paper)] z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="pointer-events-none absolute top-0 right-0 w-3 h-3 border-r border-t border-[color:var(--color-paper)] z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="pointer-events-none absolute bottom-0 left-0 w-3 h-3 border-l border-b border-[color:var(--color-paper)] z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="pointer-events-none absolute bottom-0 right-0 w-3 h-3 border-r border-b border-[color:var(--color-paper)] z-10 opacity-0 group-hover:opacity-100 transition-opacity" />

        {!url ? (
          <div className="w-full h-full animate-pulse bg-[color:var(--color-grey-300)]" />
        ) : isVideo ? (
          <video
            src={url}
            muted
            loop
            playsInline
            preload="metadata"
            onMouseEnter={(e) => void (e.currentTarget as HTMLVideoElement).play()}
            onMouseLeave={(e) => {
              const v = e.currentTarget as HTMLVideoElement;
              v.pause();
              v.currentTime = 0;
            }}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <img
            src={url}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover object-top"
          />
        )}

        {/* Hover overlay — price strip */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-3 py-3 bg-gradient-to-t from-[color:var(--color-ink)]/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-paper)]">
            {price > 0 ? `$${price.toLocaleString("es-AR")}` : "Sin precio"}
          </span>
        </div>

        {/* Cart button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!url) return;
            onToggleCart(photoId, bibNumber, url, price);
          }}
          disabled={!url}
          className={`absolute bottom-2 right-2 z-20 flex items-center gap-2 px-3 py-2 transition-all duration-200 disabled:opacity-40 ${
            inCart
              ? "bg-[color:var(--color-paper)] text-[color:var(--color-ink)] shadow-sm"
              : "bg-[color:var(--color-ink)]/75 text-[color:var(--color-paper)] hover:bg-[color:var(--color-ink)]"
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.61L23 6H6"/>
          </svg>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em]">
            {inCart ? "✓" : "+"}
          </span>
        </button>
      </div>
    </div>
  );
});

// ─── Floating cart bar ────────────────────────────────────────────────────────

const CartBar = memo(function CartBar({
  count,
  total,
  onCheckout,
  onClear,
}: {
  count: number;
  total: number;
  onCheckout: () => void;
  onClear: () => void;
}) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[min(560px,calc(100vw-32px))]"
        >
          <div className="flex items-center gap-3 px-4 sm:px-5 py-4 bg-[color:var(--color-ink)] text-[color:var(--color-paper)] shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-paper)]/60 hidden sm:inline">
              ({String(count).padStart(2, "0")})
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-paper)]/60">
                Carrito
              </p>
              <p className="font-display italic text-[20px] leading-tight truncate">
                {count} {count === 1 ? "foto" : "fotos"} ·{" "}
                <span className="text-[color:var(--color-paper)]/65">
                  {total > 0 ? `$${total.toLocaleString("es-AR")}` : "—"}
                </span>
              </p>
            </div>
            <button
              onClick={onClear}
              className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-paper)]/60 hover:text-[color:var(--color-paper)] transition-colors px-2"
              aria-label="Vaciar"
            >
              [×]
            </button>
            <button
              onClick={onCheckout}
              className="group inline-flex items-center gap-3 border border-[color:var(--color-paper)] bg-[color:var(--color-paper)] text-[color:var(--color-ink)] px-4 py-2.5 hover:bg-transparent hover:text-[color:var(--color-paper)] transition-colors"
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.22em]">Comprar</span>
              <span className="font-mono text-[10px] tracking-[0.22em] transition-transform group-hover:translate-x-1">→</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

// ─── Section label ────────────────────────────────────────────────────────────

const SectionLabel = memo(function SectionLabel({ label }: { index?: string; label: string }) {
  return (
    <div className="flex items-end justify-between mb-6 mt-2 gap-6">
      <div>
        <h3
          className="font-display italic font-light leading-[0.95] tracking-[-0.02em] text-[color:var(--color-ink)]"
          style={{ fontSize: "clamp(28px, 4vw, 48px)" }}
        >
          {label}
        </h3>
      </div>
      <div className="hidden md:block flex-1 h-px bg-[color:var(--color-grey-300)] mb-3" />
    </div>
  );
});

// ─── Analytics ───────────────────────────────────────────────────────────────

function trackEvent(type: string, collectionId: string) {
  void fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, collectionId }),
  }).catch(() => null);
}

// ─── Main FolderBrowser ───────────────────────────────────────────────────────

export function FolderBrowser({
  collectionId,
  pricePerBib,
}: {
  collectionId: string;
  pricePerBib: number;
}) {
  const PAGE_SIZE = 20;
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [galleryPage, setGalleryPage] = useState(0);
  const [faceActive, setFaceActive] = useState(false);
  const [faceStatus, setFaceStatus] = useState<
    "idle" | "uploading" | "done" | "no-face" | "error"
  >("idle");
  const [faceBibs, setFaceBibs] = useState<{ bib: string; photoIds: string[] }[] | null>(null);
  const [modal, setModal] = useState<{ bib: string; photoIds: string[]; allPhotoIds: string[]; totalPhotosInSearch: number } | null>(null);
  const [lightbox, setLightbox] = useState<{
    url: string;
    mimeType: string | null;
    filename: string | null;
    bibNumber: string | null;
    photoIds: string[];
    photoUrls: string[];
    currentIndex: number;
  } | null>(null);

  const { items: cartItems, inCart: isInCart, toggle: toggleCart, clear: clearCart } = useCart();
  const fileRef = useRef<HTMLInputElement>(null);

  // Stable ref for cartItems so the checkout listener never needs to re-subscribe
  const cartItemsRef = useRef(cartItems);
  useEffect(() => { cartItemsRef.current = cartItems; }, [cartItems]);

  // Stable cart-set ref for add-vs-remove detection without deps churn
  const cartSetRef = useRef(new Set<string>());
  useEffect(() => {
    cartSetRef.current = new Set(cartItems.map((i) => i.photoId));
  }, [cartItems]);

  // Track page visit on mount
  useEffect(() => { trackEvent("VISIT", collectionId); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Track bib searches
  useEffect(() => {
    if (debouncedSearch.length > 0) trackEvent("SEARCH_BIB", collectionId);
  }, [debouncedSearch, collectionId]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 280);
    return () => clearTimeout(t);
  }, [search]);

  const { data: allPhotos, isLoading: galleryLoading } = api.photo.listAll.useQuery({
    collectionId,
  });

  const hasSearch = debouncedSearch.length > 0;
  const { data: searchData, isLoading: searchLoading } = api.photo.searchByBib.useQuery(
    { collectionId, bib: debouncedSearch },
    { enabled: hasSearch },
  );

  // Memoize derived search arrays to avoid recreating them every render
  const exactPhotos = useMemo(
    () => searchData?.exact.flatMap((g) => g.photos.map((p) => ({ ...p, isFuzzy: false as const }))) ?? [],
    [searchData],
  );
  const fuzzyPhotos = useMemo(
    () => searchData?.fuzzy.flatMap((g) => g.photos.map((p) => ({ ...p, isFuzzy: true as const }))) ?? [],
    [searchData],
  );
  const allSearchPhotos = useMemo(() => [...exactPhotos, ...fuzzyPhotos], [exactPhotos, fuzzyPhotos]);
  const noResults = hasSearch && !searchLoading && allSearchPhotos.length === 0;

  const showingFace = faceActive && faceStatus === "done" && faceBibs !== null;

  // Memoize price map — recomputes only when allPhotos or pricePerBib changes
  const priceMap = useMemo(
    () =>
      new Map<string, number>(
        (allPhotos ?? []).map((p) => [p.id, p.price ?? pricePerBib]),
      ),
    [allPhotos, pricePerBib],
  );

  // Memoize visible photos list — drives both the grid and the batch URL query
  const visiblePhotos = useMemo(() => {
    if (hasSearch) {
      return allSearchPhotos.map((p) => ({
        id: p.id,
        bibNumber: p.bibNumber,
        price: p.price ?? pricePerBib,
        isFuzzy: p.isFuzzy,
      }));
    }
    if (showingFace) {
      return (faceBibs ?? []).flatMap((g) =>
        g.photoIds.map((id) => ({
          id,
          bibNumber: g.bib,
          price: priceMap.get(id) ?? pricePerBib,
          isFuzzy: false as const,
        })),
      );
    }
    const start = galleryPage * PAGE_SIZE;
    return (allPhotos ?? []).slice(start, start + PAGE_SIZE).map((p) => ({
      id: p.id,
      bibNumber: p.bibNumber,
      price: priceMap.get(p.id) ?? pricePerBib,
      isFuzzy: false as const,
    }));
  }, [hasSearch, allSearchPhotos, showingFace, faceBibs, allPhotos, priceMap, pricePerBib, galleryPage, PAGE_SIZE]);

  // Single batch URL query — converts N per-tile queries into 1 request
  const visibleIds = useMemo(() => visiblePhotos.map((p) => p.id), [visiblePhotos]);
  const { data: urlData } = api.photo.getPreviewUrls.useQuery(
    { ids: visibleIds },
    { enabled: visibleIds.length > 0, staleTime: 50 * 60 * 1000 }, // signed URLs live for 1hr
  );
  const urlMap = useMemo(
    () => new Map(urlData?.map((u) => [u.id, u.url]) ?? []),
    [urlData],
  );
  const mimeTypeMap = useMemo(
    () => new Map(urlData?.map((u) => [u.id, { mimeType: u.mimeType ?? null, filename: u.filename }]) ?? []),
    [urlData],
  );

  // Stable refs for lightbox handler (avoids stale closure without dep churn)
  const allPhotosRef = useRef(allPhotos);
  useEffect(() => { allPhotosRef.current = allPhotos; }, [allPhotos]);
  const visiblePhotosRef = useRef(visiblePhotos);
  useEffect(() => { visiblePhotosRef.current = visiblePhotos; }, [visiblePhotos]);
  const mimeTypeMapRef = useRef(mimeTypeMap);
  useEffect(() => { mimeTypeMapRef.current = mimeTypeMap; }, [mimeTypeMap]);

  // Stable handlers — same reference across renders, so memo'd tiles don't re-render
  const handleOpenLightbox = useCallback((photoId: string, bibNumber: string | null, url: string) => {
    const ap = allPhotosRef.current;
    const vp = visiblePhotosRef.current;
    const sameBibIds =
      bibNumber && ap
        ? ap.filter((ph) => ph.bibNumber === bibNumber).map((ph) => ph.id)
        : [photoId];
    const idx = vp.findIndex((v) => v.id === photoId);
    const meta = mimeTypeMapRef.current.get(photoId);
    setLightbox({
      url,
      mimeType: meta?.mimeType ?? null,
      filename: meta?.filename ?? null,
      bibNumber,
      photoIds: sameBibIds,
      photoUrls: [url],
      currentIndex: idx >= 0 ? idx : 0,
    });
  }, []);

  const handleToggleCart = useCallback(
    (photoId: string, bibNumber: string | null, url: string, price: number) => {
      const adding = !cartSetRef.current.has(photoId);
      toggleCart({ photoId, bibNumber, url, price });
      if (adding) trackEvent("CART_ADD", collectionId);
    },
    [toggleCart, collectionId],
  );

  const cartCheckout = useCallback(() => {
    const items = cartItemsRef.current;
    if (items.length === 0) return;
    const allBibs = [...new Set(items.map((i) => i.bibNumber).filter(Boolean))];
    const bib = allBibs.length === 1 ? (allBibs[0] ?? "") : "";
    const allVisible = visiblePhotosRef.current.map((p) => p.id);
    setModal({ bib, photoIds: items.map((i) => i.photoId), allPhotoIds: allVisible, totalPhotosInSearch: allVisible.length });
  }, []);

  // Checkout event listener — stable, never re-subscribes on cart changes
  useEffect(() => {
    const handler = () => cartCheckout();
    window.addEventListener("ivana:open-checkout", handler);
    return () => window.removeEventListener("ivana:open-checkout", handler);
  }, [cartCheckout]);

  const handleFaceUpload = async (file: File) => {
    setFaceStatus("uploading");
    try {
      let base64 = "";
      try {
        base64 = await new Promise<string>((res, rej) => {
          const img = new Image();
          const objectUrl = URL.createObjectURL(file);
          img.onload = () => {
            URL.revokeObjectURL(objectUrl);
            const MAX = 1200;
            const scale = Math.min(1, MAX / Math.max(img.width, img.height));
            const canvas = document.createElement("canvas");
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            const ctx = canvas.getContext("2d");
            if (!ctx) { rej(new Error("canvas-ctx")); return; }
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
            const b64 = dataUrl.split(",")[1];
            if (!b64) { rej(new Error("canvas-encode")); return; }
            res(b64);
          };
          img.onerror = (e) => { URL.revokeObjectURL(objectUrl); rej(e); };
          img.src = objectUrl;
        });
      } catch (canvasErr) {
        console.warn("[face-search] canvas compress failed:", canvasErr);
        base64 = await new Promise<string>((res, rej) => {
          const r = new FileReader();
          r.onload = () => {
            const b64 = (r.result as string).split(",")[1];
            b64 ? res(b64) : rej(new Error("read-encode"));
          };
          r.onerror = rej;
          r.readAsDataURL(file);
        });
      }

      const resp = await fetch("/api/face-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, collectionId }),
      });
      if (!resp.ok) throw new Error(`status ${resp.status}`);
      const json = (await resp.json()) as {
        groups: { bib: string; photoIds: string[] }[];
        noFaceDetected?: boolean;
      };
      if (json.noFaceDetected) {
        setFaceStatus("no-face");
        return;
      }
      setFaceBibs(json.groups);
      setFaceStatus("done");
      setFaceActive(true);
      trackEvent("SEARCH_FACE", collectionId);
    } catch (err) {
      console.error("[face-search] upload error:", err);
      setFaceStatus("error");
    }
  };

  const GRID = "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10";

  return (
    <section id="search" className="max-w-[1600px] mx-auto px-6 md:px-10 py-16 pb-32">
      {/* ── Search panel ───────────────────────────────────── */}
      <div className="mx-auto mb-20 max-w-3xl">
        <p className="eyebrow mb-5">Buscá tus fotos</p>
        <div className="border border-[color:var(--color-grey-300)] rounded-sm p-6 bg-white/40">
          <label className="block font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mb-3">
            Número
          </label>
          <div className="flex items-center gap-3 border-b-2 border-[color:var(--color-ink)] pb-3 focus-within:border-[color:var(--color-safelight)] transition-colors">
            <input
              type="text"
              inputMode="numeric"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ej: 1042"
              className="flex-1 bg-transparent border-0 outline-none font-display italic text-[44px] md:text-[72px] leading-none tracking-[-0.02em] text-[color:var(--color-ink)] placeholder:text-[color:var(--color-grey-300)]"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] hover:text-[color:var(--color-ink)] transition-colors shrink-0"
              >
                ×
              </button>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFaceUpload(f);
            }}
          />

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <p className="font-sans text-[14px] leading-[1.5] text-[color:var(--color-grey-700)] max-w-md">
              Ingresá tu número o usá la búsqueda por selfie.{" "}
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-grey-500)]">Las vistas previas tienen marca de agua.</span>
            </p>
            <button
              onClick={() => {
                if (faceStatus === "uploading") return;
                if (faceStatus === "done" || faceStatus === "error" || faceStatus === "no-face") {
                  setFaceStatus("idle");
                  setFaceBibs(null);
                  if (fileRef.current) fileRef.current.value = "";
                }
                fileRef.current?.click();
              }}
              disabled={faceStatus === "uploading"}
              className="group inline-flex items-center gap-3 border border-[color:var(--color-ink)] px-5 py-3 hover:bg-[color:var(--color-ink)] hover:text-[color:var(--color-paper)] transition-colors disabled:opacity-50"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <rect x="3" y="7" width="18" height="13" rx="2"/>
                <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"/>
                <circle cx="12" cy="13.5" r="2.5"/>
              </svg>
              <span className="font-mono text-[10px] uppercase tracking-[0.22em]">
                {faceStatus === "uploading" ? "Analizando…" : "Buscar con selfie"}
              </span>
              <span className="font-mono text-[10px] tracking-[0.22em] transition-transform group-hover:translate-x-1">
                →
              </span>
            </button>
          </div>

          {/* Status feedback */}
          {faceStatus === "done" && (
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)]">
              {faceBibs?.length
                ? `${faceBibs.length} coincidencia${faceBibs.length !== 1 ? "s" : ""}`
                : "Sin coincidencias"}{" "}
              ·{" "}
              <button
                onClick={() => {
                  setFaceStatus("idle");
                  setFaceBibs(null);
                  if (fileRef.current) fileRef.current.value = "";
                }}
                className="link-draw text-[color:var(--color-ink)]"
              >
                otra foto
              </button>
            </p>
          )}
          {faceStatus === "no-face" && (
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-safelight)]">
              No detectamos rostro ·{" "}
              <button
                onClick={() => { setFaceStatus("idle"); if (fileRef.current) fileRef.current.value = ""; }}
                className="underline underline-offset-4"
              >
                intentar otra
              </button>
            </p>
          )}
          {faceStatus === "error" && (
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-safelight)]">
              Error al procesar ·{" "}
              <button
                onClick={() => { setFaceStatus("idle"); if (fileRef.current) fileRef.current.value = ""; }}
                className="underline underline-offset-4"
              >
                reintentar
              </button>
            </p>
          )}
        </div>
      </div>

      {/* ── Face results ───────────────────────────────────── */}
      {showingFace && faceBibs && faceBibs.length > 0 && (
        <div className="mb-20">
          <SectionLabel label="Reconocimiento facial." />
          <div className={GRID}>
            {faceBibs.flatMap((g, gi) =>
              g.photoIds.map((id, pi) => (
                <PhotoTile
                  key={id}
                  photoId={id}
                  bibNumber={g.bib}
                  index={gi * 100 + pi}
                  price={priceMap.get(id) ?? pricePerBib}
                  inCart={isInCart(id)}
                  url={urlMap.get(id) ?? null}
                  mimeType={mimeTypeMap.get(id)?.mimeType}
                  filename={mimeTypeMap.get(id)?.filename}
                  onOpenLightbox={handleOpenLightbox}
                  onToggleCart={handleToggleCart}
                />
              )),
            )}
          </div>
        </div>
      )}

      {/* ── Bib search results ─────────────────────────────── */}
      {hasSearch && (
        <div className="mb-20">
          {searchLoading && (
            <div className={GRID}>
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-[color:var(--color-grey-300)] animate-pulse"
                  style={{ aspectRatio: "4/3" }}
                />
              ))}
            </div>
          )}
          {noResults && (
            <div className="border border-dashed border-[color:var(--color-grey-300)] py-24 text-center">
              <p className="eyebrow mb-3">Sin resultados</p>
              <p className="font-display italic text-[44px] leading-tight text-[color:var(--color-ink)]">
                #{debouncedSearch} no apareció.
              </p>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)]">
                Verificá el número o usá la búsqueda por selfie
              </p>
            </div>
          )}
          {!searchLoading && allSearchPhotos.length > 0 && (
            <>
              <SectionLabel label={`Dorsal #${debouncedSearch}.`} />
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mb-8">
                {exactPhotos.length} {exactPhotos.length === 1 ? "foto" : "fotos"}
                {fuzzyPhotos.length > 0 &&
                  ` · ${fuzzyPhotos.length} similar${fuzzyPhotos.length !== 1 ? "es" : ""}`}
              </p>
              <div className={GRID}>
                {allSearchPhotos.map((p, i) => (
                  <PhotoTile
                    key={p.id}
                    photoId={p.id}
                    bibNumber={p.bibNumber}
                    index={i}
                    price={p.price ?? pricePerBib}
                    inCart={isInCart(p.id)}
                    isFuzzy={p.isFuzzy}
                    url={urlMap.get(p.id) ?? null}
                    mimeType={mimeTypeMap.get(p.id)?.mimeType}
                    filename={mimeTypeMap.get(p.id)?.filename}
                    onOpenLightbox={handleOpenLightbox}
                    onToggleCart={handleToggleCart}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Full gallery ───────────────────────────────────── */}
      {!hasSearch && !showingFace && (
        <>
          {galleryLoading ? (
            <div className={GRID}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-[color:var(--color-grey-300)] animate-pulse"
                  style={{ aspectRatio: "4/3" }}
                />
              ))}
            </div>
          ) : allPhotos && allPhotos.length > 0 ? (
            <>
              <SectionLabel label="Fotos del evento." />
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mb-8">
                {String(allPhotos.length).padStart(3, "0")} fotografías · clic para previsualizar
              </p>
              <div className={GRID}>
                {visiblePhotos.map((p, i) => (
                  <PhotoTile
                    key={p.id}
                    photoId={p.id}
                    bibNumber={p.bibNumber}
                    index={galleryPage * PAGE_SIZE + i}
                    price={p.price}
                    inCart={isInCart(p.id)}
                    url={urlMap.get(p.id) ?? null}
                    mimeType={mimeTypeMap.get(p.id)?.mimeType}
                    filename={mimeTypeMap.get(p.id)?.filename}
                    onOpenLightbox={handleOpenLightbox}
                    onToggleCart={handleToggleCart}
                  />
                ))}
              </div>
              {allPhotos.length > PAGE_SIZE && (
                <div className="mt-12 flex items-center justify-between border-t border-[color:var(--color-grey-300)] pt-6">
                  <button
                    onClick={() => { setGalleryPage((p) => p - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    disabled={galleryPage === 0}
                    className="group inline-flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-ink)] disabled:text-[color:var(--color-grey-400)] disabled:pointer-events-none transition-colors"
                  >
                    <span className="transition-transform group-hover:-translate-x-1">←</span>
                    <span>Anterior</span>
                  </button>
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)]">
                    {galleryPage + 1} / {Math.ceil(allPhotos.length / PAGE_SIZE)}
                  </p>
                  <button
                    onClick={() => { setGalleryPage((p) => p + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    disabled={(galleryPage + 1) * PAGE_SIZE >= allPhotos.length}
                    className="group inline-flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-ink)] disabled:text-[color:var(--color-grey-400)] disabled:pointer-events-none transition-colors"
                  >
                    <span>Siguiente</span>
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="border border-dashed border-[color:var(--color-grey-300)] py-24 text-center">
              <p className="eyebrow mb-3">Estado</p>
              <p className="font-display italic text-[44px] leading-tight">Próximamente.</p>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)]">
                Las fotografías aparecerán acá
              </p>
            </div>
          )}
        </>
      )}

      {/* ── Lightbox ───────────────────────────────────────── */}
      <Lightbox
        open={lightbox !== null}
        url={lightbox?.url ?? null}
        mimeType={lightbox?.mimeType ?? null}
        filename={lightbox?.filename ?? null}
        onClose={() => setLightbox(null)}
        caption={
          lightbox && (
            <div className="flex items-center justify-between gap-4 max-w-[1600px] mx-auto">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-paper)]/60">
                  {lightbox.bibNumber ? "Dorsal" : "Sin dorsal"}
                </p>
                <p className="font-display italic text-[24px] text-[color:var(--color-paper)]">
                  {lightbox.bibNumber ? `#${lightbox.bibNumber}` : "—"}
                </p>
              </div>
              <button
                onClick={() => {
                  setModal({
                    bib: lightbox.bibNumber ?? "",
                    photoIds: lightbox.photoIds,
                    allPhotoIds: lightbox.photoIds,
                    totalPhotosInSearch: lightbox.photoIds.length,
                  });
                  setLightbox(null);
                }}
                className="group inline-flex items-center gap-3 border border-[color:var(--color-paper)] bg-[color:var(--color-paper)] text-[color:var(--color-ink)] px-5 py-3 hover:bg-transparent hover:text-[color:var(--color-paper)] transition-colors"
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.22em]">Comprar foto</span>
                <span className="font-mono text-[10px] tracking-[0.22em] transition-transform group-hover:translate-x-1">→</span>
              </button>
            </div>
          )
        }
      />

      {/* ── Floating cart bar ──────────────────────────────── */}
      <CartBar
        count={cartItems.length}
        total={cartItems.reduce((sum, i) => sum + i.price, 0)}
        onCheckout={cartCheckout}
        onClear={clearCart}
      />

      {/* ── Checkout modal ─────────────────────────────────── */}
      {modal && (
        <BibCheckoutModal
          bib={modal.bib}
          photoIds={modal.photoIds}
          allPhotoIds={modal.allPhotoIds}
          totalPhotosInSearch={modal.totalPhotosInSearch}
          collectionId={collectionId}
          onClose={() => setModal(null)}
        />
      )}
    </section>
  );
}
