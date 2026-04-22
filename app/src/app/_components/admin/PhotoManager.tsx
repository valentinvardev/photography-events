"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { ConfirmModal } from "./ConfirmModal";

type Photo = {
  id: string;
  filename: string;
  bibNumber: string | null;
  storageKey: string;
  url: string | null;
  price: number | null;
};

// ── Shimmer skeleton ──────────────────────────────────────────────────────────

function PhotoSkeleton() {
  return (
    <div className="relative rounded-xl overflow-hidden aspect-square bg-gray-100 animate-pulse">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <div className="absolute inset-0"
        style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)", animation: "shimmer 1.4s infinite" }} />
    </div>
  );
}

// ── Multi-bib editor ──────────────────────────────────────────────────────────

function MultiBibEditor({ photo }: { photo: Photo }) {
  const router = useRouter();
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [inputVal, setInputVal] = useState("");

  const setBib = api.photo.setBibNumber.useMutation({ onSuccess: () => router.refresh() });
  const bibs = photo.bibNumber ? photo.bibNumber.split(",").map((b) => b.trim()).filter(Boolean) : [];

  const saveBibs = (newBibs: string[]) => {
    const val = newBibs.filter(Boolean).join(",") || null;
    if (val !== photo.bibNumber) setBib.mutate({ id: photo.id, bibNumber: val });
    setEditingIdx(null); setInputVal("");
  };

  const commitEdit = () => {
    const val = inputVal.trim();
    if (editingIdx === -1) {
      if (val && !bibs.includes(val)) saveBibs([...bibs, val]);
      else { setEditingIdx(null); setInputVal(""); }
    } else if (editingIdx !== null && editingIdx >= 0) {
      saveBibs(bibs.map((b, i) => (i === editingIdx ? val : b)).filter(Boolean));
    }
  };

  const sharedInput = (
    <input autoFocus type="text" value={inputVal} onChange={(e) => setInputVal(e.target.value)}
      onBlur={commitEdit}
      onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") commitEdit(); if (e.key === "Escape") { setEditingIdx(null); setInputVal(""); } }}
      onClick={(e) => e.stopPropagation()}
      placeholder="dorsal"
      className="w-16 text-xs px-1.5 py-0.5 rounded border border-blue-400 bg-white text-gray-800 focus:outline-none"
      style={{ minWidth: 0 }} />
  );

  return (
    <div className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
      {bibs.map((bib, idx) =>
        editingIdx === idx ? sharedInput : (
          <span key={idx} className="inline-flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded"
            style={{ background: "rgba(0,0,0,0.65)", color: "#fbbf24" }}>
            #{bib}
            <button onClick={(e) => { e.stopPropagation(); setInputVal(bib); setEditingIdx(idx); }}
              className="ml-0.5 opacity-60 hover:opacity-100">
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.5-6.5a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-1.414a2 2 0 01.586-1.414z" /></svg>
            </button>
            <button onClick={(e) => { e.stopPropagation(); saveBibs(bibs.filter((_, i) => i !== idx)); }}
              className="ml-0.5 opacity-60 hover:text-red-400 hover:opacity-100">
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </span>
        )
      )}
      {editingIdx === -1 ? sharedInput : (
        <button onClick={(e) => { e.stopPropagation(); setInputVal(""); setEditingIdx(-1); }}
          className="text-xs px-1.5 py-0.5 rounded font-semibold transition-all hover:bg-white/20"
          style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.75)", border: "1px dashed rgba(255,255,255,0.35)" }}>
          + dorsal
        </button>
      )}
      {setBib.isPending && <span className="text-xs text-white/50">guardando...</span>}
    </div>
  );
}

// ── Lightbox bib editor ────────────────────────────────────────────────────────

