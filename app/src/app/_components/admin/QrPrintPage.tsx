"use client";

import { useState } from "react";
import QRCode from "react-qr-code";

// Print is handled by /admin/qr-print route (dedicated printable page)

const SITE_URL = "https://altafoto.com.ar";

type Format = "sticker" | "card" | "poster" | "plain";

const FORMATS: { id: Format; label: string; desc: string; size: string }[] = [
  { id: "sticker", label: "Sticker",  desc: "6 × 6 cm · dorsal o pechera",     size: "6cm × 6cm"   },
  { id: "card",    label: "Tarjeta",  desc: "10 × 7 cm · flyer de mano",       size: "10cm × 7cm"  },
  { id: "poster",  label: "Póster",   desc: "A5 · cartel en el recorrido",      size: "A5 (14.8cm × 21cm)" },
  { id: "plain",   label: "Solo QR",  desc: "QR limpio sin decoración",         size: "6cm × 6cm"   },
];

const QR_PREVIEW_SIZES: Record<Format, number> = {
  sticker: 90,
  card:    130,
  poster:  180,
  plain:   130,
};


// ─── Component ────────────────────────────────────────────────────────────────

export function QrPrintPage() {
  const [format, setFormat] = useState<Format>("card");
  const fmt = FORMATS.find((f) => f.id === format)!;

  const handlePrint = () => {
    const params = new URLSearchParams({ format });
    window.open(`/admin/qr-print?${params.toString()}`, "_blank");
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Códigos QR</h1>
      <p className="text-gray-500 text-sm mb-8">Imprimí QR para que los corredores accedan a sus fotos al instante.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Controls ── */}
          <div className="lg:col-span-1 flex flex-col gap-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-semibold text-gray-900 text-sm mb-3">Formato</h2>
              <div className="flex flex-col gap-2">
                {FORMATS.map((f) => (
                  <button key={f.id} onClick={() => setFormat(f.id)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left"
                    style={{
                      background: format === f.id ? "#FFF7ED" : "transparent",
                      border: `1.5px solid ${format === f.id ? "#F97316" : "#e5e7eb"}`,
                    }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
                      style={{ background: format === f.id ? "#F97316" : "#f3f4f6", color: format === f.id ? "white" : "#9ca3af" }}>
                      {f.id === "sticker" ? "S" : f.id === "card" ? "T" : "P"}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{f.label}</p>
                      <p className="text-xs text-gray-400">{f.desc}</p>
                    </div>
                    {format === f.id && (
                      <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "#FED7AA", color: "#c2410c" }}>{f.size}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Preview ── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center">
              <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-6">
                Vista previa · {fmt.label} · {fmt.size}
              </p>

              <>
                  {/* Plain preview — no decoration */}
                  {format === "plain" && (
                    <div className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-gray-200 bg-white shadow-sm">
                      <div id="qr-svg-root">
                        <QRCode
                          value={SITE_URL}
                          size={QR_PREVIEW_SIZES.plain}
                          fgColor="#000000"
                          bgColor="#ffffff"
                          style={{ display: "block" }}
                        />
                      </div>
                      <p className="text-xs text-gray-400">Sin bordes · Sin texto · Solo QR</p>
                    </div>
                  )}

                  {/* Decorated preview card */}
                  {format !== "plain" && <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-100"
                    style={{
                      width: format === "poster" ? 260 : format === "card" ? 320 : 180,
                    }}>

                    {/* Header */}
                    <div className="flex flex-col items-center gap-2 py-5 px-4"
                      style={{ background: "linear-gradient(135deg, #003D7A 0%, #0057A8 100%)" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/logo.png" alt="ALTAFOTO" className="w-auto brightness-0 invert"
                        style={{ height: format === "poster" ? 52 : format === "card" ? 44 : 32 }} />
                    </div>

                    {/* Orange accent */}
                    <div style={{ height: 4, background: "linear-gradient(90deg, #F97316, #c2410c)" }} />

                    {/* QR */}
                    <div className="flex flex-col items-center gap-3 py-5 px-4 bg-white">
                      {format === "poster" && (
                        <p className="text-xs text-gray-500 text-center font-semibold">¿Corriste hoy? Buscá tus fotos</p>
                      )}
                      <div id="qr-svg-root" className="p-2.5 rounded-xl border-2" style={{ borderColor: "#0057A8" }}>
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
                  </div>}

                  {/* Print button */}
                  <button onClick={handlePrint}
                    className="mt-7 flex items-center gap-2.5 px-7 py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 active:scale-95"
                    style={{ background: "linear-gradient(135deg, #0057A8, #003D7A)", boxShadow: "0 4px 16px rgba(0,87,168,0.25)" }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Imprimir / Guardar PDF
                  </button>
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    Se abre una nueva ventana lista para imprimir o guardar como PDF
                  </p>
              </>
            </div>
          </div>
      </div>
    </div>
  );
}
