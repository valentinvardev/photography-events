"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { SalesTable } from "~/app/_components/admin/SalesTable";

type Period = "1h" | "24h" | "7d" | "30d" | "90d" | "180d" | "1y" | "all";

const PERIODS: { id: Period; label: string; ms: number | null }[] = [
  { id: "1h",   label: "1 h",   ms: 60 * 60 * 1000 },
  { id: "24h",  label: "24 h",  ms: 24 * 60 * 60 * 1000 },
  { id: "7d",   label: "7 d",   ms: 7 * 24 * 60 * 60 * 1000 },
  { id: "30d",  label: "30 d",  ms: 30 * 24 * 60 * 60 * 1000 },
  { id: "90d",  label: "3 m",   ms: 90 * 24 * 60 * 60 * 1000 },
  { id: "180d", label: "6 m",   ms: 180 * 24 * 60 * 60 * 1000 },
  { id: "1y",   label: "1 a",   ms: 365 * 24 * 60 * 60 * 1000 },
  { id: "all",  label: "Todo",  ms: null },
];

function sinceFromPeriod(period: Period): string | undefined {
  const p = PERIODS.find((x) => x.id === period);
  if (!p || p.ms === null) return undefined;
  return new Date(Date.now() - p.ms).toISOString();
}

export default function SalesPage() {
  const [period, setPeriod] = useState<Period>("all");
  const since = sinceFromPeriod(period);

  const { data: stats, isLoading: statsLoading } = api.purchase.adminStats.useQuery({ since });
  const { data: sales, isLoading: salesLoading } = api.purchase.adminList.useQuery({
    page: 1,
    limit: 500,
    since,
  });

  const isLoading = statsLoading || salesLoading;

  return (
    <div>
      <div className="mb-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mb-2">
          Historial de pagos
        </p>
        <h1
          className="font-display italic font-light leading-[0.92] tracking-[-0.03em]"
          style={{ fontSize: "clamp(36px, 5vw, 72px)" }}
        >
          Ventas.
        </h1>
      </div>

      {/* Period filter */}
      <div className="flex items-center gap-px mb-8 border border-[color:var(--color-grey-300)] bg-[color:var(--color-grey-300)] w-fit">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className={`px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors ${
              period === p.id
                ? "bg-[color:var(--color-ink)] text-[color:var(--color-paper)]"
                : "bg-[color:var(--color-paper)] text-[color:var(--color-grey-500)] hover:text-[color:var(--color-ink)]"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px border border-[color:var(--color-grey-300)] bg-[color:var(--color-grey-300)] mb-8">
        {[
          { label: "Total ventas",  value: stats?.total ?? "—" },
          { label: "Aprobadas",     value: stats?.approved ?? "—" },
          { label: "Pendientes",    value: stats?.pending ?? "—" },
          { label: "Ingresos ARS",  value: stats ? `$${stats.revenue.toLocaleString("es-AR")}` : "—" },
        ].map((c, i) => (
          <div key={i} className="bg-[color:var(--color-paper)] px-5 py-5">
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mb-3">
              {c.label}
            </p>
            <p className={`font-display italic font-light text-[40px] leading-none text-[color:var(--color-ink)] transition-opacity ${isLoading ? "opacity-30" : ""}`}>
              {c.value}
            </p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="border border-[color:var(--color-grey-300)] py-20 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-grey-400)]">
            Cargando…
          </p>
        </div>
      ) : (
        <SalesTable items={sales?.items ?? []} />
      )}
    </div>
  );
}
