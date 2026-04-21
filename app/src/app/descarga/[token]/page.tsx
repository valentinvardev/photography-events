import { api } from "~/trpc/server";
import Link from "next/link";
import { PhotoGallery } from "~/app/_components/PhotoGallery";

export default async function DownloadPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const info = await api.purchase.getDownloadInfo({ token });

  if (!info) {
    return (
      <main className="min-h-screen bg-[color:var(--color-ink)] text-[color:var(--color-paper)] flex flex-col">
        {/* Top bar */}
        <div className="px-6 md:px-10 h-20 flex items-center justify-between">
          <Link
            href="/"
            className="link-draw font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-paper)]/70 hover:text-[color:var(--color-paper)] transition-colors flex items-center gap-2"
          >
            <span aria-hidden>←</span>
            Volver al sitio
          </Link>
          <span className="font-display italic text-[18px]">Ivana Maritano</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-paper)]/40">
            Descarga · 404
          </span>
        </div>

        <div className="flex-1 max-w-[1600px] mx-auto px-6 md:px-10 py-16 grid grid-cols-12 gap-6 items-start">
          <p className="col-span-12 md:col-span-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-safelight)]">
            (00) — Sin acceso
          </p>
          <div className="col-span-12 md:col-span-9 md:col-start-4">
            <h1
              className="font-display italic font-light leading-[0.92] tracking-[-0.04em]"
              style={{ fontSize: "clamp(56px, 10vw, 160px)" }}
            >
              Link
              <br />
              <span className="text-[color:var(--color-grey-500)]">inválido.</span>
            </h1>
            <p className="mt-10 max-w-md font-sans text-[16px] leading-[1.65] text-[color:var(--color-paper)]/70">
              El link de descarga no es válido, expiró o la compra no fue aprobada todavía. Si compraste
              recién, esperá unos minutos a que se acredite el pago.
            </p>
            <div className="mt-12 flex flex-wrap items-center gap-5">
              <Link
                href="/"
                className="group inline-flex items-center justify-between gap-8 border border-[color:var(--color-paper)] px-6 py-4 hover:bg-[color:var(--color-paper)] hover:text-[color:var(--color-ink)] transition-colors"
              >
                <span className="font-mono text-[11px] uppercase tracking-[0.22em]">
                  Volver al inicio
                </span>
                <span className="font-mono text-[11px] tracking-[0.22em] transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>
              <a
                href="mailto:hola@ivanamaritano.com.ar"
                className="link-draw font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-paper)]/80"
              >
                Escribirnos
              </a>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <PhotoGallery
      token={token}
      bibNumber={info.bibNumber}
      collectionTitle={info.collectionTitle}
      buyerName={info.buyerName}
      isPublicInit={info.isPublic}
      photos={info.photos}
      suggestions={info.suggestions}
    />
  );
}
