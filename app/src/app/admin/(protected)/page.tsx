import { api } from "~/trpc/server";
import Link from "next/link";

export default async function AdminDashboard() {
  const [collections, sales] = await Promise.all([
    api.collection.adminList(),
    api.purchase.adminList({ page: 1, limit: 8 }),
  ]);

  const totalPhotos = collections.reduce((acc, c) => acc + c._count.photos, 0);
  const approvedSales = sales.items.filter((s) => s.status === "APPROVED");
  const totalRevenue = approvedSales.reduce((acc, s) => acc + Number(s.amountPaid), 0);
  const publishedCollections = collections.filter((c) => c.isPublished).length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">Resumen general de tu plataforma</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Eventos publicados" value={publishedCollections} total={collections.length} icon="◫" accent="#2563eb" />
        <StatCard label="Fotos totales" value={totalPhotos} icon="▦" accent="#f59e0b" />
        <StatCard label="Ventas aprobadas" value={approvedSales.length} total={sales.total} icon="◈" accent="#16a34a" />
        <StatCard label="Ingresos totales" value={`$${totalRevenue.toLocaleString("es-AR")}`} icon="$" accent="#2563eb" isText />
      </div>

      <div className="mb-8">
        <h2 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">Acciones rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { href: "/admin/colecciones/nueva", label: "Nuevo evento", sub: "Crear un nuevo evento", icon: "+", bg: "#eff6ff", color: "#2563eb" },
            { href: "/admin/colecciones", label: "Gestionar eventos", sub: `${collections.length} evento${collections.length !== 1 ? "s" : ""}`, icon: "◫", bg: "#f0fdf4", color: "#16a34a" },
            { href: "/admin/ventas", label: "Ver ventas", sub: `${sales.total} ventas totales`, icon: "◈", bg: "#fef3c7", color: "#92400e" },
          ].map((item) => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 px-5 py-4 rounded-xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-md hover:border-blue-100 group">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: item.bg, color: item.color }}>
                <span className="text-lg leading-none">{item.icon}</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">{item.label}</p>
                <p className="text-xs text-gray-400">{item.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ventas recientes</h2>
          <Link href="/admin/ventas" className="text-xs text-blue-600 hover:text-blue-800 transition-colors">Ver todas →</Link>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          {sales.items.length === 0 ? (
            <div className="py-14 text-center">
              <p className="text-gray-400 text-sm">Aún no hay ventas registradas</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left bg-gray-50">
                  {["Email", "Dorsal", "Estado", "Monto"].map((h) => (
                    <th key={h} className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sales.items.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 text-gray-600">{sale.buyerEmail}</td>
                    <td className="px-5 py-4 font-mono font-bold text-gray-900">
                      {sale.bibNumber ? `#${sale.bibNumber}` : "—"}
                    </td>
                    <td className="px-5 py-4"><StatusBadge status={sale.status} /></td>
                    <td className="px-5 py-4 font-semibold text-gray-900">${Number(sale.amountPaid).toLocaleString("es-AR")}</td>
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

function StatCard({ label, value, total, icon, accent, isText }: {
  label: string; value: string | number; total?: number; icon: string; accent: string; isText?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm px-5 py-5">
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs text-gray-500 leading-tight">{label}</p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
          style={{ background: `${accent}15`, color: accent }}>{icon}</div>
      </div>
      <p className={`font-bold text-gray-900 ${isText ? "text-xl" : "text-3xl"}`}>{value}</p>
      {total !== undefined && <p className="text-xs text-gray-400 mt-1">de {total} total</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    APPROVED: { bg: "#f0fdf4", text: "#16a34a", label: "Aprobada" },
    PENDING:  { bg: "#fef3c7", text: "#92400e", label: "Pendiente" },
    REJECTED: { bg: "#fef2f2", text: "#ef4444", label: "Rechazada" },
    REFUNDED: { bg: "#eff6ff", text: "#2563eb", label: "Reembolsada" },
  };
  const s = map[status] ?? { bg: "#f1f5f9", text: "#64748b", label: status };
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: s.bg, color: s.text }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.text }} />
      {s.label}
    </span>
  );
}
