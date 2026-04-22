"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

type CursorVariant = "default" | "view" | "cta" | "hidden";

const cursorContext = {
  variant: "default" as CursorVariant,
  label: "" as string,
  listeners: new Set<() => void>(),
};

export function setCursor(variant: CursorVariant, label = "") {
  cursorContext.variant = variant;
  cursorContext.label = label;
  cursorContext.listeners.forEach((fn) => fn());
}

export function useCursorTrigger(variant: CursorVariant, label = "") {
  return {
    onMouseEnter: () => setCursor(variant, label),
    onMouseLeave: () => setCursor("default"),
  };
}

// Walk up from the hovered element; sections declare data-cursor="dark"|"light".
function applyTheme(target: EventTarget | null) {
  let el = target as HTMLElement | null;
  while (el) {
    const hint = el.dataset?.cursor;
    if (hint === "dark" || hint === "light") {
      const fg = hint === "light" ? "#0a0a0a" : "#f5f2ec";
      const bg = hint === "light" ? "#f5f2ec" : "#0a0a0a";
      document.documentElement.style.setProperty("--cursor-fg", fg);
      document.documentElement.style.setProperty("--cursor-bg", bg);
      return;
    }
    el = el.parentElement;
  }
}

export function Cursor() {
  const x = useMotionValue(-1000);
  const y = useMotionValue(-1000);
  const sx = useSpring(x, { stiffness: 380, damping: 32, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 380, damping: 32, mass: 0.4 });

  const [variant, setVariant] = useState<CursorVariant>("default");
  const [label, setLabel] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const rafRef = useRef<number | null>(null);
  const firstMove = useRef(true);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!mq.matches) return;
    setEnabled(true);
    document.body.classList.add("has-custom-cursor");
    // Start white — page opens on dark Hero
    document.documentElement.style.setProperty("--cursor-fg", "#f5f2ec");
    document.documentElement.style.setProperty("--cursor-bg", "#0a0a0a");

    const move = (e: MouseEvent) => {
      // Color: direct CSS variable write — no React, no batching, instant
      applyTheme(e.target);

      if (firstMove.current) {
        x.set(e.clientX);
        y.set(e.clientY);
        sx.set(e.clientX);
        sy.set(e.clientY);
        firstMove.current = false;
        setHasMoved(true);
        return;
      }
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        x.set(e.clientX);
        y.set(e.clientY);
      });
    };
    window.addEventListener("mousemove", move, { passive: true });

    const onCtxChange = () => {
      setVariant(cursorContext.variant);
      setLabel(cursorContext.label);
    };
    cursorContext.listeners.add(onCtxChange);

    const onLeave = () => setVariant("hidden");
    const onEnter = () => setVariant(cursorContext.variant);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);

    return () => {
      window.removeEventListener("mousemove", move);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      cursorContext.listeners.delete(onCtxChange);
      document.body.classList.remove("has-custom-cursor");
      document.documentElement.style.removeProperty("--cursor-fg");
      document.documentElement.style.removeProperty("--cursor-bg");
    };
  }, [x, y]);

  if (!enabled || !hasMoved) return null;

  return (
    <motion.div
      className="cursor-root"
      style={{ x: sx, y: sy, opacity: variant === "hidden" ? 0 : 1 }}
    >
      {/* default — dot: visible only in default, hides on view/cta */}
      <motion.span
        animate={{
          scale: variant === "default" ? 1 : 0,
          opacity: variant === "default" ? 1 : 0,
        }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "absolute",
          left: -4,
          top: -4,
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "var(--cursor-fg)",
          display: "block",
          transition: "background 0.12s ease",
        }}
      />

      {/* view — sniper crosshair: subtle in default, full in view */}
      <motion.svg
        width="56"
        height="56"
        viewBox="0 0 56 56"
        animate={{
          scale: variant === "view" ? 1 : variant === "default" ? 0.65 : 0.4,
          opacity: variant === "view" ? 1 : variant === "default" ? 0.5 : 0,
          rotate: 0,
        }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: "absolute", left: -28, top: -28, display: "block", overflow: "visible" }}
      >
        <circle cx="28" cy="28" r="22" fill="none" style={{ stroke: "var(--cursor-fg)", transition: "stroke 0.12s ease" }} strokeWidth="1" />
        <line x1="28" y1="2" x2="28" y2="14" style={{ stroke: "var(--cursor-fg)", transition: "stroke 0.12s ease" }} strokeWidth="1" />
        <line x1="28" y1="42" x2="28" y2="54" style={{ stroke: "var(--cursor-fg)", transition: "stroke 0.12s ease" }} strokeWidth="1" />
        <line x1="2" y1="28" x2="14" y2="28" style={{ stroke: "var(--cursor-fg)", transition: "stroke 0.12s ease" }} strokeWidth="1" />
        <line x1="42" y1="28" x2="54" y2="28" style={{ stroke: "var(--cursor-fg)", transition: "stroke 0.12s ease" }} strokeWidth="1" />
        <circle cx="28" cy="28" r="1.5" style={{ fill: "var(--cursor-fg)", transition: "fill 0.12s ease" }} />
      </motion.svg>

      {/* cta — labeled pill */}
      <motion.div
        animate={{
          scale: variant === "cta" ? 1 : 0.6,
          opacity: variant === "cta" ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "absolute",
          left: 14,
          top: -14,
          padding: "6px 14px",
          background: "var(--cursor-fg)",
          color: "var(--cursor-bg)",
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          borderRadius: 999,
          transition: "background 0.12s ease, color 0.12s ease",
        }}
      >
        {label || "↗"}
      </motion.div>
    </motion.div>
  );
}
