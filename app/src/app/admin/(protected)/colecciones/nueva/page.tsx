"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { EventCard } from "~/app/_components/EventCard";

const MONTHS = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => currentYear - 1 + i);

// ── DatePicker ────────────────────────────────────────────────────────────────

function DatePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  // Local state for each part — emit only when all three are set
  const [day, setDay] = useState(() => value ? String(parseInt(value.split("-")[2] ?? "0")) : "");
  const [month, setMonth] = useState(() => value ? String(parseInt(value.split("-")[1] ?? "0") - 1) : "");
  const [year, setYear] = useState(() => value ? (value.split("-")[0] ?? "") : "");

  const daysInMonth = month !== "" && year !== ""
    ? new Date(parseInt(year), parseInt(month) + 1, 0).getDate()
    : 31;

  const emit = (d: string, m: string, y: string) => {
    if (d && m !== "" && y) {
      const dayNum = parseInt(d);
      const maxDay = new Date(parseInt(y), parseInt(m) + 1, 0).getDate();
      const safeDay = String(Math.min(dayNum, maxDay)).padStart(2, "0");
      onChange(`${y}-${String(parseInt(m) + 1).padStart(2, "0")}-${safeDay}`);
    } else {
      onChange("");
    }
  };

  const handleDay = (d: string) => { setDay(d); emit(d, month, year); };
  const handleMonth = (m: string) => {
    setMonth(m);
    // Clamp day if needed when month changes
    if (day && year && m !== "") {
      const maxDay = new Date(parseInt(year), parseInt(m) + 1, 0).getDate();
      const clamped = String(Math.min(parseInt(day), maxDay));
      setDay(clamped);
      emit(clamped, m, year);
    } else {
      emit(day, m, year);
    }
  };
  const handleYear = (y: string) => { setYear(y); emit(day, month, y); };

  const sel = "flex-1 appearance-none bg-white border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all cursor-pointer";
  return (
    <div className="flex gap-2">
      <select className={sel} value={day} onChange={(e) => handleDay(e.target.value)}>
        <option value="">Día</option>
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => <option key={d} value={String(d)}>{d}</option>)}
      </select>
      <select className={`${sel} flex-[2]`} value={month} onChange={(e) => handleMonth(e.target.value)}>
        <option value="">Mes</option>
        {MONTHS.map((m, i) => <option key={i} value={String(i)}>{m}</option>)}
      </select>
      <select className={sel} value={year} onChange={(e) => handleYear(e.target.value)}>
        <option value="">Año</option>
        {YEARS.map((y) => <option key={y} value={String(y)}>{y}</option>)}
      </select>
    </div>
  );
}

// ── Image uploader (banner or logo) ──────────────────────────────────────────

