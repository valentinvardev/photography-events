import { api } from "~/trpc/server";
import { SalesTable } from "~/app/_components/admin/SalesTable";

export default async function SalesPage() {
  const sales = await api.purchase.adminList({ page: 1, limit: 50 });

  const approved = sales.items.filter((s) => s.status === "APPROVED");
  const totalRevenue = approved.reduce((acc, s) => acc + Number(s.amountPaid), 0);

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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px border border-[color:var(--color-grey-300)] bg-[color:var(--color-grey-300)] mb-8">
        {[
          { label: "Total ventas",  value: sales.total },
          { label: "Aprobadas",     value: approved.length },
          { label: "Pendientes",    value: sales.items.filter((s) => s.status === "PENDING").length },
          { label: "Ingresos ARS",  value: `$${totalRevenue.toLocaleString("es-AR")}` },
        ].map((c, i) => (
          <div key={i} className="bg-[color:var(--color-paper)] px-5 py-5">
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mb-3">
              {c.label}
            </p>
            <p className="font-display italic font-light text-[40px] leading-none text-[color:var(--color-ink)]">
              {c.value}
            </p>
          </div>
        ))}
      </div>

      <SalesTable items={sales.items} />
    </div>
  );
}
