"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "motion/react";

type Props = {
  title: string;
  dateStr: string | null;
  description: string | null;
  bannerSrc: string | null;
  logoUrl: string | null;
  photoCount: number;
  price: number;
  bannerFocalY?: number;
};

export function CollectionHero({
  title,
  dateStr,
  description,
  bannerSrc,
  logoUrl,
  photoCount,
  price,
  bannerFocalY = 50,
}: Props) {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const titleY = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);

  // Split title into words for staggered reveal
  const words = title.split(" ");

  // Live time
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

  return (
    <section
      ref={heroRef}
      className="relative bg-[color:var(--color-ink)] text-[color:var(--color-paper)] overflow-hidden"
      style={{ minHeight: "min(50vh, 420px)" }}
    >
      {/* Background image with parallax */}
      {bannerSrc && (
        <motion.div className="absolute inset-0" style={{ y: imgY }}>
          <img
            src={bannerSrc}
            alt=""
            className="w-full h-[120%] object-cover"
            style={{ objectPosition: `50% ${bannerFocalY}%` }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0.35) 40%, rgba(10,10,10,0.95) 100%)",
            }}
          />
        </motion.div>
      )}

      {/* Decorative corners */}
      <span className="pointer-events-none absolute top-6 left-6 md:top-10 md:left-10 w-5 h-5 border-l border-t border-[color:var(--color-paper)]/40 z-10" />
      <span className="pointer-events-none absolute top-6 right-6 md:top-10 md:right-10 w-5 h-5 border-r border-t border-[color:var(--color-paper)]/40 z-10" />
      <span className="pointer-events-none absolute bottom-6 left-6 md:bottom-10 md:left-10 w-5 h-5 border-l border-b border-[color:var(--color-paper)]/40 z-10" />
      <span className="pointer-events-none absolute bottom-6 right-6 md:bottom-10 md:right-10 w-5 h-5 border-r border-b border-[color:var(--color-paper)]/40 z-10" />

      {/* Top metadata strip */}
      <div className="relative z-10 px-6 md:px-10 pt-16 md:pt-20 flex items-center justify-end">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-paper)]/60">
          AR · {time}
        </p>
      </div>

      {/* Main title */}
      <motion.div
        style={{ y: titleY }}
        className="relative z-10 px-6 md:px-10 pt-16 md:pt-24 max-w-[1600px] mx-auto"
      >
        {logoUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8 inline-block w-16 h-16 md:w-20 md:h-20 overflow-hidden border border-[color:var(--color-paper)]/30"
          >
            <img src={logoUrl} alt="" className="w-full h-full object-cover" />
          </motion.div>
        )}

        <h1
          className="font-display italic font-light leading-[0.9] tracking-[-0.04em]"
          style={{ fontSize: "clamp(48px, 11vw, 180px)" }}
        >
          {words.map((w, i) => (
            <motion.span
              key={i}
              initial={{ y: "110%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              transition={{
                duration: 0.85,
                delay: 0.1 + i * 0.07,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="inline-block overflow-hidden mr-[0.25em] last:mr-0"
              style={{ verticalAlign: "top" }}
            >
              {w}
            </motion.span>
          ))}
        </h1>

        {/* Stats + CTA row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-4 pb-2"
        >
          {dateStr && (
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-paper)]/45 mb-0.5">Fecha</p>
              <p className="font-display italic text-[18px] leading-tight text-[color:var(--color-paper)]">{dateStr}</p>
            </div>
          )}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-paper)]/45 mb-0.5">Capturas</p>
            <p className="font-display italic text-[18px] leading-tight text-[color:var(--color-paper)]">{String(photoCount).padStart(3, "0")}</p>
          </div>
          {price > 0 && (
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-paper)]/45 mb-0.5">Por foto</p>
              <p className="font-display italic text-[18px] leading-tight text-[color:var(--color-paper)]">${price.toLocaleString("es-AR")}</p>
            </div>
          )}

          <a
            href="#search"
            className="w-full sm:w-auto sm:ml-auto justify-center inline-flex items-center gap-3 px-5 py-3 bg-[color:var(--color-paper)] text-[color:var(--color-ink)] hover:bg-[color:var(--color-paper)]/90 transition-colors"
          >
            <span className="font-mono text-[11px] uppercase tracking-[0.22em]">Buscar mis fotos</span>
            <span className="font-mono text-[11px]">↓</span>
          </a>
        </motion.div>
      </motion.div>

      {/* Bottom padding spacer */}
      <div className="relative z-10 pb-10" />
    </section>
  );
}
