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

// Sections declare their background theme via data-cursor="dark"|"light".
// Walk up from the hovered element — first match wins.
function getSectionTheme(target: EventTarget | null): "light" | "dark" {
  let el = target as HTMLElement | null;
  while (el) {
    const hint = el.dataset?.cursor;
    if (hint === "dark") return "dark";
    if (hint === "light") return "light";
    el = el.parentElement;
  }
  return "light";
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
  const [bgTheme, setBgTheme] = useState<"light" | "dark">("light");
  const rafRef = useRef<number | null>(null);
  const firstMove = useRef(true);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!mq.matches) return;
    setEnabled(true);
    document.body.classList.add("has-custom-cursor");

    const move = (e: MouseEvent) => {
      // Theme detection is instant — just a data-attribute walk up the DOM
      setBgTheme(getSectionTheme(e.target));

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
    window.addEventListener("mousemove", move);

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
    };
  }, [x, y]);

  if (!enabled || !hasMoved) return null;

  const dotColor = bgTheme === "light" ? "#0a0a0a" : "#f5f2ec";
  const svgColor = bgTheme === "light" ? "#0a0a0a" : "#f5f2ec";

  return (
    <motion.div
      className="cursor-root"
      style={{ x: sx, y: sy, opacity: variant === "hidden" ? 0 : 1 }}
    >
      {/* default — small dot */}
      <motion.span
        animate={{
          scale: variant === "default" ? 1 : 0,
          opacity: variant === "default" ? 1 : 0,
        }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "absolute",
          left: -4,
          top: -4,
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: dotColor,
          display: "block",
          transition: "background 0.2s ease",
        }}
      />

      {/* view — viewfinder cross-hair */}
      <motion.svg
        width="56"
        height="56"
        viewBox="0 0 56 56"
        animate={{
          scale: variant === "view" ? 1 : 0.4,
          opacity: variant === "view" ? 1 : 0,
          rotate: variant === "view" ? 0 : 45,
        }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: "absolute", left: -28, top: -28, display: "block" }}
      >
        <circle cx="28" cy="28" r="22" fill="none" stroke={svgColor} strokeWidth="1" />
        <line x1="28" y1="2" x2="28" y2="14" stroke={svgColor} strokeWidth="1" />
        <line x1="28" y1="42" x2="28" y2="54" stroke={svgColor} strokeWidth="1" />
        <line x1="2" y1="28" x2="14" y2="28" stroke={svgColor} strokeWidth="1" />
        <line x1="42" y1="28" x2="54" y2="28" stroke={svgColor} strokeWidth="1" />
        <circle cx="28" cy="28" r="1.5" fill={svgColor} />
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
          background: dotColor,
          color: bgTheme === "light" ? "#f5f2ec" : "#0a0a0a",
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          borderRadius: 999,
          transition: "background 0.2s ease, color 0.2s ease",
        }}
      >
        {label || "↗"}
      </motion.div>
    </motion.div>
  );
}
