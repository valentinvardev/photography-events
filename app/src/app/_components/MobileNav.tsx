"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { WhatsAppMobileItem } from "~/app/_components/WhatsAppModal";

const ITEMS = [
  { label: "Inicio", href: "/", index: "01" },
  { label: "Eventos", href: "/#eventos", index: "02" },
  { label: "Manifiesto", href: "/#manifiesto", index: "03" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div>
      {/* Hamburger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 flex flex-col items-center justify-center gap-[5px]"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
      >
        <span
          className={`block h-px w-6 bg-current transition-all duration-300 ${
            open ? "translate-y-[3px] rotate-45" : ""
          }`}
        />
        <span
          className={`block h-px w-6 bg-current transition-all duration-300 ${
            open ? "-translate-y-[3px] -rotate-45" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="m-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[100] bg-[color:var(--color-ink)]/40 backdrop-blur-sm"
          />
        )}

        {open && (
          <motion.aside
            key="m-drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="fixed top-0 right-0 bottom-0 z-[101] w-[88vw] max-w-[420px] bg-[color:var(--color-ink)] text-[color:var(--color-paper)] flex flex-col shadow-[0_30px_120px_rgba(0,0,0,0.5)]"
          >
            {/* Header bar */}
            <div className="flex items-center justify-between px-6 h-16 shrink-0">
              <span className="font-display italic text-[18px]">Ivana Maritano</span>
              <button
                onClick={() => setOpen(false)}
                className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-paper)]/70 hover:text-[color:var(--color-paper)] transition-colors"
              >
                Cerrar [×]
              </button>
            </div>

            {/* Eyebrow */}
            <div className="px-6 pt-6 pb-3 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-paper)]/45">
                (Menú)
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-paper)]/45">
                AR / 2026
              </span>
            </div>

            {/* Items */}
            <nav className="flex-1 overflow-y-auto px-6">
              <ul className="border-t border-[color:var(--color-paper)]/10">
                {ITEMS.map((item, i) => (
                  <motion.li
                    key={item.href}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="group flex items-center justify-between w-full py-5 border-b border-[color:var(--color-paper)]/10"
                    >
                      <span className="font-display italic text-[36px] leading-none text-[color:var(--color-paper)] group-hover:translate-x-1 transition-transform">
                        {item.label}
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-paper)]/40">
                        {item.index}
                      </span>
                    </Link>
                  </motion.li>
                ))}

                <motion.li
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.15 + ITEMS.length * 0.06, ease: [0.16, 1, 0.3, 1] }}
                >
                  <WhatsAppMobileItem onClose={() => setOpen(false)} />
                </motion.li>
              </ul>
            </nav>

            {/* Footer */}
            <div className="px-6 pb-8 pt-6 shrink-0">
              <Link
                href="/#eventos"
                onClick={() => setOpen(false)}
                className="group flex items-center justify-between border border-[color:var(--color-paper)] px-5 py-4 hover:bg-[color:var(--color-paper)] hover:text-[color:var(--color-ink)] transition-colors"
              >
                <span className="font-mono text-[11px] uppercase tracking-[0.22em]">Buscar mis fotos</span>
                <span className="font-mono text-[11px] tracking-[0.22em] transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-paper)]/40">
                © 2026 Ivana Maritano · Fotografía deportiva
              </p>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
