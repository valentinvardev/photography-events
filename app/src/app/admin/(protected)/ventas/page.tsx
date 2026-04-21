import { api } from "~/trpc/server";
import { SalesTable } from "~/app/_components/admin/SalesTable";

export default async function SalesPage() {
  const sales = await api.purchase.adminList({ page: 1, limit: 50 });

  const approved = sales.items.filter((s) => s.status === "APPROVED");
  const totalRevenue = approved.reduce((acc, s) => acc + Number(s.amountPaid), 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Ventas</h1>
        <p className="text-gray-500 text-sm mt-0.5">{sales.total} venta{sales.total !== 1 ? "s" : ""} registrada{sales.total !== 1 ? "s" : ""}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Total ventas", value: sales.total },
          { label: "Aprobadas", value: approved.length },
          { label: "Pendientes", value: sales.items.filter(s => s.status === "PENDING").length },
          { label: "Ingresos", value: `$${totalRevenue.toLocaleString("es-AR")}`, isText: true },
        ].map((c, i) => (
          <div key={i} className="rounded-2xl border border-gray-100 bg-white shadow-sm px-4 py-4">
            <p className="text-xs text-gray-500 mb-2">{c.label}</p>
            <p className={`font-bold text-gray-900 ${c.isText ? "text-lg" : "text-2xl"}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <SalesTable items={sales.items} />
    </div>
  );
}
