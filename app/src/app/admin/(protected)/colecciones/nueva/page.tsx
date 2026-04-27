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

  const sel = "flex-1 appearance-none bg-[color:var(--color-paper)] border border-[color:var(--color-grey-300)] px-3 py-2.5 font-mono text-[11px] tracking-[0.08em] text-[color:var(--color-ink)] focus:outline-none focus:border-[color:var(--color-ink)] transition-colors cursor-pointer";
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

// ── Image uploader ────────────────────────────────────────────────────────────

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

  return (
    <div>
      <label className="block font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mb-2">
        {label}
      </label>
      <p className="font-mono text-[10px] text-[color:var(--color-grey-400)] mb-3 leading-relaxed">{hint}</p>
      <div className="flex items-center gap-3">
        {value ? (
          <div className="relative w-16 h-10 overflow-hidden border border-[color:var(--color-grey-300)] flex-shrink-0 bg-[color:var(--color-grey-100)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute top-0 right-0 w-4 h-4 bg-[color:var(--color-ink)] text-[color:var(--color-paper)] flex items-center justify-center text-[10px] leading-none font-mono"
            >×</button>
          </div>
        ) : null}
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-1.5 border border-[color:var(--color-grey-300)] font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-grey-600)] hover:border-[color:var(--color-ink)] hover:text-[color:var(--color-ink)] transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <span className="inline-block w-3 h-3 border-2 border-[color:var(--color-grey-400)] border-t-[color:var(--color-ink)] animate-spin" />
          ) : (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          )}
          {uploading ? "Subiendo…" : value ? "Cambiar" : "Subir imagen"}
        </button>
        {value && (
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-green-700 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Subida
          </span>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void onUpload(f); }} />
    </div>
  );
}

