"use client";

import { useState } from "react";
import { useCart } from "./CartContext";
import { Sheet } from "~/app/_components/design/Sheet";

export function NavCartButton({ price }: { price: number }) {
  const { items, clear, toggle } = useCart();
  const [open, setOpen] = useState(false);

  const count = items.length;
  const total = count * price;
  const hasItems = count > 0;

  const triggerCheckout = () => {
    setOpen(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("ivana:open-checkout"));
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group flex items-center gap-2.5 px-4 py-2 border border-[color:var(--color-ink)]/15 hover:border-[color:var(--color-ink)] transition-colors text-[color:var(--color-ink)]"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden className="shrink-0">
          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.61L23 6H6"/>
        </svg>
        <span className="font-mono text-[10px] uppercase tracking-[0.22em]">Carrito</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] group-hover:text-[color:var(--color-ink)] transition-colors">
          [{String(count).padStart(2, "0")}]
        </span>
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} position="right" width="460px">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between px-7 pt-9 pb-6">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)]">
                (Carrito)
              </span>
              <p
                className="mt-3 font-display italic font-light leading-[0.95] tracking-[-0.02em] text-[color:var(--color-ink)]"
                style={{ fontSize: "clamp(36px, 5vw, 56px)" }}
              >
                Tu selección.
              </p>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)]">
                {String(count).padStart(2, "0")} {count === 1 ? "foto" : "fotos"} ·{" "}
                {price > 0 ? `$${total.toLocaleString("es-AR")}` : "Sin precio"}
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] hover:text-[color:var(--color-ink)] transition-colors"
            >
              Cerrar [esc]
            </button>
          </div>

          <div className="h-px bg-[color:var(--color-grey-300)] mx-7" />

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-7 py-5">
            {!hasItems ? (
              <div className="border border-dashed border-[color:var(--color-grey-300)] py-16 text-center">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mb-3">
                  Estado
                </p>
                <p className="font-display italic text-[36px] leading-tight text-[color:var(--color-ink)]">
                  Vacío.
                </p>
                <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] px-6">
                  Tocá el ícono en cada foto para sumarla
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-[color:var(--color-grey-300)]">
                {items.map((item, i) => (
                  <li key={item.photoId} className="flex items-center gap-4 py-4">
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] shrink-0">
                      {i + 1}
                    </span>
                    <div className="w-16 h-16 overflow-hidden bg-[color:var(--color-grey-300)] shrink-0">
                      <img src={item.url} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)]">
                        Número
                      </p>
                      <p className="font-display italic text-[20px] leading-tight text-[color:var(--color-ink)] truncate">
                        {item.bibNumber ? `#${item.bibNumber}` : "—"}
                      </p>
                    </div>
                    {price > 0 && (
                      <span className="font-mono text-[11px] tracking-[0.06em] text-[color:var(--color-ink)] shrink-0">
                        ${price.toLocaleString("es-AR")}
                      </span>
                    )}
                    <button
                      onClick={() => toggle(item)}
                      className="ml-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] hover:text-[color:var(--color-ink)] transition-colors shrink-0"
                      aria-label="Quitar"
                    >
                      [×]
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          {hasItems && (
            <div className="border-t border-[color:var(--color-grey-300)] px-7 py-6 flex flex-col gap-4 shrink-0">
              {price > 0 && (
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)]">
                    Total
                  </span>
                  <span className="font-display italic text-[28px] leading-none text-[color:var(--color-ink)]">
                    ${total.toLocaleString("es-AR")}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => clear()}
                  className="px-4 py-3 border border-[color:var(--color-grey-300)] hover:border-[color:var(--color-ink)] font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-700)] hover:text-[color:var(--color-ink)] transition-colors"
                >
                  Vaciar
                </button>
                <button
                  onClick={triggerCheckout}
                  className="group flex-1 inline-flex items-center justify-between border border-[color:var(--color-ink)] bg-[color:var(--color-ink)] text-[color:var(--color-paper)] px-5 py-3 hover:bg-transparent hover:text-[color:var(--color-ink)] transition-colors"
                >
                  <span className="font-mono text-[11px] uppercase tracking-[0.22em]">Continuar</span>
                  <span className="font-mono text-[11px] tracking-[0.22em] transition-transform group-hover:translate-x-1">→</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </Sheet>
    </>
  );
}
