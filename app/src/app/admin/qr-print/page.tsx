import QRCode from "react-qr-code";
import { AutoPrint } from "./AutoPrint";

type Format = "sticker" | "card" | "poster" | "plain";

export default async function QrPrintRoute({
  searchParams,
}: {
  searchParams: Promise<{ url?: string; title?: string; format?: string }>;
}) {
  const { url = "", title = "", format = "card" } = await searchParams;
  const fmt = format as Format;
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://altafoto.com.ar";
  const shortUrl = BASE_URL.replace(/^https?:\/\//, "");
  const logoSrc = `${BASE_URL}/logo.png`;
  const qrUrl = BASE_URL;

  return (
    <>
      <AutoPrint />
      <style>{getPageCss(fmt)}</style>

      {/* ── Plain: QR only ── */}
      {fmt === "plain" && (
        <div className="plain-wrap">
          <QRCode value={qrUrl} size={300} fgColor="#0057A8" bgColor="#ffffff" />
        </div>
      )}

      {/* ── Sticker 6×6cm ── */}
      {fmt === "sticker" && (
        <div className="sticker">
          <div className="s-logo-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} alt="ALTAFOTO" className="s-logo" />
          </div>
          <div className="s-qr">
            <QRCode value={qrUrl} size={105} fgColor="#0057A8" bgColor="#ffffff" />
          </div>
          <div className="s-line" />
          <div className="s-msg">Encontrá tus fotos</div>
        </div>
      )}

      {/* ── Card 10×7cm ── */}
      {fmt === "card" && (
        <div className="card-wrap">
          {/* Left: logo only */}
          <div className="c-left">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} alt="ALTAFOTO" className="c-logo" />
          </div>
          {/* Right: QR + message */}
          <div className="c-right">
            <div className="c-qr-wrap">
              <QRCode value={qrUrl} size={150} fgColor="#0057A8" bgColor="#ffffff" />
            </div>
            <div className="c-headline">¿Corriste hoy?</div>
            <div className="c-sub">Buscá tus fotos con tu número de corredor</div>
          </div>
        </div>
      )}

      {/* ── Poster A5 ── */}
      {fmt === "poster" && (
        <div className="poster-wrap">
          {/* Top bar */}
          <div className="p-top-bar" />
          <div className="p-body">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} alt="ALTAFOTO" className="p-logo" />
            <div className="p-divider" />
            <div className="p-headline">¿Corriste hoy?<br />Encontrá tus fotos.</div>
            <div className="p-qr-wrap">
              <QRCode value={qrUrl} size={230} fgColor="#0057A8" bgColor="#ffffff" />
            </div>
            <div className="p-msg">Escaneá el código e ingresá tu número de corredor.</div>
          </div>
          <div className="p-bottom" />
        </div>
      )}
    </>
  );
}

function getPageCss(fmt: Format): string {
  const base = `
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
    body { background: white; display: flex; align-items: center; justify-content: center; }
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
      display: flex; flex-direction: column; align-items: center;
      padding: 0.2cm 0.2cm 0.15cm; gap: 0.1cm;
      background: white;
    }
    .s-logo-wrap { width: 100%; display: flex; align-items: center; justify-content: center; padding: 0.1cm 0; }
    .s-logo { height: 0.75cm; width: auto; }
    .s-qr { flex: 1; display: flex; align-items: center; justify-content: center; }
    .s-line { height: 2px; width: 1.5cm; background: #F97316; border-radius: 2px; }
    .s-msg { font-size: 6.5pt; font-weight: 700; color: #0057A8; letter-spacing: 0.2px; text-align: center; padding-bottom: 0.05cm; }
  `;

  if (fmt === "card") return `
    ${base}
    @page { size: 10cm 7cm landscape; margin: 0; }
    body { width: 10cm; height: 7cm; }
    .card-wrap {
      width: 10cm; height: 7cm;
      display: flex; overflow: hidden;
      background: white;
    }
    .c-left {
      width: 3.5cm; background: white;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 0.4cm 0.3cm;
    }
    .c-logo { width: 2.8cm; height: auto; }
    .c-right {
      flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 0.25cm; padding: 0.3cm 0.4cm;
    }
    .c-qr-wrap { line-height: 0; }
    .c-headline { font-size: 10pt; font-weight: 900; color: #0057A8; text-align: center; line-height: 1.2; }
    .c-sub { font-size: 7pt; font-weight: 600; color: #374151; text-align: center; line-height: 1.4; }
  `;

  // poster A5
  return `
    ${base}
    @page { size: A5 portrait; margin: 0; }
    body { width: 14.8cm; height: 21cm; }
    .poster-wrap { width: 14.8cm; height: 21cm; display: flex; flex-direction: column; background: white; }
    .p-top-bar { display: none; }
    .p-body {
      flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 0.4cm; padding: 0.6cm 1.2cm;
    }
    .p-logo { height: 2.2cm; width: auto; }
    .p-divider { width: 2cm; height: 3px; background: #F97316; border-radius: 2px; }
    .p-headline {
      font-size: 22pt; font-weight: 900; color: #0057A8;
      text-align: center; line-height: 1.15; letter-spacing: -0.3px;
    }
    .p-qr-wrap { line-height: 0; }
    .p-msg { font-size: 9pt; color: #374151; text-align: center; line-height: 1.5; }
    .p-bottom { display: none; }
  `;
}
