import type { ReactNode } from "react";

export function Marquee({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <div
      className="overflow-hidden py-3 border-y"
      style={{
        background: dark ? "var(--color-ink)" : "var(--color-paper)",
        color: dark ? "var(--color-paper)" : "var(--color-ink)",
        borderColor: dark ? "var(--color-grey-900)" : "var(--color-grey-300)",
      }}
    >
      <div className="marquee-track font-mono text-[11px] uppercase tracking-[0.2em]">
        {/* duplicated content for seamless loop */}
        <span className="flex items-center gap-16 pr-16">{children}</span>
        <span className="flex items-center gap-16 pr-16" aria-hidden="true">{children}</span>
      </div>
    </div>
  );
}