function ImageUpload({
  label,
  hint,
  value,
  onChange,
  uploading,
  onUpload,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (url: string) => void;
  uploading: boolean;
  onUpload: (file: File) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    void onUpload(file);
  };

  return (
    <div>
      <label className="block text-gray-600 text-sm font-medium mb-1.5">{label}</label>
      <p className="text-xs text-gray-400 mb-2">{hint}</p>
      <div className="flex items-center gap-3">
        {value ? (
          <div className="relative w-16 h-10 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 text-white flex items-center justify-center text-xs leading-none"
            >×</button>
          </div>
        ) : null}
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
        >
          {uploading ? (
            <div className="w-4 h-4 rounded-full border-2 border-gray-300 border-t-blue-500 animate-spin" />
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          )}
          {uploading ? "Subiendo..." : value ? "Cambiar" : "Subir imagen"}
        </button>
        {value && (
          <span className="text-xs text-green-600 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Subida
          </span>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
    </div>
  );
}

// ── Draggable banner preview ──────────────────────────────────────────────────

function BannerDragger({
  bannerUrl,
  focalY,
  onChange,
}: {
  bannerUrl: string;
  focalY: number;
  onChange: (y: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const startY = useRef(0);
  const startFocal = useRef(0);

  const clamp = (v: number) => Math.min(1, Math.max(0, v));

  const handleMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    startY.current = e.clientY;
    startFocal.current = focalY;
    e.preventDefault();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    dragging.current = true;
    startY.current = e.touches[0]!.clientY;
    startFocal.current = focalY;
  };

  // Global move/up via useEffect so cleanup is guaranteed
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const delta = e.clientY - startY.current;
      const frac = delta / containerRef.current.clientHeight;
      onChange(clamp(startFocal.current + frac));
    };
    const onUp = () => { dragging.current = false; };
    const onTouchMove = (e: TouchEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const delta = e.touches[0]!.clientY - startY.current;
      const frac = delta / containerRef.current.clientHeight;
      onChange(clamp(startFocal.current + frac));
    };
    const onTouchEnd = () => { dragging.current = false; };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [onChange]);

  return (
    <div
      ref={containerRef}
      className="relative h-44 rounded-t-2xl overflow-hidden cursor-ns-resize select-none"
      style={{ background: "#e2e8f0" }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={bannerUrl}
        alt=""
        draggable={false}
        className="w-full h-full object-cover pointer-events-none"
        style={{ objectPosition: `center ${Math.round(focalY * 100)}%` }}
      />
      {/* Drag hint overlay */}
      <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center pointer-events-none">
        <div className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl bg-black/50 text-white text-xs font-medium">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
          </svg>
          Arrastrá para reencuadrar
        </div>
      </div>
      {/* Focal line indicator */}
      <div
        className="absolute left-0 right-0 h-px bg-white/60 pointer-events-none"
        style={{ top: `${focalY * 100}%` }}
      />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const inputClass = "w-full rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all border border-gray-200 bg-white";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-gray-600 text-sm font-medium mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export default function NewCollectionPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    description: "",
    slug: "",
    eventDate: "",
    pricePerBib: "",
    isPublished: false,
    bannerUrl: "",
    logoUrl: "",
    bannerFocalY: 0.5,
  });
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const create = api.collection.create.useMutation({
    onSuccess: (col) => router.push(`/admin/colecciones/${col.id}`),
  });

  const handleTitleChange = (title: string) => {
    setForm((f) => ({
      ...f,
      title,
      slug: title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, ""),
    }));
  };

  const [keys, setKeys] = useState({ bannerKey: "", logoKey: "" });

  const uploadImageWithKey = async (file: File, type: "banner" | "logo") => {
    const setter = type === "banner" ? setUploadingBanner : setUploadingLogo;
    setter(true);
    try {
      const path = `_collections/${type}/${Date.now()}-${file.name}`;
      const signRes = await fetch("/api/uploads/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
      if (!signRes.ok) return;
      const { signedUrl } = await signRes.json() as { signedUrl: string };
      const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadRes.ok) return;

      // Build local preview from blob
      const previewUrl = URL.createObjectURL(file);
      setForm((f) => ({ ...f, [type === "banner" ? "bannerUrl" : "logoUrl"]: previewUrl }));
      setKeys((k) => ({ ...k, [type === "banner" ? "bannerKey" : "logoKey"]: path }));
    } finally {
      setter(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const price = parseFloat(form.pricePerBib);
    create.mutate({
      title: form.title,
      description: form.description || undefined,
      slug: form.slug,
      eventDate: form.eventDate || undefined,
      pricePerBib: isNaN(price) ? undefined : price,
      isPublished: form.isPublished,
      bannerUrl: keys.bannerKey || undefined,
      logoUrl: keys.logoKey || undefined,
      bannerFocalY: form.bannerFocalY,
    });
  };

  const previewCol = {
    title: form.title || "Nombre del evento",
    description: form.description || null,
    slug: form.slug,
    eventDate: form.eventDate ? new Date(form.eventDate) : null,
    coverUrl: null,
    bannerUrl: form.bannerUrl || null,
    logoUrl: form.logoUrl || null,
    bannerFocalY: form.bannerFocalY,
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 items-start">

      {/* ── Form ── */}
      <div className="max-w-xl w-full">
        <button onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Volver a eventos
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">Crear evento</h1>
        <p className="text-gray-500 text-sm mb-8">Completá los datos — la previsualización se actualiza en tiempo real.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Field label="Nombre del evento *">
            <input value={form.title} onChange={(e) => handleTitleChange(e.target.value)}
              required placeholder="ej. Maratón Rosario 2025" className={inputClass} />
          </Field>

          <Field label="Fecha del evento">
            <DatePicker value={form.eventDate} onChange={(v) => setForm((f) => ({ ...f, eventDate: v }))} />
          </Field>

          <Field label="Precio por dorsal (ARS)">
            <input type="number" min="0" step="100" value={form.pricePerBib}
              onChange={(e) => setForm((f) => ({ ...f, pricePerBib: e.target.value }))}
              placeholder="ej. 5000" className={inputClass} />
          </Field>

          <Field label="Descripción">
            <textarea value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3} placeholder="Descripción breve del evento..." className={inputClass} />
          </Field>

          <Field label="URL (slug) *">
            <input value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))}
              required placeholder="maraton-rosario-2025" className={inputClass} />
            <p className="text-gray-400 text-xs mt-1.5">URL pública: /colecciones/{form.slug || "..."}</p>
          </Field>

          {/* ── Images ── */}
          <div className="border-t border-gray-100 pt-5">
            <p className="text-gray-700 text-sm font-semibold mb-4">Imágenes del evento</p>
            <div className="flex flex-col gap-5">
              <ImageUpload
                label="Banner (fondo de la tarjeta)"
                hint="Imagen horizontal, mínimo 800×400px. Podés reencuadrar arrastrando la previsualización."
                value={form.bannerUrl}
                onChange={(url) => { setForm((f) => ({ ...f, bannerUrl: url })); if (!url) setKeys((k) => ({ ...k, bannerKey: "" })); }}
                uploading={uploadingBanner}
                onUpload={(file) => uploadImageWithKey(file, "banner")}
              />
              <ImageUpload
                label="Logo del evento (círculo central)"
                hint="Imagen cuadrada o circular, mínimo 200×200px."
                value={form.logoUrl}
                onChange={(url) => { setForm((f) => ({ ...f, logoUrl: url })); if (!url) setKeys((k) => ({ ...k, logoKey: "" })); }}
                uploading={uploadingLogo}
                onUpload={(file) => uploadImageWithKey(file, "logo")}
              />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-blue-50 transition-colors">
            <div className="relative">
              <input type="checkbox" checked={form.isPublished}
                onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
                className="sr-only" />
              <div className="w-10 h-5 rounded-full transition-colors"
                style={{ background: form.isPublished ? "#2563eb" : "#e2e8f0" }}>
                <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                  style={{ left: form.isPublished ? "22px" : "2px" }} />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Publicar inmediatamente</p>
              <p className="text-xs text-gray-400">El evento será visible en el sitio público</p>
            </div>
          </label>

          {create.isError && (
            <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100">
              <p className="text-red-600 text-sm">Error al crear. Revisá que el slug no esté en uso.</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit"
              disabled={create.isPending || !form.title || !form.slug}
              className="disabled:opacity-50 font-semibold text-white text-sm px-6 py-3 rounded-xl transition-all hover:opacity-90 shadow-sm"
              style={{ background: "linear-gradient(135deg, #1a3a6b, #2563eb)" }}>
              {create.isPending ? "Creando..." : "Crear evento →"}
            </button>
            <button type="button" onClick={() => router.back()}
              className="text-gray-500 hover:text-gray-800 px-6 py-3 rounded-xl transition-colors border border-gray-200 hover:border-gray-300 text-sm">
              Cancelar
            </button>
          </div>
        </form>
      </div>

      {/* ── Live preview ── */}
      <div className="hidden xl:block" style={{ position: "sticky", top: 0, alignSelf: "start" }}>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Vista previa de la tarjeta</p>
        <div className="max-w-xs mx-auto xl:mx-0">
          {/* Intercept the card's banner area with a draggable version */}
          {form.bannerUrl ? (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-visible flex flex-col">
              {/* Draggable banner */}
              <div className="relative">
                <BannerDragger
                  bannerUrl={form.bannerUrl}
                  focalY={form.bannerFocalY}
                  onChange={(y) => setForm((f) => ({ ...f, bannerFocalY: y }))}
                />
                <div
                  className="absolute -bottom-14 left-1/2 -translate-x-1/2 z-10 w-28 h-28 rounded-full border-4 border-white shadow-xl overflow-hidden flex items-center justify-center"
                  style={{ background: form.logoUrl ? "#fff" : "#0057A8" }}
                >
                  {form.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.logoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </div>
              </div>
              {/* Rest of card */}
              <div className="pt-20 pb-5 px-5 flex flex-col flex-1 text-center">
                <h3 className="font-display font-700 uppercase text-gray-900 text-xl leading-tight mb-1">
                  {form.title || <span className="text-gray-300">Nombre del evento</span>}
                </h3>
                {form.eventDate && (
                  <p className="text-xs font-semibold mb-1" style={{ color: "#0057A8" }}>
                    {new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(form.eventDate))}
                  </p>
                )}
                {form.description && <p className="text-sm text-gray-500 mb-3 line-clamp-2">{form.description}</p>}
                <div className="mt-auto">
                  <div className="block w-full py-3 rounded-xl font-display font-700 uppercase tracking-wider text-white text-sm text-center"
                    style={{ background: "linear-gradient(135deg, #0057A8, #003D7A)" }}>
                    Explorar fotos →
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400 text-center pb-2">Arrastrá el banner para reencuadrar</p>
            </div>
          ) : (
            <EventCard col={previewCol} preview />
          )}
        </div>
        <p className="text-xs text-gray-300 text-center xl:text-left mt-3">Se actualiza mientras escribís</p>
      </div>
    </div>
  );
}
