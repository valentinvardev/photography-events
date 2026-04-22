"use client";

import Image from "next/image";
import { motion } from "motion/react";

export function Hero({ collectionsCount }: { collectionsCount: number }) {
  const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

  return (
    <section
      data-cursor="dark"
      className="relative h-[100svh] min-h-[640px] w-full overflow-hidden bg-[color:var(--color-ink)] text-[color:var(--color-paper)]"
    >
      {/* static photographic backdrop */}
      <div className="absolute inset-0">
        <motion.div
          initial={{ clipPath: "inset(6% 6% 6% 6%)" }}
          animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
          transition={{ duration: 1.2, ease, delay: 0 }}
          className="absolute inset-[-3%] overflow-hidden"
        >
          <Image
            src="/hero.jpg"
            alt=""
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
        </motion.div>
      </div>

      {/* base dark overlay */}
      <div className="absolute inset-0 bg-[color:var(--color-ink)]/55" />
      {/* gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[color:var(--color-ink)]/50 via-[color:var(--color-ink)]/20 to-[color:var(--color-ink)] opacity-35" />

      {/* corner brackets */}
      <div className="pointer-events-none absolute inset-6 md:inset-10">
        <span className="absolute bottom-0 left-0 w-6 h-6 border-l border-b border-[color:var(--color-paper)]/60" />
        <span className="absolute bottom-0 right-0 w-6 h-6 border-r border-b border-[color:var(--color-paper)]/60" />
      </div>

      {/* center wordmark */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-6 text-center pt-16">
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease, delay: 0.05 }}
          className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-paper)]/70 mb-5"
        >
          Ivana Maritano · Fotografía
        </motion.span>

        <h1 className="font-display italic font-light leading-[0.86] tracking-[-0.04em]"
            style={{ fontSize: "clamp(60px, 14vw, 220px)" }}>
          <SplitWord word="No son sólo fotos." delay={0.12} ease={ease} />
          <br />
          <SplitWord word="Son recuerdos" delay={0.22} ease={ease} />
          <br />
          <SplitWord word="que vuelven." delay={0.32} ease={ease} />
        </h1>

        <div className="mt-10 h-px w-32 bg-[color:var(--color-paper)] opacity-60" />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease, delay: 0.6 }}
          className="mt-10 flex flex-col items-center gap-2"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-paper)]/60 flex flex-col items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <path d="M12 5v14M5 12l7 7 7-7"/>
            </svg>
            Deslizá
          </span>
        </motion.div>
      </div>

      {/* bottom metadata */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease, delay: 0.4 }}
        className="absolute bottom-16 md:bottom-20 inset-x-0 flex items-end justify-between px-6 md:px-10"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-paper)]/70">
          Córdoba, AR
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-paper)]/70 text-right">
          Desliza · Eventos
        </span>
      </motion.div>
    </section>
  );
}

function SplitWord({ word, delay, ease }: { word: string; delay: number; ease: [number, number, number, number] }) {
  return (
    <span className="inline-block overflow-hidden align-bottom pb-[0.22em] mb-[-0.22em]">
      <motion.span
        initial={{ y: "100%" }}
        animate={{ y: "0%" }}
        transition={{ duration: 0.7, ease, delay }}
        className="inline-block"
      >
        {word}
      </motion.span>
    </span>
  );
}
