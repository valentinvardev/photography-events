"use client";

import { forwardRef, type InputHTMLAttributes } from "react";

type Variant = "ink" | "paper";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  variant?: Variant;
};

export const Field = forwardRef<HTMLInputElement, Props>(function Field(
  { label, hint, variant = "ink", className = "", ...rest },
  ref,
) {
  const isInk = variant === "ink";
  return (
    <label className="block group">
      {label && (
        <span className="block font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mb-2">
          {label}
        </span>
      )}
      <input
        ref={ref}
        className={`w-full bg-transparent border-0 border-b ${
          isInk
            ? "border-[color:var(--color-grey-300)] focus:border-[color:var(--color-ink)] text-[color:var(--color-ink)] placeholder:text-[color:var(--color-grey-500)]"
            : "border-[color:var(--color-grey-700)] focus:border-[color:var(--color-paper)] text-[color:var(--color-paper)] placeholder:text-[color:var(--color-grey-500)]"
        } font-display italic text-[22px] leading-[1.2] py-2.5 outline-none transition-colors ${className}`}
        {...rest}
      />
      {hint && (
        <span className="block font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mt-2">
          {hint}
        </span>
      )}
    </label>
  );
});
