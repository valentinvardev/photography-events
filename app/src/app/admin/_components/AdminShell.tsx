"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

function NavItem({
  href,
  label,
  onNavigate,
}: {
  href: string;
  label: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const isActive =
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`block px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors ${
        isActive
          ? "bg-[color:var(--color-ink)] text-[color:var(--color-paper)]"
          : "text-[color:var(--color-grey-700)] hover:text-[color:var(--color-ink)] hover:bg-[color:var(--color-grey-100)]"
      }`}
    >
      {label}
    </Link>
  );
}

export function AdminShell({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const sidebar = (
    <aside className="w-56 shrink-0 flex flex-col border-r border-[color:var(--color-grey-300)] bg-[color:var(--color-paper)] h-full">
      {/* Branding */}
      <div className="px-5 py-5 border-b border-[color:var(--color-grey-300)] flex items-start justify-between">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-[color:var(--color-grey-500)] mb-1.5">
            Admin
          </p>
          <span className="font-display italic text-[20px] leading-none text-[color:var(--color-ink)]">
            Ivana Maritano
          </span>
        </div>
        {/* Close — mobile only */}
        <button
          className="lg:hidden text-[color:var(--color-grey-500)] hover:text-[color:var(--color-ink)] transition-colors mt-0.5"
          onClick={close}
          aria-label="Cerrar menú"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* User */}
      <div className="px-5 py-3 border-b border-[color:var(--color-grey-300)]">
        <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mb-0.5">
          Sesión
        </p>
        <p className="font-mono text-[10px] text-[color:var(--color-grey-700)] truncate">
          {userEmail ?? "—"}
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3">
        <p className="px-5 pb-2 font-mono text-[9px] uppercase tracking-[0.26em] text-[color:var(--color-grey-500)]">
          Navegación
        </p>
        <NavItem href="/admin" label="Dashboard" onNavigate={close} />
        <NavItem href="/admin/colecciones" label="Eventos" onNavigate={close} />
        <NavItem href="/admin/ventas" label="Ventas" onNavigate={close} />
        <NavItem href="/admin/reconocimiento" label="Reconocimiento" onNavigate={close} />
        <NavItem href="/admin/qr" label="Códigos QR" onNavigate={close} />
        <NavItem href="/admin/configuracion" label="Configuración" onNavigate={close} />
      </nav>

      {/* Bottom links */}
      <div className="border-t border-[color:var(--color-grey-300)] py-3">
        <Link
          href="/"
          target="_blank"
          onClick={close}
          className="flex items-center gap-2 px-5 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-grey-500)] hover:text-[color:var(--color-ink)] transition-colors"
        >
          <span>↗</span> Ver sitio
        </Link>
        <Link
          href="/api/auth/signout"
          className="flex items-center gap-2 px-5 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-grey-500)] hover:text-[color:var(--color-safelight)] transition-colors"
        >
          <span>→</span> Cerrar sesión
        </Link>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen flex bg-[color:var(--color-paper)] text-[color:var(--color-ink)]">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-56 lg:shrink-0 lg:fixed lg:inset-y-0 lg:overflow-y-auto">
        {sidebar}
      </div>

      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-20 lg:hidden bg-[color:var(--color-ink)]/40"
          onClick={close}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-30 flex flex-col lg:hidden transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ width: 224 }}
      >
        {sidebar}
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 lg:ml-56">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-4 px-5 h-14 border-b border-[color:var(--color-grey-300)] bg-[color:var(--color-paper)] sticky top-0 z-10">
          <button
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
            className="flex flex-col gap-1.5"
          >
            <span className="block h-px w-5 bg-[color:var(--color-ink)]" />
            <span className="block h-px w-5 bg-[color:var(--color-ink)]" />
            <span className="block h-px w-3 bg-[color:var(--color-ink)]" />
          </button>
          <span className="font-display italic text-[18px] text-[color:var(--color-ink)]">
            Ivana Maritano
          </span>
          <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.26em] text-[color:var(--color-grey-500)]">
            Admin
          </span>
        </header>

        <main className="flex-1">
          <div className="p-6 lg:p-10 max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
