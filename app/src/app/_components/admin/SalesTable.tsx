"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "~/trpc/react";
import { ConfirmModal } from "./ConfirmModal";

type Sale = {
  id: string;
  buyerEmail: string;
  buyerName: string | null;
  bibNumber: string | null;
  status: string;
  amountPaid: unknown;
  createdAt: Date;
  downloadToken: string | null;
  collection: { title: string };
};

export function SalesTable({ items }: { items: Sale[] }) {
  const router = useRouter();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmSale, setConfirmSale] = useState<Sale | null>(null);
  const [emailSentId, setEmailSentId] = useState<string | null>(null);

  const approve = api.purchase.manualApprove.useMutation({
    onSuccess: () => router.refresh(),
  });

  const resendEmail = api.settings.resendPurchaseEmail.useMutation({
    onSuccess: (_, { purchaseId }) => {
      setEmailSentId(purchaseId);
      setTimeout(() => setEmailSentId(null), 2500);
    },
  });

  const copyDownloadLink = (token: string, id: string) => {
    const url = `${window.location.origin}/descarga/${token}`;
    void navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (items.length === 0) {
    return (
      <div className="border border-[color:var(--color-grey-300)] py-20 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)]">
          Sin ventas aún
        </p>
        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[color:var(--color-grey-400)] mt-2">
          Las ventas aparecerán aquí cuando se realice una compra
        </p>
      </div>
    );
  }

  return (
    <div className="border border-[color:var(--color-grey-300)] overflow-x-auto">
      <table className="w-full min-w-[640px]">
        <thead>
          <tr className="border-b border-[color:var(--color-grey-300)]">
            {["Email comprador", "Dorsal", "Colección", "Estado", "Monto", "Fecha", "Acciones"].map((h) => (
              <th key={h} className="px-4 py-3 text-left font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)]">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((sale, i) => (
            <tr
              key={sale.id}
              className={`hover:bg-[color:var(--color-grey-100)] transition-colors ${
                i < items.length - 1 ? "border-b border-[color:var(--color-grey-100)]" : ""
              }`}
            >
              <td className="px-4 py-3">
                <p className="font-mono text-[10px] text-[color:var(--color-ink)]">{sale.buyerEmail}</p>
                {sale.buyerName && (
                  <p className="font-mono text-[9px] text-[color:var(--color-grey-400)] mt-0.5">{sale.buyerName}</p>
                )}
              </td>

              <td className="px-4 py-3 font-mono text-[12px] font-bold text-[color:var(--color-ink)]">
                {sale.bibNumber ? `#${sale.bibNumber}` : (
                  <span className="font-normal text-[color:var(--color-grey-400)]">—</span>
                )}
              </td>

              <td className="px-4 py-3 font-mono text-[10px] text-[color:var(--color-grey-500)]">
                {sale.collection.title}
              </td>

              <td className="px-4 py-3">
                <StatusBadge status={sale.status} />
              </td>

              <td className="px-4 py-3 font-mono text-[11px] font-bold text-[color:var(--color-ink)]">
                ${Number(sale.amountPaid).toLocaleString("es-AR")}
              </td>

              <td className="px-4 py-3 font-mono text-[10px] text-[color:var(--color-grey-500)]">
                {new Date(sale.createdAt).toLocaleDateString("es-AR", {
                  day: "2-digit", month: "short", year: "numeric",
                })}
              </td>

              <td className="px-4 py-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {sale.status !== "APPROVED" && (
                    <button
                      onClick={() => setConfirmSale(sale)}
                      disabled={approve.isPending}
                      className="px-2.5 py-1 border border-[#16a34a] font-mono text-[9px] uppercase tracking-[0.12em] text-[#16a34a] hover:bg-[#16a34a] hover:text-white transition-colors disabled:opacity-40"
                    >
                      Aprobar
                    </button>
                  )}
                  {sale.status === "APPROVED" && sale.downloadToken && (
                    <>
                      <button
                        onClick={() => copyDownloadLink(sale.downloadToken!, sale.id)}
                        className="px-2.5 py-1 border border-[color:var(--color-grey-300)] font-mono text-[9px] uppercase tracking-[0.12em] text-[color:var(--color-grey-600)] hover:border-[color:var(--color-ink)] hover:text-[color:var(--color-ink)] transition-colors"
                      >
                        {copiedId === sale.id ? "Copiado" : "↗ Link"}
                      </button>
                      <button
                        onClick={() => resendEmail.mutate({ purchaseId: sale.id })}
                        disabled={resendEmail.isPending}
                        className="px-2.5 py-1 border border-[color:var(--color-grey-300)] font-mono text-[9px] uppercase tracking-[0.12em] text-[color:var(--color-grey-600)] hover:border-[color:var(--color-ink)] hover:text-[color:var(--color-ink)] transition-colors disabled:opacity-40"
                      >
                        {emailSentId === sale.id ? "✓ Enviado" : "Email"}
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {confirmSale && (
        <ConfirmModal
          title="Aprobar compra manualmente"
          message={`¿Aprobar la compra de ${confirmSale.buyerEmail} para el dorsal #${confirmSale.bibNumber ?? "—"}?`}
          confirmLabel="Aprobar"
          variant="success"
          onConfirm={() => { approve.mutate({ id: confirmSale.id }); setConfirmSale(null); }}
          onCancel={() => setConfirmSale(null)}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = {
    APPROVED: { color: "#16a34a", label: "Aprobada"    },
    PENDING:  { color: "#92400e", label: "Pendiente"   },
    REJECTED: { color: "var(--color-safelight)", label: "Rechazada"  },
    REFUNDED: { color: "#2563eb", label: "Reembolsada" },
  };
  const s = map[status] ?? { color: "var(--color-grey-500)", label: status };
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: s.color }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.color }} />
      {s.label}
    </span>
  );
}
