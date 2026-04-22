"use client";

import Link from "next/link";
import { useRef, type ReactNode } from "react";
import { useCursorTrigger } from "./Cursor";

type Props = {
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  variant?: "ink" | "outline" | "paper";
  cursorLabel?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
};

export function MagneticButton({
  href,
  onClick,
  children,
  variant = "ink",
  cursorLabel = "click",
  className = "",
  size = "md",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const cursor = useCursorTrigger("cta", cursorLabel);

  const handleMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const dx = (e.clientX - rect.left - rect.width / 2) * 0.25;
    const dy = (e.clientY - rect.top - rect.height / 2) * 0.35;
    ref.current.style.transform = `translate(${dx}px, ${dy}px)`;
  };

  const reset = () => {
    if (ref.current) ref.current.style.transform = "";
    cursor.onMouseLeave();
  };

  const sizes = {
    sm: "px-5 py-2.5 text-[11px]",
    md: "px-7 py-3.5 text-[12px]",
    lg: "px-9 py-4 text-[13px]",
  } as const;

  const variants = {
    ink: "bg-[color:var(--color-ink)] text-[color:var(--color-paper)] border border-[color:var(--color-ink)]",
    outline:
      "bg-transparent text-[color:var(--color-ink)] border border-[color:var(--color-ink)] hover:bg-[color:var(--color-ink)] hover:text-[color:var(--color-paper)]",
    paper:
      "bg-[color:var(--color-paper)] text-[color:var(--color-ink)] border border-[color:var(--color-paper)]",
  } as const;

  const inner = (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      onMouseEnter={cursor.onMouseEnter}
      style={{ transition: "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)" }}
      className={`group relative inline-flex items-center gap-3 font-mono uppercase tracking-[0.2em] transition-colors duration-300 ${sizes[size]} ${variants[variant]} ${className}`}
    >
      <span className="relative inline-flex items-center gap-3">
        {children}
        <span aria-hidden className="inline-block transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1">
          ↗
        </span>
      </span>
    </div>
  );

  if (href) {
    return (
      <Link href={href} onClick={onClick} className="inline-block">
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className="inline-block">
      {inner}
    </button>
  );
}
