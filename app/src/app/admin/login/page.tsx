"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { Field } from "~/app/_components/design/Field";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Email o contraseña incorrectos.");
      setLoading(false);
    } else {
      window.location.href = "/admin";
    }
  };

  return (
    <main className="min-h-screen bg-[color:var(--color-ink)] text-[color:var(--color-paper)] relative overflow-hidden">
      {/* Decorative grid lines */}
      <div className="pointer-events-none absolute inset-0 grid grid-cols-12 gap-0">
        {Array.from({ length: 11 }).map((_, i) => (
          <div
            key={i}
            className="border-l border-[color:var(--color-grey-900)] col-start-[var(--c)]"
            style={{ ["--c" as never]: i + 2 } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Top bar */}
      <div className="relative flex items-center justify-between px-6 md:px-10 h-20">
        <Link
          href="/"
          className="link-draw font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-paper)]/70 hover:text-[color:var(--color-paper)] transition-colors flex items-center gap-2"
        >
          <span>←</span>
          Volver al sitio
        </Link>
        <span className="font-display italic text-[18px] text-[color:var(--color-paper)]">
          Ivana Maritano
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-paper)]/40">
          Admin · 2026
        </span>
      </div>

      {/* Body */}
      <div className="relative max-w-[1600px] mx-auto px-6 md:px-10 pt-16 md:pt-28 pb-20 grid grid-cols-12 gap-6">
        <p className="col-span-12 md:col-span-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-paper)]/45">
          (00) — Acceso restringido
        </p>

        <div className="col-span-12 md:col-span-8 md:col-start-4">
          <h1
            className="font-display italic font-light leading-[0.9] tracking-[-0.04em]"
            style={{ fontSize: "clamp(56px, 10vw, 160px)" }}
          >
            Cuarto<br />
            <span className="text-[color:var(--color-grey-500)]">oscuro.</span>
          </h1>

          <p className="mt-10 max-w-md font-sans text-[15px] leading-[1.65] text-[color:var(--color-paper)]/70">
            Panel de administración. Solo personal autorizado puede ingresar y modificar colecciones.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-16 max-w-xl flex flex-col gap-9"
          >
            <Field
              variant="paper"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@ivana.ar"
              required
              autoFocus
              autoComplete="email"
            />
            <Field
              variant="paper"
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />

            {error && (
              <div className="border-l-2 border-[color:var(--color-safelight)] pl-4 py-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-safelight)]">
                  Error · auth
                </p>
                <p className="mt-1 font-display italic text-[18px] text-[color:var(--color-paper)]">
                  {error}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between mt-4 gap-6 flex-wrap">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-paper)]/40">
                Sesión protegida · NextAuth
              </span>
              <button
                type="submit"
                disabled={loading}
                className="group inline-flex items-center justify-between gap-8 border border-[color:var(--color-paper)] px-6 py-4 hover:bg-[color:var(--color-paper)] hover:text-[color:var(--color-ink)] transition-colors disabled:opacity-40 disabled:cursor-wait"
              >
                <span className="font-mono text-[11px] uppercase tracking-[0.22em]">
                  {loading ? "Revelando…" : "Ingresar"}
                </span>
                <span className="font-mono text-[11px] tracking-[0.22em] transition-transform group-hover:translate-x-1">
                  →
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Bottom mark */}
      <div className="relative px-6 md:px-10 pb-10 pt-20 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-paper)]/35">
          Estudio Ivana Maritano · Córdoba, AR
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-paper)]/35">
          v1.0
        </span>
      </div>
    </main>
  );
}
