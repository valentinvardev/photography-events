"use client";

import { useState } from "react";
import QRCode from "react-qr-code";

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://ivanamaritano.com";
const SHORT_URL = SITE_URL.replace(/^https?:\/\//, "");

type Format = "sticker" | "card" | "poster" | "plain";

const FORMATS: { id: Format; label: string; desc: string; size: string }[] = [
  { id: "sticker", label: "Sticker",  desc: "6 × 6 cm · dorsal o pechera",     size: "6cm × 6cm"          },
  { id: "card",    label: "Tarjeta",  desc: "10 × 7 cm · flyer de mano",       size: "10cm × 7cm"         },
  { id: "poster",  label: "Póster",   desc: "A5 · cartel en el recorrido",      size: "A5 (14.8 × 21 cm)"  },
  { id: "plain",   label: "Solo QR",  desc: "QR limpio sin decoración",         size: "6cm × 6cm"          },
];

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

          {/* PLAIN */}
          {format === "plain" && (
            <div className="border border-[color:var(--color-grey-300)] p-8 flex flex-col items-center gap-4">
              <QRCode value={SITE_URL} size={130} fgColor="#0a0a0a" bgColor="#ffffff" style={{ display: "block" }} />
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[color:var(--color-grey-400)]">
                Sin bordes · Sin texto · Solo QR
              </p>
            </div>
          )}

          {/* STICKER */}
          {format === "sticker" && (
            <div style={{
              width: 180, background: "#ffffff",
              border: "1.5px solid #0a0a0a",
              display: "flex", flexDirection: "column", alignItems: "center",
              padding: "16px 14px 12px", gap: 10,
            }}>
              <p style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 300, fontSize: 14, color: "#0a0a0a", letterSpacing: "-0.02em", lineHeight: 1 }}>
                Ivana Maritano
              </p>
              <div style={{ width: "100%", height: 1, background: "#0a0a0a" }} />
              <QRCode value={SITE_URL} size={108} fgColor="#0a0a0a" bgColor="#ffffff" style={{ display: "block" }} />
              <div style={{ width: "100%", height: 1, background: "#0a0a0a" }} />
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 7.5, letterSpacing: "0.2em", textTransform: "uppercase", color: "#555", textAlign: "center" }}>
                Buscá tus fotos
              </p>
            </div>
          )}

          {/* CARD */}
          {format === "card" && (
            <div style={{ width: 320, display: "flex", border: "1.5px solid #0a0a0a", overflow: "hidden" }}>
              {/* Left: black panel */}
              <div style={{
                width: 112, background: "#0a0a0a",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                padding: "16px 12px", gap: 6,
              }}>
                <p style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 300, fontSize: 18, color: "#f5f2ec", letterSpacing: "-0.02em", lineHeight: 1.05, textAlign: "center" }}>
                  Ivana<br />Maritano
                </p>
                <div style={{ width: 28, height: 1, background: "#f5f2ec", opacity: 0.35 }} />
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 6.5, letterSpacing: "0.18em", textTransform: "uppercase", color: "#f5f2ec", opacity: 0.5, textAlign: "center" }}>
                  {SHORT_URL}
                </p>
              </div>
              {/* Right: white panel */}
              <div style={{
                flex: 1, background: "#ffffff",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                padding: "16px 14px", gap: 8,
              }}>
                <QRCode value={SITE_URL} size={118} fgColor="#0a0a0a" bgColor="#ffffff" style={{ display: "block" }} />
                <div style={{ width: "100%", height: 1, background: "#e5e5e5" }} />
                <p style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 300, fontSize: 13, color: "#0a0a0a", textAlign: "center", lineHeight: 1.2 }}>
                  ¿Corriste hoy?
                </p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 7, letterSpacing: "0.14em", textTransform: "uppercase", color: "#888", textAlign: "center" }}>
                  Buscá tus fotos con tu número
                </p>
              </div>
            </div>
          )}

          {/* POSTER */}
          {format === "poster" && (
            <div style={{ width: 240, background: "#ffffff", border: "1.5px solid #0a0a0a", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              {/* Header */}
              <div style={{ background: "#0a0a0a", padding: "14px 18px 12px" }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 7, letterSpacing: "0.22em", textTransform: "uppercase", color: "#f5f2ec", opacity: 0.5, marginBottom: 4 }}>
                  Fotografía de carrera
                </p>
                <p style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 300, fontSize: 24, color: "#f5f2ec", letterSpacing: "-0.02em", lineHeight: 0.95 }}>
                  Ivana<br />Maritano
                </p>
              </div>
              {/* Body */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "18px 16px 16px", gap: 10 }}>
                <p style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 300, fontSize: 17, color: "#0a0a0a", textAlign: "center", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
                  ¿Corriste hoy?<br />Encontrá tus fotos.
                </p>
                <div style={{ width: 28, height: 1, background: "#0a0a0a" }} />
                <QRCode value={SITE_URL} size={148} fgColor="#0a0a0a" bgColor="#ffffff" style={{ display: "block" }} />
                <div style={{ width: "100%", height: 1, background: "#e5e5e5" }} />
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 6.5, letterSpacing: "0.14em", textTransform: "uppercase", color: "#888", textAlign: "center", lineHeight: 1.6 }}>
                  Escaneá el código e ingresá<br />tu número de corredor
                </p>
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
