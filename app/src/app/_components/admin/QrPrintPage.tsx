"use client";

import { useState } from "react";
import QRCode from "react-qr-code";

const SITE_URL = "https://altafoto.com.ar";

type Format = "sticker" | "card" | "poster" | "plain";

const FORMATS: { id: Format; label: string; desc: string; size: string }[] = [
  { id: "sticker", label: "Sticker",  desc: "6 × 6 cm · dorsal o pechera",     size: "6cm × 6cm"          },
  { id: "card",    label: "Tarjeta",  desc: "10 × 7 cm · flyer de mano",       size: "10cm × 7cm"         },
  { id: "poster",  label: "Póster",   desc: "A5 · cartel en el recorrido",      size: "A5 (14.8 × 21 cm)"  },
  { id: "plain",   label: "Solo QR",  desc: "QR limpio sin decoración",         size: "6cm × 6cm"          },
];

const QR_PREVIEW_SIZES: Record<Format, number> = {
  sticker: 90,
  card:    130,
  poster:  180,
  plain:   130,
};

export function QrPrintPage() {
  const [format, setFormat] = useState<Format>("card");
  const fmt = FORMATS.find((f) => f.id === format)!;

  const handlePrint = () => {
    const params = new URLSearchParams({ format });
    window.open(`/admin/qr-print?${params.toString()}`, "_blank");
  };

  return (
    <div>
      <div className="mb-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mb-2">
          Material imprimible
        </p>
        <h1
          className="font-display italic font-light leading-[0.92] tracking-[-0.03em]"
          style={{ fontSize: "clamp(36px, 5vw, 72px)" }}
        >
          Códigos QR.
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-px border border-[color:var(--color-grey-300)] bg-[color:var(--color-grey-300)]">

        {/* ── Format selector ── */}
        <div className="bg-[color:var(--color-paper)] p-6 flex flex-col gap-1">
          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mb-4">
            Formato
          </p>
          {FORMATS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFormat(f.id)}
              className={`text-left px-4 py-3 border transition-colors ${
                format === f.id
                  ? "border-[color:var(--color-ink)] bg-[color:var(--color-ink)] text-[color:var(--color-paper)]"
                  : "border-[color:var(--color-grey-300)] hover:border-[color:var(--color-ink)]"
              }`}
            >
              <p className={`font-mono text-[11px] uppercase tracking-[0.14em] ${format === f.id ? "text-[color:var(--color-paper)]" : "text-[color:var(--color-ink)]"}`}>
                {f.label}
              </p>
              <p className={`font-mono text-[9px] uppercase tracking-[0.12em] mt-0.5 ${format === f.id ? "text-[color:var(--color-paper)]/60" : "text-[color:var(--color-grey-500)]"}`}>
                {f.desc}
              </p>
            </button>
          ))}
        </div>

        {/* ── Preview ── */}
        <div className="lg:col-span-2 bg-[color:var(--color-paper)] p-8 flex flex-col items-center">
          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mb-8 self-start">
            Vista previa · {fmt.label} · {fmt.size}
          </p>

          {format === "plain" ? (
            <div className="border border-[color:var(--color-grey-300)] p-8 flex flex-col items-center gap-4">
              <div id="qr-svg-root">
                <QRCode
                  value={SITE_URL}
                  size={QR_PREVIEW_SIZES.plain}
                  fgColor="#000000"
                  bgColor="#ffffff"
                  style={{ display: "block" }}
                />
              </div>
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[color:var(--color-grey-400)]">
                Sin bordes · Sin texto · Solo QR
              </p>
            </div>
          ) : (
            <div
              className="overflow-hidden shadow-md"
              style={{ width: format === "poster" ? 260 : format === "card" ? 320 : 180 }}
            >
              {/* Card header — print artifact, keep brand colors */}
              <div
                className="flex flex-col items-center gap-2 py-5 px-4"
                style={{ background: "linear-gradient(135deg, #003D7A 0%, #0057A8 100%)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo.png"
                  alt="ALTAFOTO"
                  className="w-auto brightness-0 invert"
                  style={{ height: format === "poster" ? 52 : format === "card" ? 44 : 32 }}
                />
              </div>

              <div style={{ height: 4, background: "linear-gradient(90deg, #F97316, #c2410c)" }} />

              <div className="flex flex-col items-center gap-3 py-5 px-4 bg-white">
                {format === "poster" && (
                  <p className="text-xs text-gray-500 text-center font-semibold">¿Corriste hoy? Buscá tus fotos</p>
                )}
                <div className="p-2.5 border-2" style={{ borderColor: "#0057A8" }}>
                  <QRCode
                    value={SITE_URL}
                    size={QR_PREVIEW_SIZES[format]}
                    fgColor="#0057A8"
                    bgColor="#ffffff"
                    style={{ display: "block" }}
                  />
                </div>
                {format !== "sticker" && (
                  <p className="text-xs text-center font-semibold" style={{ color: "#F97316" }}>
                    ↑ Escaneá con tu celular
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="mt-10 flex flex-col items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-3 px-6 py-3 border border-[color:var(--color-ink)] font-mono text-[10px] uppercase tracking-[0.18em] hover:bg-[color:var(--color-ink)] hover:text-[color:var(--color-paper)] transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimir / Guardar PDF
            </button>
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[color:var(--color-grey-400)]">
              Se abre una nueva ventana lista para imprimir
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
