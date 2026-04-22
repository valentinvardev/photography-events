"use client";

import { motion, useInView } from "motion/react";
import { useRef, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  delay?: number;
  className?: string;
  variant?: "lift" | "develop" | "split";
  as?: "div" | "span" | "li" | "h1" | "h2" | "h3" | "p" | "section" | "article";
};

export function Reveal({
  children,
  delay = 0,
  className = "",
  variant = "lift",
  as = "div",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });

  const Tag = motion[as] as typeof motion.div;
  const ease = [0.16, 1, 0.3, 1] as const;

  if (variant === "develop") {
    return (
      <Tag
        ref={ref}
        className={className}
        initial={{ clipPath: "inset(0 100% 0 0)" }}
        animate={inView ? { clipPath: "inset(0 0% 0 0)" } : undefined}
        transition={{ duration: 0.9, delay, ease }}
      >
        {children}
      </Tag>
    );
  }

  if (variant === "split") {
    return (
      <Tag
        ref={ref}
        className={className}
        initial={{ clipPath: "inset(50% 0 50% 0)", opacity: 0 }}
        animate={inView ? { clipPath: "inset(0 0 0 0)", opacity: 1 } : undefined}
        transition={{ duration: 0.75, delay, ease }}
      >
        {children}
      </Tag>
    );
  }

  return (
    <Tag
      ref={ref}
      className={className}
      initial={{ y: 24, opacity: 0 }}
      animate={inView ? { y: 0, opacity: 1 } : undefined}
      transition={{ duration: 0.65, delay, ease }}
    >
      {children}
    </Tag>
  );
}