function LightboxBibEditor({ photo }: { photo: Photo }) {
  const router = useRouter();
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [inputVal, setInputVal] = useState("");

  const setBib = api.photo.setBibNumber.useMutation({ onSuccess: () => router.refresh() });
  const bibs = photo.bibNumber ? photo.bibNumber.split(",").map((b) => b.trim()).filter(Boolean) : [];

  const saveBibs = (newBibs: string[]) => {
    const val = newBibs.filter(Boolean).join(",") || null;
    if (val !== photo.bibNumber) setBib.mutate({ id: photo.id, bibNumber: val });
    setEditingIdx(null); setInputVal("");
  };

  const commitEdit = () => {
    const val = inputVal.trim();
    if (editingIdx === -1) {
      if (val && !bibs.includes(val)) saveBibs([...bibs, val]);
      else { setEditingIdx(null); setInputVal(""); }
    } else if (editingIdx !== null && editingIdx >= 0) {
      saveBibs(bibs.map((b, i) => (i === editingIdx ? val : b)).filter(Boolean));
    }
  };

  const input = (
    <input autoFocus type="text" value={inputVal} onChange={(e) => setInputVal(e.target.value)}
      onBlur={commitEdit}
      onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") commitEdit(); if (e.key === "Escape") { setEditingIdx(null); setInputVal(""); } }}
      onClick={(e) => e.stopPropagation()}
      placeholder="dorsal"
      className="w-16 text-xs px-1.5 py-0.5 rounded border border-blue-400 bg-white text-gray-800 focus:outline-none" />
  );

  return (
    <div className="flex flex-wrap items-center gap-1" onClick={(e) => e.stopPropagation()}>
      {bibs.map((bib, idx) =>
        editingIdx === idx ? input : (
          <span key={idx} className="inline-flex items-center gap-0.5 text-xs font-bold px-2 py-1 rounded-full"
            style={{ background: "rgba(251,191,36,0.2)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.4)" }}>
            #{bib}
            <button onClick={(e) => { e.stopPropagation(); setInputVal(bib); setEditingIdx(idx); }} className="ml-0.5 opacity-60 hover:opacity-100">
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.5-6.5a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-1.414a2 2 0 01.586-1.414z" /></svg>
            </button>
            <button onClick={(e) => { e.stopPropagation(); saveBibs(bibs.filter((_, i) => i !== idx)); }} className="ml-0.5 opacity-60 hover:text-red-400 hover:opacity-100">
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </span>
        )
      )}
      {editingIdx === -1 ? input : (
        <button onClick={(e) => { e.stopPropagation(); setInputVal(""); setEditingIdx(-1); }}
          className="text-xs px-2 py-1 rounded-full font-semibold"
          style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", border: "1px dashed rgba(255,255,255,0.3)" }}>
          + dorsal
        </button>
      )}
    </div>
  );
}

// ── Price editor ──────────────────────────────────────────────────────────────

