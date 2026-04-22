"use client";

import Image from "next/image";
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useCursorTrigger } from "./Cursor";

export function Hero({ collectionsCount }: { collectionsCount: number }) {
  const ref = useRef<HTMLElement>(null);
  const prefersReduced = useReducedMotion();

  // Detect touch/mobile — disables parallax and heavy scroll animations
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(hover: none), (max-width: 768px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const reduced = prefersReduced ?? isMobile;

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : 240]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, reduced ? 1 : 1.15]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 1], [0.35, reduced ? 0.35 : 0.7]);
  const wordmarkY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -120]);

  // Mouse parallax — only active on desktop (no-op on touch)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smX = useSpring(mouseX, { stiffness: 60, damping: 20, mass: 1 });
  const smY = useSpring(mouseY, { stiffness: 60, damping: 20, mass: 1 });

  // Spotlight — only active on desktop
  const spotX = useMotionValue(-9999);
  const spotY = useMotionValue(-9999);
  const spotBg = useMotionTemplate`radial-gradient(700px circle at ${spotX}px ${spotY}px, rgba(255,255,255,0.08), transparent 65%)`;

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (isMobile) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = (e.clientX - rect.left) / rect.width - 0.5;
    const cy = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(cx * 18);
    mouseY.set(cy * 12);
    spotX.set(e.clientX - rect.left);
    spotY.set(e.clientY - rect.top);
  };
  const handleMouseLeave = () => {
    if (isMobile) return;
    mouseX.set(0);
    mouseY.set(0);
    spotX.set(-9999);
    spotY.set(-9999);
  };

  const view = useCursorTrigger("view");

  const ease = [0.16, 1, 0.3, 1] as const;

  return (
    <section
      ref={ref}
      {...view}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative h-[100svh] min-h-[640px] w-full overflow-hidden bg-[color:var(--color-ink)] text-[color:var(--color-paper)]"
    >
      {/* photographic backdrop with scroll + mouse parallax */}
      <motion.div
        style={{ y, scale }}
        className="absolute inset-0"
      >
        <motion.div
          initial={{ clipPath: reduced ? "inset(0% 0% 0% 0%)" : "inset(8% 8% 8% 8%)" }}
          animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
          transition={{ duration: reduced ? 0 : 2.4, ease, delay: 0.1 }}
          className="absolute inset-[-3%] overflow-hidden"
        >
          <motion.div style={{ x: smX, y: smY }} className="absolute inset-0">
            <Image
              src="/hero.jpg"
              alt=""
              fill
              priority
              className="object-cover object-center"
              sizes="100vw"
            />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* darken overlay — base dark layer */}
      <div className="absolute inset-0 bg-[color:var(--color-ink)]/55" />
      {/* darken overlay — gradient scroll-reactive */}
      <motion.div
        style={{ opacity: overlayOpacity }}
        className="absolute inset-0 bg-gradient-to-b from-[color:var(--color-ink)]/50 via-[color:var(--color-ink)]/20 to-[color:var(--color-ink)]"
      />
      {/* spotlight — follows mouse */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ background: spotBg }}
      />

      {/* corner brackets — viewfinder (bottom only) */}
      <div className="pointer-events-none absolute inset-6 md:inset-10">
        <span className="absolute bottom-0 left-0 w-6 h-6 border-l border-b border-[color:var(--color-paper)]/60" />
        <span className="absolute bottom-0 right-0 w-6 h-6 border-r border-b border-[color:var(--color-paper)]/60" />
      </div>


      {/* center wordmark — pushed slightly below nav with pt */}
      <motion.div
        style={{ y: wordmarkY }}
        className="relative z-10 h-full flex flex-col items-center justify-center px-6 text-center pt-16"
      >
        <motion.span
          initial={{ opacity: 0, letterSpacing: "0.4em" }}
          animate={{ opacity: 1, letterSpacing: "0.22em" }}
          transition={{ duration: 1.6, ease, delay: 0.6 }}
          className="font-mono text-[10px] uppercase text-[color:var(--color-paper)]/70 mb-5"
        >
          Ivana Maritano · Fotografía
        </motion.span>

        {/* the headline */}
        <h1 className="font-display italic font-light leading-[0.86] tracking-[-0.04em]"
            style={{ fontSize: "clamp(60px, 14vw, 220px)" }}>
          <SplitWord word="Cada" delay={0.85} />
          <br />
          <SplitWord word="momento," delay={1.0} />
          <br />
          <SplitWord word="" delay={1.15} extra={
            <span className="inline-block">
              <em className="not-italic font-display font-normal">una</em>{" "}
              <span className="font-display italic">imagen.</span>
            </span>
          } />
        </h1>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.4, ease, delay: 1.6 }}
          className="mt-10 h-px w-32 bg-[color:var(--color-paper)] origin-left"
        />

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease, delay: 1.9 }}
          className="mt-10 flex flex-col items-center gap-2"
        >
          <motion.span
            animate={reduced ? {} : { y: [0, 6, 0] }}
            transition={{ duration: 1.8, repeat: reduced ? 0 : Infinity, ease: "easeInOut" }}
            className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-paper)]/60 flex flex-col items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <path d="M12 5v14M5 12l7 7 7-7"/>
            </svg>
            Deslizá
          </motion.span>
        </motion.div>
      </motion.div>

      {/* bottom — scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease, delay: 2.2 }}
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

function SplitWord({
  word,
  delay,
  extra,
}: {
  word: string;
  delay: number;
  extra?: React.ReactNode;
}) {
  const ease = [0.16, 1, 0.3, 1] as const;
  return (
    <span className="inline-block overflow-hidden align-bottom pb-[0.22em] mb-[-0.22em]">
      <motion.span
        initial={{ y: "100%" }}
        animate={{ y: "0%" }}
        transition={{ duration: 1.1, ease, delay }}
        className="inline-block"
      >
        {extra ?? word}
      </motion.span>
    </span>
  );
}
