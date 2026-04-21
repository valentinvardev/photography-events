"use client";

import Link from "next/link";
import { useCursorTrigger } from "./Cursor";

export function Footer() {
  const link = useCursorTrigger("cta", "ir");

  return (
    <footer
      id="contacto"
      className="relative bg-[color:var(--color-ink)] text-[color:var(--color-paper)] pt-28 pb-10 px-6 md:px-10 overflow-hidden"
    >
      {/* huge wordmark */}
      <div className="pointer-events-none select-none absolute inset-x-0 bottom-[-2.5vw] flex justify-center">
        <span
          className="font-display italic font-light leading-[0.8] text-[color:var(--color-grey-700)]/40"
          style={{ fontSize: "clamp(80px, 18vw, 280px)" }}
        >
          Ivana Maritano
        </span>
      </div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-6 max-w-[1600px] mx-auto">
        <div className="md:col-span-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mb-3">
            Studio
          </p>
          <p className="font-display italic text-[28px] md:text-[36px] leading-[1.05]">
            Fotografía deportiva,<br />hecha con cuidado.
          </p>
        </div>

        <div className="md:col-span-3 md:col-start-7">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mb-4">
            Contacto
          </p>
          <div className="flex flex-row gap-8">
            <a
              href="https://wa.me/5493515551234"
              target="_blank"
              rel="noopener"
              {...link}
              className="link-draw font-display italic text-[20px] flex items-center gap-2"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </a>
            <a
              href="mailto:hola@ivanamaritano.com"
              {...link}
              className="link-draw font-display italic text-[20px] flex items-center gap-2"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="M2 7l10 7 10-7"/>
              </svg>
              Email
            </a>
          </div>
        </div>

        <div className="md:col-span-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mb-4">
            Legal
          </p>
          <ul className="flex flex-col gap-2">
            <li>
              <Link href="/terminos" {...link} className="link-draw font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-grey-300)]">
                Términos
              </Link>
            </li>
            <li>
              <Link href="/privacidad" {...link} className="link-draw font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-grey-300)]">
                Privacidad
              </Link>
            </li>
            <li>
              <Link href="/admin" {...link} className="link-draw font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-grey-700)]">
                Admin
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="relative z-10 mt-20 pt-6 border-t border-[color:var(--color-grey-900)] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 max-w-[1600px] mx-auto">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)]">
          © {new Date().getFullYear()} · Ivana Maritano · Argentina
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-700)]">
          Pagos vía MercadoPago
        </p>
      </div>
    </footer>
  );
}