function PriceEditor({ photo }: { photo: Photo }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");

  const setPrice = api.photo.setPrice.useMutation({ onSuccess: () => router.refresh() });

  const commit = () => {
    setEditing(false);
    const trimmed = inputVal.trim();
    const parsed = trimmed === "" ? null : parseFloat(trimmed.replace(",", "."));
    if (trimmed === "" && photo.price === null) return;
    if (parsed !== null && isNaN(parsed)) return;
    const newVal = parsed !== null && parsed > 0 ? parsed : null;
    if (newVal === photo.price) return;
    setPrice.mutate({ id: photo.id, price: newVal });
  };

  if (editing) {
    return (
      <input
        autoFocus
        type="text"
        inputMode="decimal"
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Enter") commit();
          if (e.key === "Escape") { setEditing(false); setInputVal(""); }
        }}
        onClick={(e) => e.stopPropagation()}
        placeholder="precio"
        className="w-20 text-xs px-1.5 py-0.5 rounded border border-emerald-400 bg-white text-gray-800 focus:outline-none"
      />
    );
  }

  return (
    <button
      onClick={(e) => { e.stopPropagation(); setInputVal(photo.price !== null ? String(photo.price) : ""); setEditing(true); }}
      className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded transition-all hover:bg-white/20"
      style={
        photo.price !== null
          ? { background: "rgba(16,185,129,0.2)", color: "#10b981", border: "1px solid rgba(16,185,129,0.4)" }
          : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", border: "1px dashed rgba(255,255,255,0.25)" }
      }
    >
      {photo.price !== null ? `$${photo.price.toLocaleString("es-AR")}` : "+ precio"}
      {setPrice.isPending && <span className="opacity-50">…</span>}
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function PhotoManager({
  collectionId,
  photos,
  page,
  totalPages,
  totalCount,
  q,
}: {
  collectionId: string;
  photos: Photo[];
  page: number;
  totalPages: number;
  totalCount: number;
  q: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [singleConfirm, setSingleConfirm] = useState<string | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [search, setSearch] = useState(q);

  const del = api.photo.delete.useMutation({ onSuccess: () => router.refresh() });
  const bulkDelete = api.photo.bulkDelete.useMutation({
    onSuccess: () => { setSelected(new Set()); setSelectMode(false); router.refresh(); },
  });

  const navigate = (newPage: number, newQ?: string) => {
    const params = new URLSearchParams();
    if (newPage > 1) params.set("page", String(newPage));
    const query = newQ ?? search;
    if (query) params.set("q", query);
    const qs = params.toString();
    startTransition(() => {
      router.push(`/admin/colecciones/${collectionId}${qs ? `?${qs}` : ""}`);
    });
  };

  const handleSearch = (val: string) => {
    setSearch(val);
    navigate(1, val);
  };

  const toggleSelect = (id: string) => setSelected((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const closeLightbox = useCallback(() => setLightboxIdx(null), []);
  const prevPhoto = useCallback(() => setLightboxIdx((i) => i !== null ? (i - 1 + photos.length) % photos.length : null), [photos.length]);
  const nextPhoto = useCallback(() => setLightboxIdx((i) => i !== null ? (i + 1) % photos.length : null), [photos.length]);

  useEffect(() => {
    if (lightboxIdx === null) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prevPhoto();
      if (e.key === "ArrowRight") nextPhoto();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [lightboxIdx, closeLightbox, prevPhoto, nextPhoto]);

  const singlePhoto = singleConfirm ? photos.find((p) => p.id === singleConfirm) : null;
  const currentPhoto = lightboxIdx !== null ? photos[lightboxIdx] : null;

  return (
    <div className={isPending ? "opacity-60 pointer-events-none transition-opacity" : ""}>
      {/* Toolbar: search + select */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {/* Bib search */}
        <div className="relative flex-1 min-w-[140px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            inputMode="numeric"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Buscar dorsal..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400 outline-none focus:border-blue-300 focus:bg-white transition-all"
          />
        </div>

        <p className="text-xs text-gray-400 shrink-0">{totalCount} foto{totalCount !== 1 ? "s" : ""}</p>

        <div className="flex items-center gap-1.5 shrink-0">
          {selectMode && selected.size > 0 && (
            <button onClick={() => setBulkConfirm(true)} disabled={bulkDelete.isPending}
              className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
              style={{ background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca" }}>
              {bulkDelete.isPending ? "Eliminando..." : `Eliminar (${selected.size})`}
            </button>
          )}
          {selectMode ? (
            <div className="flex gap-1">
              <button onClick={() => setSelected(selected.size === photos.length ? new Set() : new Set(photos.map((p) => p.id)))}
                className="px-3 py-1.5 rounded-lg text-xs border border-gray-200 text-gray-600 hover:text-gray-900">
                {selected.size === photos.length ? "Ninguna" : "Todas"}
              </button>
              <button onClick={() => { setSelectMode(false); setSelected(new Set()); }}
                className="px-3 py-1.5 rounded-lg text-xs border border-gray-200 text-gray-600 hover:text-gray-900">
                Cancelar
              </button>
            </div>
          ) : (
            <button onClick={() => setSelectMode(true)}
              className="px-3 py-1.5 rounded-lg text-xs border border-gray-200 text-gray-600 hover:text-gray-900">
              Seleccionar
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {photos.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-gray-400 text-sm">{q ? `Sin resultados para "${q}"` : "Subí fotos para empezar"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {photos.map((photo, i) => {
            const isSelected = selected.has(photo.id);
            const bibs = photo.bibNumber ? photo.bibNumber.split(",").map((b) => b.trim()).filter(Boolean) : [];

            return (
              <div key={photo.id}
                className="relative group rounded-xl overflow-hidden aspect-square cursor-pointer"
                style={{
                  background: "#f1f5f9",
                  border: `2px solid ${isSelected ? "#2563eb" : bibs.length === 0 ? "#fde68a" : "transparent"}`,
                  transition: "border-color 0.15s",
                }}
                onClick={() => selectMode ? toggleSelect(photo.id) : setLightboxIdx(i)}
              >
                {photo.url ? (
                  <img src={photo.url} alt={photo.filename}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : (
                  <PhotoSkeleton />
                )}

                {/* Bib + price badges */}
                <div className="absolute top-1.5 left-1.5 z-10 flex flex-col gap-1 transition-opacity duration-200 group-hover:opacity-0">
                  {bibs.length > 0 ? (
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                      style={{ background: "rgba(0,0,0,0.6)", color: "#fbbf24" }}>
                      #{bibs[0]}{bibs.length > 1 ? ` +${bibs.length - 1}` : ""}
                    </span>
                  ) : (
                    <span className="text-xs px-1.5 py-0.5 rounded"
                      style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px dashed #ef444460" }}>
                      sin dorsal
                    </span>
                  )}
                  {photo.price !== null && (
                    <span className="text-xs px-1.5 py-0.5 rounded"
                      style={{ background: "rgba(16,185,129,0.25)", color: "#10b981" }}>
                      ${photo.price.toLocaleString("es-AR")}
                    </span>
                  )}
                </div>

                {/* Select checkbox */}
                {selectMode && (
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center z-10"
                    style={{ background: isSelected ? "#2563eb" : "rgba(255,255,255,0.8)", border: `2px solid ${isSelected ? "#2563eb" : "rgba(0,0,0,0.2)"}` }}>
                    {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </div>
                )}

                {/* Hover overlay */}
                {!selectMode && (
                  <div className="absolute inset-0 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20"
                    style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 55%, transparent 100%)" }}>
                    <div className="absolute top-1.5 right-1.5">
                      <button onClick={(e) => { e.stopPropagation(); setSingleConfirm(photo.id); }}
                        disabled={del.isPending}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50"
                        style={{ background: "rgba(239,68,68,0.25)", color: "#f87171" }}>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <div className="p-2 flex flex-col gap-1">
                      <MultiBibEditor photo={photo} />
                      <PriceEditor photo={photo} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-5 pt-4 border-t border-gray-100">
          <button onClick={() => navigate(page - 1)} disabled={page <= 1}
            className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .reduce<(number | "…")[]>((acc, p, i, arr) => {
              if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === "…" ? (
                <span key={`ellipsis-${i}`} className="w-8 text-center text-xs text-gray-400">…</span>
              ) : (
                <button key={p} onClick={() => navigate(p as number)}
                  className="w-8 h-8 rounded-lg text-xs font-medium transition-all"
                  style={p === page
                    ? { background: "#0057A8", color: "#fff" }
                    : { border: "1px solid #e5e7eb", color: "#6b7280" }}>
                  {p}
                </button>
              )
            )}

          <button onClick={() => navigate(page + 1)} disabled={page >= totalPages}
            className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      )}

      {bulkConfirm && <ConfirmModal title={`Eliminar ${selected.size} fotos`} message="Esta acción no se puede deshacer." onConfirm={() => { setBulkConfirm(false); bulkDelete.mutate({ ids: Array.from(selected) }); }} onCancel={() => setBulkConfirm(false)} />}
      {singleConfirm && singlePhoto && <ConfirmModal title="Eliminar foto" message={`Se eliminará "${singlePhoto.filename}".`} onConfirm={() => { setSingleConfirm(null); del.mutate({ id: singleConfirm }); }} onCancel={() => setSingleConfirm(null)} />}

      {/* Lightbox */}
      {lightboxIdx !== null && currentPhoto && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.95)" }} onClick={closeLightbox}>
          <div className="flex items-center justify-between px-5 py-3 flex-shrink-0 gap-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={(e) => e.stopPropagation()}>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{currentPhoto.filename}</p>
              <p className="text-xs mt-0.5" style={{ color: currentPhoto.bibNumber ? "#fbbf24" : "#f87171" }}>
                {currentPhoto.bibNumber ? currentPhoto.bibNumber.split(",").map(b => `#${b.trim()}`).join(" · ") : "Sin dorsal identificado"}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <LightboxBibEditor photo={currentPhoto} />
              <PriceEditor photo={currentPhoto} />
              <button onClick={closeLightbox} className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 text-white flex-shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center relative px-14" onClick={(e) => e.stopPropagation()}>
            {currentPhoto.url ? (
              <img src={currentPhoto.url} alt={currentPhoto.filename}
                className="max-w-full max-h-full object-contain" style={{ maxHeight: "calc(100vh - 130px)" }} draggable={false} />
            ) : (
              <div className="w-48 h-48 rounded-2xl bg-gray-800 animate-pulse flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                </svg>
              </div>
            )}
            {photos.length > 1 && (
              <>
                <button onClick={prevPhoto} className="absolute left-3 w-10 h-10 rounded-full flex items-center justify-center bg-white/10 text-white">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button onClick={nextPhoto} className="absolute right-3 w-10 h-10 rounded-full flex items-center justify-center bg-white/10 text-white">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
