"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "~/trpc/react";

export default function PendingPage() {
  return (
    <Suspense fallback={null}>
      <PendingPageInner />
    </Suspense>
  );
}

function PendingPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const purchaseId = searchParams.get("purchase");

  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () =>
      setTime(
        new Intl.DateTimeFormat("es-AR", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "America/Argentina/Buenos_Aires",
        }).format(new Date()),
      );
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  // Poll for approval — most MercadoPago payments approve within seconds
  const { data: status } = api.purchase.getStatus.useQuery(
    { id: purchaseId ?? "" },
    {
      enabled: !!purchaseId,
      refetchInterval: 2500,
      refetchIntervalInBackground: true,
    },
  );

  useEffect(() => {
    if (status?.status === "APPROVED" && status.downloadToken) {
      router.replace(`/descarga/${status.downloadToken}`);
    }
  }, [status, router]);

  return (
    <main className="min-h-screen bg-[color:var(--color-ink)] text-[color:var(--color-paper)] flex flex-col relative overflow-hidden">
      {/* Decorative grid */}
      <div className="pointer-events-none absolute inset-0 grid grid-cols-12 opacity-[0.04]">
        {Array.from({ length: 11 }).map((_, i) => (
          <span
            key={i}
            className="border-r border-[color:var(--color-paper)]"
          />
        ))}
      </div>

      {/* Viewfinder corners */}
      <span className="pointer-events-none absolute top-6 left-6 md:top-10 md:left-10 w-5 h-5 border-l border-t border-[color:var(--color-paper)]/30" />
      <span className="pointer-events-none absolute top-6 right-6 md:top-10 md:right-10 w-5 h-5 border-r border-t border-[color:var(--color-paper)]/30" />
      <span className="pointer-events-none absolute bottom-6 left-6 md:bottom-10 md:left-10 w-5 h-5 border-l border-b border-[color:var(--color-paper)]/30" />
      <span className="pointer-events-none absolute bottom-6 right-6 md:bottom-10 md:right-10 w-5 h-5 border-r border-b border-[color:var(--color-paper)]/30" />

      {/* Top bar */}
      <div className="relative z-10 px-6 md:px-10 h-20 flex items-center justify-between">
        <Link
          href="/"
          className="link-draw font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-paper)]/70 hover:text-[color:var(--color-paper)] transition-colors flex items-center gap-2"
        >
          <span aria-hidden>←</span>
          Volver al sitio
        </Link>
        <span className="font-display italic text-[18px]">Ivana Maritano</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-paper)]/40">
          AR · {time}
        </span>
      </div>

      {/* Main */}
      <div className="relative z-10 flex-1 max-w-[1600px] w-full mx-auto px-6 md:px-10 py-16 grid grid-cols-12 gap-6 items-start">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="col-span-12 md:col-span-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-safelight)] flex items-center gap-3"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--color-safelight)] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[color:var(--color-safelight)]" />
          </span>
          (00) — Procesando pago
        </motion.p>

        <div className="col-span-12 md:col-span-9 md:col-start-4">
          <h1
            className="font-display italic font-light leading-[0.92] tracking-[-0.04em] overflow-hidden"
            style={{ fontSize: "clamp(56px, 10vw, 160px)" }}
          >
            <motion.span
              initial={{ y: "110%" }}
              animate={{ y: "0%" }}
              transition={{ duration: 0.85, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="inline-block"
            >
              Revelando
            </motion.span>
            <br />
            <motion.span
              initial={{ y: "110%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              transition={{ duration: 0.85, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="inline-block text-[color:var(--color-grey-500)]"
            >
              tu compra…
            </motion.span>
          </h1>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mt-12 grid grid-cols-12 gap-6"
          >
            <p className="col-span-12 md:col-span-6 font-sans text-[16px] leading-[1.65] text-[color:var(--color-paper)]/75">
              Tu pago está en proceso de acreditación.
              {purchaseId ? (
                <>
                  {" "}Esta página se actualiza sola — apenas se confirme,
                  te llevamos directo a la descarga.
                </>
              ) : (
                <>
                  {" "}Una vez confirmado, recibirás el link de descarga
                  directamente en tu email.
                </>
              )}{" "}
              La espera suele ser de unos minutos, aunque algunos métodos como
              efectivo pueden tardar más.
            </p>
            <dl className="col-span-12 md:col-span-5 md:col-start-8 grid grid-cols-2 gap-6">
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-paper)]/45 mb-2">
                  Estado
                </dt>
                <dd className="font-display italic text-[22px] leading-tight text-[color:var(--color-paper)]">
                  Pendiente
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-paper)]/45 mb-2">
                  Notificación
                </dt>
                <dd className="font-display italic text-[22px] leading-tight text-[color:var(--color-paper)]">
                  Por email
                </dd>
              </div>
            </dl>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mt-14 flex flex-wrap items-center gap-5"
          >
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
              ¿Pasó algo? Escribirnos
            </a>
          </motion.div>
        </div>
      </div>

      {/* Bottom strip */}
      <div className="relative z-10 px-6 md:px-10 pb-10 flex items-end justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-paper)]/40 max-w-xs leading-[1.6]">
          MercadoPago · Confirmación automática
          <br />
          Revisá tu casilla de correo
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-paper)]/40">
          Estudio Ivana Maritano · MMXXVI
        </p>
      </div>
    </main>
  );
}
