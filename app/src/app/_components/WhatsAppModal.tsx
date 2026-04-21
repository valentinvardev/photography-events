"use client";

import { useState } from "react";
import { Sheet } from "~/app/_components/design/Sheet";

const WA_NUMBER = "5493543513123";
const WA_DISPLAY = "+54 9 3543 51-3123";
const WA_URL = `https://wa.me/${WA_NUMBER}`;

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function ContactCard({ onClose, dark = false }: { onClose: () => void; dark?: boolean }) {
  return (
    <div className="px-7 py-9 flex flex-col gap-7">
      <div className="flex items-start justify-between">
        <span
          className={`font-mono text-[10px] uppercase tracking-[0.22em] ${
            dark ? "text-[color:var(--color-paper)]/60" : "text-[color:var(--color-grey-500)]"
          }`}
        >
          (00) — Contacto
        </span>
        <button
          onClick={onClose}
          className={`font-mono text-[10px] uppercase tracking-[0.22em] transition-colors ${
            dark
              ? "text-[color:var(--color-paper)]/60 hover:text-[color:var(--color-paper)]"
              : "text-[color:var(--color-grey-500)] hover:text-[color:var(--color-ink)]"
          }`}
        >
          Cerrar [esc]
        </button>
      </div>

      <div className="space-y-2">
        <p
          className={`font-display italic font-light leading-[0.95] tracking-[-0.02em] ${
            dark ? "text-[color:var(--color-paper)]" : "text-[color:var(--color-ink)]"
          }`}
          style={{ fontSize: "clamp(36px, 5vw, 56px)" }}
        >
          Escribime
          <br />
          <span className={dark ? "text-[color:var(--color-paper)]/55" : "text-[color:var(--color-grey-500)]"}>al</span>{" "}
          WhatsApp.
        </p>
        <p
          className={`pt-3 font-mono text-[11px] uppercase tracking-[0.22em] ${
            dark ? "text-[color:var(--color-paper)]/60" : "text-[color:var(--color-grey-500)]"
          }`}
        >
          {WA_DISPLAY}
        </p>
      </div>

      <div className={dark ? "h-px bg-[color:var(--color-paper)]/15" : "h-px bg-[color:var(--color-grey-300)]"} />

      <p
        className={`font-sans text-[14px] leading-[1.6] ${
          dark ? "text-[color:var(--color-paper)]/75" : "text-[color:var(--color-grey-700)]"
        }`}
      >
        Respondo de lunes a viernes. Si sos organizador y querés cotización para tu evento, contame fecha y lugar.
      </p>

      <a
        href={WA_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClose}
        className={`group inline-flex items-center justify-between border px-5 py-4 transition-colors ${
          dark
            ? "border-[color:var(--color-paper)] text-[color:var(--color-paper)] hover:bg-[color:var(--color-paper)] hover:text-[color:var(--color-ink)]"
            : "border-[color:var(--color-ink)] text-[color:var(--color-ink)] hover:bg-[color:var(--color-ink)] hover:text-[color:var(--color-paper)]"
        }`}
      >
        <span className="flex items-center gap-3">
          <WhatsAppGlyph className="w-4 h-4" />
          <span className="font-mono text-[11px] uppercase tracking-[0.22em]">Abrir WhatsApp</span>
        </span>
        <span className="font-mono text-[11px] tracking-[0.22em] transition-transform group-hover:translate-x-1">→</span>
      </a>
    </div>
  );
}

export function WhatsAppNavButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="link-draw font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-ink)]/80 hover:text-[color:var(--color-ink)] transition-colors flex items-center gap-2"
      >
        <WhatsAppGlyph className="w-3.5 h-3.5" />
        Contacto
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} position="right" width="460px">
        <ContactCard onClose={() => setOpen(false)} />
      </Sheet>
    </>
  );
}

export function WhatsAppFooterButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group inline-flex items-center gap-3 border border-[color:var(--color-paper)]/60 px-5 py-3 text-[color:var(--color-paper)] hover:bg-[color:var(--color-paper)] hover:text-[color:var(--color-ink)] transition-colors"
      >
        <WhatsAppGlyph className="w-4 h-4" />
        <span className="font-mono text-[11px] uppercase tracking-[0.22em]">Escribime por WhatsApp</span>
        <span className="font-mono text-[11px] tracking-[0.22em] transition-transform group-hover:translate-x-1">→</span>
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} position="right" width="460px" dark>
        <ContactCard onClose={() => setOpen(false)} dark />
      </Sheet>
    </>
  );
}

export function WhatsAppMobileItem({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group flex items-center justify-between w-full py-5 border-b border-[color:var(--color-paper)]/10 text-left"
      >
        <span className="font-display italic text-[28px] leading-none text-[color:var(--color-paper)]">Contacto</span>
        <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-paper)]/50">
          <WhatsAppGlyph className="w-3.5 h-3.5" />
          WA
        </span>
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} position="bottom" width="100%" dark>
        <ContactCard
          onClose={() => {
            setOpen(false);
            onClose();
          }}
          dark
        />
      </Sheet>
    </>
  );
}
