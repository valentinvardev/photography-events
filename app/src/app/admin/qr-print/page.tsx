import QRCode from "react-qr-code";
import { AutoPrint } from "./AutoPrint";

type Format = "sticker" | "card" | "poster" | "plain";

export default async function QrPrintRoute({
  searchParams,
}: {
  searchParams: Promise<{ url?: string; title?: string; format?: string }>;
}) {
  const { format = "card" } = await searchParams;
  const fmt = format as Format;
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://altafoto.com.ar";
  const SHORT_URL = BASE_URL.replace(/^https?:\/\//, "");
  const qrUrl = BASE_URL;

  return (
    <>
      <AutoPrint />
      <style>{getPageCss(fmt)}</style>

      {/* ── Plain: QR only ── */}
      {fmt === "plain" && (
        <div className="plain-wrap">
          <QRCode value={qrUrl} size={300} fgColor="#0a0a0a" bgColor="#ffffff" />
        </div>
      )}

      {/* ── Sticker 6×6cm ── */}
      {fmt === "sticker" && (
        <div className="sticker">
          <div className="s-brand">Ivana Maritano</div>
          <div className="s-rule" />
          <div className="s-qr">
            <QRCode value={qrUrl} size={105} fgColor="#0a0a0a" bgColor="#ffffff" />
          </div>
          <div className="s-rule" />
          <div className="s-msg">Buscá tus fotos</div>
        </div>
      )}

      {/* ── Card 10×7cm ── */}
      {fmt === "card" && (
        <div className="card-wrap">
          {/* Left: black panel */}
          <div className="c-left">
            <div className="c-brand">Ivana<br />Maritano</div>
            <div className="c-rule" />
            <div className="c-url">{SHORT_URL}</div>
          </div>
          {/* Right: QR + message */}
          <div className="c-right">
            <div className="c-qr-wrap">
              <QRCode value={qrUrl} size={160} fgColor="#0a0a0a" bgColor="#ffffff" />
            </div>
            <div className="c-divider" />
            <div className="c-headline">¿Corriste hoy?</div>
            <div className="c-sub">Buscá tus fotos con tu número de corredor</div>
          </div>
        </div>
      )}

      {/* ── Poster A5 ── */}
      {fmt === "poster" && (
        <div className="poster-wrap">
          {/* Header */}
          <div className="p-header">
            <div className="p-eyebrow">Fotografía de carrera</div>
            <div className="p-brand">Ivana<br />Maritano</div>
          </div>
          <div className="p-body">
            <div className="p-headline">¿Corriste hoy?<br />Encontrá tus fotos.</div>
            <div className="p-rule" />
            <div className="p-qr-wrap">
              <QRCode value={qrUrl} size={240} fgColor="#0a0a0a" bgColor="#ffffff" />
            </div>
            <div className="p-divider" />
            <div className="p-msg">
              Escaneá el código e ingresá<br />tu número de corredor.
            </div>
            <div className="p-url">{SHORT_URL}</div>
          </div>
        </div>
      )}
    </>
  );
}

function getPageCss(fmt: Format): string {
  const fonts = `@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,700;1,300;1,400;1,700&family=Fragment+Mono&display=swap');`;

  const base = `
    ${fonts}
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: white; display: flex; align-items: center; justify-content: center; }
    .display { font-family: 'Barlow Condensed', sans-serif; font-style: italic; font-weight: 300; }
    .mono    { font-family: 'Fragment Mono', monospace; }
  `;

  if (fmt === "plain") return `
    ${base}
    @page { size: 10cm 10cm; margin: 0.5cm; }
    body { min-height: 9cm; }
    .plain-wrap { display: flex; align-items: center; justify-content: center; width: 100%; }
  `;

  if (fmt === "sticker") return `
    ${base}
    @page { size: 6cm 6cm; margin: 0; }
    body { width: 6cm; height: 6cm; }
    .sticker {
      width: 6cm; height: 6cm;
      border: 1.5pt solid #0a0a0a;
      display: flex; flex-direction: column; align-items: center;
      padding: 0.25cm 0.2cm 0.2cm; gap: 0.1cm;
      background: white;
    }
    .s-brand {
      font-family: 'Barlow Condensed', sans-serif;
      font-style: italic; font-weight: 300;
      font-size: 13pt; color: #0a0a0a;
      letter-spacing: -0.3px; line-height: 1;
    }
    .s-rule { width: 100%; height: 1px; background: #0a0a0a; }
    .s-qr   { flex: 1; display: flex; align-items: center; justify-content: center; }
    .s-msg  {
      font-family: 'Fragment Mono', monospace;
      font-size: 6pt; letter-spacing: 0.18em;
      text-transform: uppercase; color: #555;
      text-align: center; padding-bottom: 0.03cm;
    }
  `;

  if (fmt === "card") return `
    ${base}
    @page { size: 10cm 7cm landscape; margin: 0; }
    body { width: 10cm; height: 7cm; }
    .card-wrap {
      width: 10cm; height: 7cm;
      display: flex; overflow: hidden;
    }
    .c-left {
      width: 3.2cm; background: #0a0a0a;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      padding: 0.4cm 0.3cm; gap: 0.2cm;
    }
    .c-brand {
      font-family: 'Barlow Condensed', sans-serif;
      font-style: italic; font-weight: 300;
      font-size: 18pt; color: #f5f2ec;
      letter-spacing: -0.3px; line-height: 1;
      text-align: center;
    }
    .c-rule { width: 0.7cm; height: 1px; background: #f5f2ec; opacity: 0.35; }
    .c-url  {
      font-family: 'Fragment Mono', monospace;
      font-size: 5.5pt; letter-spacing: 0.14em;
      text-transform: uppercase; color: #f5f2ec;
      opacity: 0.45; text-align: center;
    }
    .c-right {
      flex: 1; background: white;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      padding: 0.3cm 0.5cm; gap: 0.2cm;
    }
    .c-qr-wrap  { line-height: 0; }
    .c-divider  { width: 100%; height: 1px; background: #e5e5e5; }
    .c-headline {
      font-family: 'Barlow Condensed', sans-serif;
      font-style: italic; font-weight: 300;
      font-size: 13pt; color: #0a0a0a;
      text-align: center; line-height: 1.1;
    }
    .c-sub {
      font-family: 'Fragment Mono', monospace;
      font-size: 6pt; letter-spacing: 0.12em;
      text-transform: uppercase; color: #888;
      text-align: center; line-height: 1.5;
    }
  `;

  // poster A5
  return `
    ${base}
    @page { size: A5 portrait; margin: 0; }
    body { width: 14.8cm; height: 21cm; }
    .poster-wrap { width: 14.8cm; height: 21cm; display: flex; flex-direction: column; background: white; }
    .p-header {
      background: #0a0a0a;
      padding: 0.7cm 1.1cm 0.6cm;
    }
    .p-eyebrow {
      font-family: 'Fragment Mono', monospace;
      font-size: 7pt; letter-spacing: 0.22em;
      text-transform: uppercase; color: #f5f2ec;
      opacity: 0.45; margin-bottom: 0.2cm;
    }
    .p-brand {
      font-family: 'Barlow Condensed', sans-serif;
      font-style: italic; font-weight: 300;
      font-size: 44pt; color: #f5f2ec;
      letter-spacing: -0.5px; line-height: 0.92;
    }
    .p-body {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 0.5cm; padding: 0.8cm 1.4cm;
    }
    .p-headline {
      font-family: 'Barlow Condensed', sans-serif;
      font-style: italic; font-weight: 300;
      font-size: 26pt; color: #0a0a0a;
      text-align: center; line-height: 1.05;
      letter-spacing: -0.3px;
    }
    .p-rule { width: 1cm; height: 1px; background: #0a0a0a; }
    .p-qr-wrap { line-height: 0; }
    .p-divider { width: 100%; height: 1px; background: #e5e5e5; }
    .p-msg {
      font-family: 'Fragment Mono', monospace;
      font-size: 7.5pt; color: #555;
      text-align: center; line-height: 1.6;
      letter-spacing: 0.06em;
    }
    .p-url {
      font-family: 'Fragment Mono', monospace;
      font-size: 6.5pt; letter-spacing: 0.18em;
      text-transform: uppercase; color: #999;
      text-align: center;
    }
  `;
}