// ── Banner dragger ────────────────────────────────────────────────────────────

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
      className="relative h-44 overflow-hidden cursor-ns-resize select-none bg-[color:var(--color-grey-200)]"
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
      <div className="absolute inset-0 bg-[color:var(--color-ink)]/30 flex flex-col items-center justify-center pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 border border-[color:var(--color-paper)]/40 bg-[color:var(--color-ink)]/60 font-mono text-[9px] uppercase tracking-[0.18em] text-[color:var(--color-paper)]">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
          </svg>
          Arrastrá para reencuadrar
        </div>
      </div>
      <div
        className="absolute left-0 right-0 h-px bg-[color:var(--color-paper)]/50 pointer-events-none"
        style={{ top: `${focalY * 100}%` }}
      />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const inputClass = "w-full bg-[color:var(--color-paper)] border border-[color:var(--color-grey-300)] px-3 py-2.5 font-mono text-[11px] tracking-[0.04em] text-[color:var(--color-ink)] placeholder:text-[color:var(--color-grey-400)] placeholder:tracking-[0.04em] focus:outline-none focus:border-[color:var(--color-ink)] transition-colors";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mb-2">
        {label}
      </label>
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
        .replace(/[̀-ͯ]/g, "")
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
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-grey-500)] hover:text-[color:var(--color-ink)] mb-8 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Volver a eventos
        </button>

        <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mb-3">
          (01) — Nuevo evento
        </p>
        <h1 className="font-display italic font-light leading-[0.95] tracking-[-0.02em] text-[44px] md:text-[56px] text-[color:var(--color-ink)] mb-3">
          Crear evento.
        </h1>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-grey-500)] mb-10">
          La previsualización se actualiza en tiempo real
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
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
              rows={3} placeholder="Descripción breve del evento…" className={inputClass} />
          </Field>

          <Field label="URL (slug) *">
            <input value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))}
              required placeholder="maraton-rosario-2025" className={inputClass} />
            <p className="font-mono text-[10px] tracking-[0.04em] text-[color:var(--color-grey-400)] mt-2">
              URL pública: /colecciones/{form.slug || "…"}
            </p>
          </Field>

          {/* ── Images ── */}
          <div className="border-t border-[color:var(--color-grey-300)] pt-6">
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mb-6">
              Imágenes del evento
            </p>
            <div className="flex flex-col gap-6">
              <ImageUpload
                label="Banner"
                hint="Imagen horizontal, mínimo 800×400px. Reencuadrá arrastrando la previsualización."
                value={form.bannerUrl}
                onChange={(url) => { setForm((f) => ({ ...f, bannerUrl: url })); if (!url) setKeys((k) => ({ ...k, bannerKey: "" })); }}
                uploading={uploadingBanner}
                onUpload={(file) => uploadImageWithKey(file, "banner")}
              />
              <ImageUpload
                label="Logo del evento"
                hint="Imagen cuadrada o circular, mínimo 200×200px."
                value={form.logoUrl}
                onChange={(url) => { setForm((f) => ({ ...f, logoUrl: url })); if (!url) setKeys((k) => ({ ...k, logoKey: "" })); }}
                uploading={uploadingLogo}
                onUpload={(file) => uploadImageWithKey(file, "logo")}
              />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer p-4 border border-[color:var(--color-grey-300)] hover:border-[color:var(--color-ink)] transition-colors">
            <div className="relative">
              <input type="checkbox" checked={form.isPublished}
                onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
                className="sr-only" />
              <div className="w-10 h-5 transition-colors"
                style={{ background: form.isPublished ? "var(--color-ink)" : "var(--color-grey-300)" }}>
                <div className="absolute top-0.5 w-4 h-4 bg-[color:var(--color-paper)] transition-transform"
                  style={{ left: form.isPublished ? "22px" : "2px" }} />
              </div>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-ink)]">
                Publicar inmediatamente
              </p>
              <p className="font-mono text-[10px] tracking-[0.04em] text-[color:var(--color-grey-500)] mt-1">
                El evento será visible en el sitio público
              </p>
            </div>
          </label>

          {create.isError && (
            <div className="px-4 py-3 border border-red-300 bg-red-50">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-red-700">
                Error al crear. Revisá que el slug no esté en uso.
              </p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button type="submit"
              disabled={create.isPending || !form.title || !form.slug}
              className="px-5 py-3 bg-[color:var(--color-ink)] text-[color:var(--color-paper)] font-mono text-[10px] uppercase tracking-[0.22em] hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              {create.isPending ? "Creando…" : "Crear evento ↗"}
            </button>
            <button type="button" onClick={() => router.back()}
              className="px-5 py-3 border border-[color:var(--color-grey-300)] font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-600)] hover:border-[color:var(--color-ink)] hover:text-[color:var(--color-ink)] transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>

      {/* ── Live preview ── */}
      <div className="hidden xl:block" style={{ position: "sticky", top: 0, alignSelf: "start" }}>
        <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mb-5">
          Vista previa de la tarjeta
        </p>
        <div className="max-w-xs mx-auto xl:mx-0">
          {form.bannerUrl ? (
            <div className="bg-[color:var(--color-paper)] border border-[color:var(--color-grey-300)] overflow-visible flex flex-col">
              <div className="relative">
                <BannerDragger
                  bannerUrl={form.bannerUrl}
                  focalY={form.bannerFocalY}
                  onChange={(y) => setForm((f) => ({ ...f, bannerFocalY: y }))}
                />
                <div
                  className="absolute -bottom-14 left-1/2 -translate-x-1/2 z-10 w-28 h-28 rounded-full border-4 border-[color:var(--color-paper)] shadow-xl overflow-hidden flex items-center justify-center"
                  style={{ background: form.logoUrl ? "var(--color-paper)" : "var(--color-ink)" }}
                >
                  {form.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.logoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-10 h-10 text-[color:var(--color-paper)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </div>
              </div>
              <div className="pt-20 pb-6 px-5 flex flex-col flex-1 text-center">
                <h3 className="font-display italic text-[color:var(--color-ink)] text-[26px] leading-[1.05] tracking-[-0.02em] mb-2">
                  {form.title || <span className="text-[color:var(--color-grey-300)]">Nombre del evento</span>}
                </h3>
                {form.eventDate && (
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-grey-500)] mb-2">
                    {new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(form.eventDate))}
                  </p>
                )}
                {form.description && (
                  <p className="font-sans text-[13px] leading-[1.6] text-[color:var(--color-grey-600)] mb-4 line-clamp-2">
                    {form.description}
                  </p>
                )}
                <div className="mt-auto">
                  <div className="block w-full py-3 bg-[color:var(--color-ink)] text-[color:var(--color-paper)] font-mono text-[10px] uppercase tracking-[0.22em] text-center">
                    Explorar fotos ↗
                  </div>
                </div>
              </div>
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[color:var(--color-grey-400)] text-center pb-3">
                Arrastrá el banner para reencuadrar
              </p>
            </div>
          ) : (
            <EventCard col={previewCol} preview />
          )}
        </div>
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[color:var(--color-grey-400)] mt-4">
          Se actualiza mientras escribís
        </p>
      </div>
    </div>
  );
}
