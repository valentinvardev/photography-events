import { api } from "~/trpc/server";
import Link from "next/link";

export default async function AdminDashboard() {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [collections, purchaseStats, recentSales, analyticsStats] = await Promise.all([
    api.collection.adminList(),
    api.purchase.adminStats({}),
    api.purchase.adminList({ page: 1, limit: 8 }),
    api.analytics.adminStats({ since: since24h }),
  ]);

  const totalPhotos = collections.reduce((acc, c) => acc + c._count.photos, 0);
  const publishedCollections = collections.filter((c) => c.isPublished).length;

  return (
    <div>
      <div className="mb-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mb-2">
          Panel de control
        </p>
        <h1 className="font-display italic font-light leading-[0.92] tracking-[-0.03em]"
            style={{ fontSize: "clamp(36px, 5vw, 72px)" }}>
          Dashboard.
        </h1>
      </div>

      {/* Main stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px border border-[color:var(--color-grey-300)] bg-[color:var(--color-grey-300)] mb-px">
        <StatCard label="Eventos publicados" value={publishedCollections} sub={`de ${collections.length} total`} />
        <StatCard label="Fotos totales" value={totalPhotos.toLocaleString("es-AR")} isText />
        <StatCard label="Ventas aprobadas" value={purchaseStats.approved} sub={`de ${purchaseStats.total} total`} />
        <StatCard label="Ingresos" value={`$${purchaseStats.revenue.toLocaleString("es-AR")}`} isText />
      </div>

      {/* Analytics — last 24h */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px border-x border-b border-[color:var(--color-grey-300)] bg-[color:var(--color-grey-300)] mb-10">
        <StatCard label="Visitas" value={analyticsStats.visits} sub="últimas 24h" dim />
        <StatCard label="Búsquedas dorsal" value={analyticsStats.searchBib} sub="últimas 24h" dim />
        <StatCard label="Búsquedas selfie" value={analyticsStats.searchFace} sub="últimas 24h" dim />
        <StatCard label="Agregados al carrito" value={analyticsStats.cartAdds} sub="últimas 24h" dim />
      </div>

      {/* Quick actions */}
      <div className="mb-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mb-4">
          Acciones rápidas
        </p>
        <div className="flex flex-wrap gap-3">
          {[
            { href: "/admin/colecciones/nueva", label: "Nuevo evento", icon: "+" },
            { href: "/admin/colecciones", label: `Gestionar eventos (${collections.length})`, icon: "◫" },
            { href: "/admin/ventas", label: `Ver ventas (${purchaseStats.total})`, icon: "◈" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group inline-flex items-center gap-3 px-5 py-3 border border-[color:var(--color-grey-300)] hover:border-[color:var(--color-ink)] hover:bg-[color:var(--color-ink)] hover:text-[color:var(--color-paper)] transition-colors"
            >
              <span className="font-mono text-[10px] text-[color:var(--color-grey-500)] group-hover:text-[color:var(--color-paper)] transition-colors">
                {item.icon}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.18em]">
                {item.label}
              </span>
              <span className="font-mono text-[11px] transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent sales */}
      <div>
        <div className="flex items-baseline justify-between mb-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)]">
            Ventas recientes
          </p>
          <Link
            href="/admin/ventas"
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-grey-500)] hover:text-[color:var(--color-ink)] transition-colors"
          >
            Ver todas →
          </Link>
        </div>

        <div className="border border-[color:var(--color-grey-300)]">
          {recentSales.items.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)]">
                Sin ventas registradas
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[color:var(--color-grey-300)]">
                  {["Email", "Dorsal", "Estado", "Monto"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentSales.items.map((sale, i) => (
                  <tr
                    key={sale.id}
                    className={`border-b border-[color:var(--color-grey-100)] hover:bg-[color:var(--color-grey-100)] transition-colors ${
                      i === recentSales.items.length - 1 ? "border-0" : ""
                    }`}
                  >
                    <td className="px-5 py-4 font-sans text-[13px] text-[color:var(--color-grey-700)]">
                      {sale.buyerEmail}
                    </td>
                    <td className="px-5 py-4 font-mono text-[12px] font-bold text-[color:var(--color-ink)]">
                      {sale.bibNumber ? `#${sale.bibNumber}` : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={sale.status} />
                    </td>
                    <td className="px-5 py-4 font-mono text-[12px] text-[color:var(--color-ink)]">
                      ${Number(sale.amountPaid).toLocaleString("es-AR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  isText,
  dim,
}: {
  label: string;
  value: string | number;
  sub?: string;
  isText?: boolean;
  dim?: boolean;
}) {
  return (
    <div className="bg-[color:var(--color-paper)] px-5 py-5">
      <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mb-4">
        {label}
      </p>
      <p className={`font-display italic font-light leading-none ${dim ? "text-[color:var(--color-grey-500)]" : "text-[color:var(--color-ink)]"} ${isText || dim ? "text-[32px]" : "text-[48px]"}`}>
        {value}
      </p>
      {sub && (
        <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-grey-400)] mt-2">
          {sub}
        </p>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = {
    APPROVED: { color: "#16a34a", label: "Aprobada" },
    PENDING:  { color: "#92400e", label: "Pendiente" },
    REJECTED: { color: "#9b0e1f", label: "Rechazada" },
    REFUNDED: { color: "#64748b", label: "Reembolsada" },
  };
  const s = map[status] ?? { color: "#64748b", label: status };
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: s.color }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.color }} />
      {s.label}
    </span>
  );
}
