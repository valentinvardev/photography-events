"use client";

import Link from "next/link";
import { useCursorTrigger } from "./design/Cursor";

export type EventCardCol = {
  title: string;
  description?: string | null;
  slug?: string;
  coverUrl?: string | null;
  bannerUrl?: string | null;
  bannerFocalY?: number | null;
  logoUrl?: string | null;
  eventDate?: Date | string | null;
  _count?: { photos: number };
};

export function EventCard({
  col,
  index = 0,
  preview,
}: {
  col: EventCardCol;
  index?: number;
  preview?: boolean;
}) {
  const dateStr = col.eventDate
    ? new Intl.DateTimeFormat("es-AR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(col.eventDate))
    : null;

  const focalY = col.bannerFocalY ?? 0.5;
  const objectPosition = `center ${Math.round(focalY * 100)}%`;
  const cover = col.bannerUrl ?? col.coverUrl;
  const num = String(index + 1).padStart(2, "0");
  const view = useCursorTrigger("view", "ver");

  const card = (
    <article
      {...view}
      className="group relative block"
    >
      {/* contact-sheet number + caption row */}
      <div className="flex items-baseline justify-between mb-3 px-1">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)]">
          ({num})
        </span>
        {dateStr && (
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)]">
            {dateStr}
          </span>
        )}
      </div>

      {/* image frame */}
      <div className="relative aspect-[4/5] overflow-hidden bg-[color:var(--color-grey-900)] viewfinder-corners">
        {cover ? (
          <img
            src={cover}
            alt={col.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
            style={{ objectPosition }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-700)]">
              sin cubierta
            </span>
          </div>
        )}

        {/* hover overlay — develop strip */}
        <div className="absolute inset-0 bg-[color:var(--color-ink)] opacity-0 group-hover:opacity-20 transition-opacity duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" />

        {/* sliding caption strip from bottom */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] bg-[color:var(--color-paper)] text-[color:var(--color-ink)] px-4 py-3 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em]">
            {col._count?.photos ?? "—"} {col._count?.photos === 1 ? "foto" : "fotos"}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] flex items-center gap-2">
            Explorar
            <span className="inline-block transition-transform duration-500 group-hover:translate-x-1">
              ↗
            </span>
          </span>
        </div>
      </div>

      {/* title + inline cta */}
      <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h3 className="font-display italic text-[28px] leading-[1.05] tracking-[-0.02em] text-[color:var(--color-ink)] group-hover:translate-x-1 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
          {col.title || "Sin nombre"}
        </h3>
        {!preview && col.slug && (
          <span className="shrink-0 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] group-hover:text-[color:var(--color-ink)] transition-colors duration-300">
            Ver evento
            <span className="transition-transform duration-500 group-hover:translate-x-0.5">→</span>
          </span>
        )}
      </div>
    </article>
  );

  if (preview || !col.slug) return card;

  return (
    <Link href={`/colecciones/${col.slug}`} className="block">
      {card}
    </Link>
  );
}
