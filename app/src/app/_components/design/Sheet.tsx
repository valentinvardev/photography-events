"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";

type Props = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** "right" = side drawer (desktop). "bottom" = bottom sheet (mobile). "center" = centered card. */
  position?: "right" | "bottom" | "center";
  width?: string;
  dark?: boolean;
};

export function Sheet({ open, onClose, children, position = "right", width = "440px", dark = false }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = document.body.style.overflow;
    const prevPadding = document.body.style.paddingRight;
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPadding;
    };
  }, [open, onClose]);

  const ease = [0.16, 1, 0.3, 1] as const;

  const variants = {
    right: { initial: { x: "100%" }, animate: { x: 0 }, exit: { x: "100%" } },
    bottom: { initial: { y: "100%" }, animate: { y: 0 }, exit: { y: "100%" } },
    center: {
      initial: { opacity: 0, scale: 0.96 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.97 },
    },
  } as const;

  const positionClasses = {
    right: "fixed top-0 right-0 bottom-0 max-w-[92vw]",
    bottom: "fixed left-0 right-0 bottom-0 max-h-[88svh] rounded-t-[28px]",
    center: "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[92vw]",
  } as const;

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 z-[200] bg-[color:var(--color-ink)]/60"
          />
          <motion.div
            key="sheet"
            initial={variants[position].initial}
            animate={variants[position].animate}
            exit={variants[position].exit}
            transition={{ duration: 0.5, ease }}
            style={position !== "center" ? { width } : { maxWidth: width }}
            className={`z-[201] ${positionClasses[position]} ${
              dark
                ? "bg-[color:var(--color-ink)] text-[color:var(--color-paper)]"
                : "bg-[color:var(--color-paper)] text-[color:var(--color-ink)]"
            } shadow-[0_30px_120px_rgba(0,0,0,0.35)] flex flex-col overflow-hidden`}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
