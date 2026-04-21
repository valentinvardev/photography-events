"use client";

import Link from "next/link";
import { type ReactNode } from "react";
import { motion } from "motion/react";
import { Nav } from "~/app/_components/design/Nav";
import { Footer } from "~/app/_components/design/Footer";

type Props = {
  eyebrow: string;
  title: ReactNode;
  subtitle?: ReactNode;
  updated: string;
  intro?: ReactNode;
  children: ReactNode;
  prevLink?: { href: string; label: string };
  nextLink?: { href: string; label: string };
};

export function LegalLayout({
  eyebrow,
  title,
  subtitle,
  updated,
  intro,
  children,
  prevLink,
  nextLink,
}: Props) {
  return (
    <main className="relative bg-[color:var(--color-paper)] text-[color:var(--color-ink)]">
      <Nav />

      {/* Hero — editorial title */}
      <section className="px-6 md:px-10 pt-32 md:pt-44 pb-16 md:pb-24">
        <div className="max-w-[1600px] mx-auto grid grid-cols-12 gap-6">
          {/* Crumb */}
          <div className="col-span-12 mb-8 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)]">
            <Link href="/" className="link-draw hover:text-[color:var(--color-ink)] transition-colors">
              Inicio
            </Link>
            <span aria-hidden>/</span>
            <span className="text-[color:var(--color-ink)]">{eyebrow}</span>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="col-span-12 md:col-span-3 eyebrow"
          >
            {eyebrow}
          </motion.p>

          <div className="col-span-12 md:col-span-9 md:col-start-4">
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
              className="font-display italic font-light leading-[0.92] tracking-[-0.04em]"
              style={{ fontSize: "clamp(48px, 9vw, 140px)" }}
            >
              {title}
            </motion.h1>
            {subtitle && (
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.18 }}
                className="mt-8 max-w-2xl font-sans text-[16px] leading-[1.6] text-[color:var(--color-grey-700)]"
              >
                {subtitle}
              </motion.p>
            )}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-10 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)]"
            >
              Actualizado · {updated}
            </motion.p>
          </div>
        </div>
      </section>

      {/* Body — editorial column with side rail */}
      <section className="px-6 md:px-10 pb-32">
        <div className="max-w-[1600px] mx-auto grid grid-cols-12 gap-6">
          {/* Side rail (desktop) */}
          <aside className="hidden md:block col-span-3 sticky top-32 self-start">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mb-4">
              Documento
            </p>
            <div className="space-y-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-700)]">
              <p>Editor · Estudio Ivana M.</p>
              <p>Jurisdicción · Argentina</p>
              <p>Vigencia · {updated}</p>
            </div>
            <div className="mt-8 h-px bg-[color:var(--color-grey-300)]" />
            <p className="mt-6 font-sans text-[13px] leading-[1.55] text-[color:var(--color-grey-700)] max-w-[260px]">
              Este documento se rige por la legislación argentina vigente. Ante cualquier duda, escribí.
            </p>
          </aside>

          {/* Content */}
          <article className="col-span-12 md:col-span-8 md:col-start-4">
            {intro && (
              <div className="mb-12 border-l-2 border-[color:var(--color-ink)] pl-6 py-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mb-2">
                  Marco
                </p>
                <div className="font-sans text-[15px] leading-[1.65] text-[color:var(--color-grey-700)]">
                  {intro}
                </div>
              </div>
            )}
            <div className="legal-doc">{children}</div>

            {/* Footer nav */}
            <div className="mt-24 pt-10 border-t border-[color:var(--color-grey-300)] flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <Link
                href="/"
                className="link-draw font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-700)] hover:text-[color:var(--color-ink)] transition-colors"
              >
                ← Volver al inicio
              </Link>
              {(prevLink || nextLink) && (
                <div className="flex items-center gap-6">
                  {prevLink && (
                    <Link
                      href={prevLink.href}
                      className="link-draw font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-ink)]"
                    >
                      ← {prevLink.label}
                    </Link>
                  )}
                  {nextLink && (
                    <Link
                      href={nextLink.href}
                      className="link-draw font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-ink)]"
                    >
                      {nextLink.label} →
                    </Link>
                  )}
                </div>
              )}
            </div>
          </article>
        </div>
      </section>

      <Footer />
    </main>
  );
}

// Section primitives — used inside LegalLayout's children

export function LegalSection({
  index,
  title,
  children,
}: {
  index: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="py-10 border-t border-[color:var(--color-grey-300)] first:border-t-0 first:pt-0">
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 sm:col-span-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)]">
            §{index}
          </p>
        </div>
        <div className="col-span-12 sm:col-span-10">
          <h2 className="font-display italic text-[28px] md:text-[36px] leading-[1.1] tracking-[-0.02em] text-[color:var(--color-ink)] mb-6">
            {title}
          </h2>
          <div className="space-y-4 font-sans text-[15px] leading-[1.7] text-[color:var(--color-grey-700)] [&_strong]:text-[color:var(--color-ink)] [&_strong]:font-medium [&_a]:underline [&_a]:underline-offset-4 [&_a]:decoration-[color:var(--color-grey-500)] hover:[&_a]:decoration-[color:var(--color-ink)] [&_ul]:list-none [&_ul]:pl-0 [&_ul]:space-y-2 [&_li]:relative [&_li]:pl-5 [&_li]:before:content-['—'] [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:text-[color:var(--color-grey-500)]">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

export function LegalSubSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-6">
      <h3 className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-ink)] mb-3">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export function LegalTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="my-6 border border-[color:var(--color-grey-300)]">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-[color:var(--color-grey-300)]">
            {headers.map((h) => (
              <th
                key={h}
                className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, ri) => (
            <tr
              key={ri}
              className="border-b border-[color:var(--color-grey-300)] last:border-b-0"
            >
              {cells.map((c, ci) => (
                <td key={ci} className="px-4 py-3 font-sans text-[13px] text-[color:var(--color-grey-700)] align-top">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LegalCallout({
  tone = "ink",
  label,
  children,
}: {
  tone?: "ink" | "safelight";
  label: string;
  children: ReactNode;
}) {
  const isSafe = tone === "safelight";
  return (
    <div
      className={`my-6 border-l-2 ${
        isSafe ? "border-[color:var(--color-safelight)]" : "border-[color:var(--color-ink)]"
      } pl-5 py-3`}
    >
      <p
        className={`font-mono text-[10px] uppercase tracking-[0.22em] mb-2 ${
          isSafe ? "text-[color:var(--color-safelight)]" : "text-[color:var(--color-ink)]"
        }`}
      >
        {label}
      </p>
      <div className="font-sans text-[14px] leading-[1.65] text-[color:var(--color-grey-700)]">
        {children}
      </div>
    </div>
  );
}
