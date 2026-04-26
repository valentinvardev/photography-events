"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";

type EventItem = {
  id: string;
  title: string;
  slug: string;
  eventDate?: Date | string | null;
  _count?: { photos: number };
};

type CategoryItem = {
  id: string;
  name: string;
  slug: string;
  buttonHref?: string | null;
  _count?: { collections: number };
};

type Result =
  | { kind: "event"; item: EventItem }
  | { kind: "category"; item: CategoryItem };

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function EventSearchBar({
  collections,
  categories,
}: {
  collections: EventItem[];
  categories: CategoryItem[];
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results: Result[] = query.trim().length < 1
    ? []
    : [
        ...collections
          .filter((c) => normalize(c.title).includes(normalize(query)))
          .slice(0, 6)
          .map((item): Result => ({ kind: "event", item })),
        ...categories
          .filter((c) => normalize(c.name).includes(normalize(query)))
          .slice(0, 4)
          .map((item): Result => ({ kind: "category", item })),
      ];

  const hrefFor = useCallback((r: Result) => {
    if (r.kind === "event") return `/colecciones/${r.item.slug}`;
    return r.item.buttonHref ?? "#eventos";
  }, []);

  // Close on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActive(-1);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      const r = results[active];
      if (r) window.location.href = hrefFor(r);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
      inputRef.current?.blur();
    }
  }

  const showDropdown = open && query.trim().length >= 1;

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      {/* Input */}
      <div className="flex items-center gap-2 border-b border-[color:var(--color-grey-400)] pb-1 focus-within:border-[color:var(--color-ink)] transition-colors">
        <svg className="w-3 h-3 shrink-0 text-[color:var(--color-grey-500)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder="Buscar evento o categoría…"
          className="w-full bg-transparent font-mono text-[11px] uppercase tracking-[0.12em] text-[color:var(--color-ink)] placeholder:text-[color:var(--color-grey-400)] outline-none"
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setActive(-1); inputRef.current?.focus(); }}
            className="text-[color:var(--color-grey-400)] hover:text-[color:var(--color-ink)] transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-[color:var(--color-paper)] border border-[color:var(--color-grey-200)] shadow-lg min-w-[280px]">
          {results.length === 0 ? (
            <div className="px-4 py-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-grey-400)]">
                Sin resultados
              </p>
            </div>
          ) : (
            <ul>
              {results.map((r, i) => {
                const isActive = i === active;
                const label = r.kind === "event" ? r.item.title : r.item.name;
                const sub = r.kind === "event"
                  ? `${r.item._count?.photos ?? 0} fotos`
                  : `${r.item._count?.collections ?? 0} eventos`;
                const tag = r.kind === "event" ? "Evento" : "Categoría";

                return (
                  <li key={r.item.id}>
                    <Link
                      href={hrefFor(r)}
                      onClick={() => { setOpen(false); setQuery(""); }}
                      onMouseEnter={() => setActive(i)}
                      className={`flex items-center justify-between gap-3 px-4 py-3 transition-colors ${
                        isActive
                          ? "bg-[color:var(--color-grey-100)]"
                          : "hover:bg-[color:var(--color-grey-100)]"
                      }`}
                    >
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-[color:var(--color-ink)] truncate">
                          {label}
                        </span>
                        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[color:var(--color-grey-500)]">
                          {sub}
                        </span>
                      </div>
                      <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-[color:var(--color-grey-400)] shrink-0 border border-[color:var(--color-grey-300)] px-1.5 py-0.5">
                        {tag}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
