"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useCursorTrigger } from "./Cursor";
import { MobileNav } from "~/app/_components/MobileNav";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [time, setTime] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      setTime(`${hh}:${mm} · ar`);
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  const photos = useCursorTrigger("cta", "buscar");
  const link = useCursorTrigger("cta", "ir");

  return (
    <motion.nav
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-[background,backdrop-filter,border-color,color] duration-500 ${
        scrolled
          ? "bg-[color:var(--color-paper)]/85 backdrop-blur-md border-b border-[color:var(--color-grey-300)]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-6 px-6 md:px-10 h-16">
        {/* wordmark */}
        <Link href="/" {...link} className="flex items-baseline gap-3">
          <span className={`font-display italic text-[22px] leading-none tracking-tight transition-colors duration-500 ${scrolled ? "text-[color:var(--color-ink)]" : "text-[color:var(--color-paper)]"}`}>
            Ivana Maritano
          </span>
        </Link>

        {/* center — running time/locale (desktop only) */}
        <div className="hidden md:flex justify-center">
          <span className={`font-mono text-[10px] uppercase tracking-[0.22em] transition-colors duration-500 ${scrolled ? "text-[color:var(--color-grey-500)]" : "text-[color:var(--color-paper)]/60"}`}>
            {time}
          </span>
        </div>

        {/* right — links */}
        <div className="flex items-center gap-8">
          {/* Desktop-only links */}
          <Link
            href="#eventos"
            {...link}
            className={`hidden md:inline-block link-draw font-mono text-[11px] uppercase tracking-[0.22em] transition-colors duration-500 ${scrolled ? "text-[color:var(--color-ink)]" : "text-[color:var(--color-paper)]"}`}
          >
            Buscá tu foto
          </Link>
          <a
            href="https://wa.me/5493515551234"
            target="_blank"
            rel="noopener"
            className={`hidden md:flex flex-row items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.22em] hover:opacity-70 transition-all duration-500 ${scrolled ? "text-[color:var(--color-ink)]" : "text-[color:var(--color-paper)]"}`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden className="shrink-0">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <span>WhatsApp</span>
          </a>
          <Link
            href="#eventos"
            {...photos}
            className={`hidden md:inline-flex group relative items-center gap-2 px-4 py-2 border font-mono text-[10px] uppercase tracking-[0.22em] overflow-hidden transition-all duration-500 ${
              scrolled
                ? "border-[color:var(--color-ink)] bg-[color:var(--color-ink)] text-[color:var(--color-paper)]"
                : "border-[color:var(--color-paper)] bg-[color:var(--color-paper)] text-[color:var(--color-ink)]"
            }`}
          >
            <span className="relative z-10">Mis fotos</span>
            <span className="relative z-10 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5">
              ↗
            </span>
          </Link>

          {/* Mobile: Eventos + hamburger, always white */}
          <div className="flex items-center gap-5 md:hidden text-[color:var(--color-paper)]">
            <Link
              href="#eventos"
              className="font-mono text-[11px] uppercase tracking-[0.22em]"
            >
              Buscá tu foto
            </Link>
            <MobileNav />
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
