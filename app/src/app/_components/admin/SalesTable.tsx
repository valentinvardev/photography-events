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
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm py-20 text-center">
        <p className="text-gray-900 font-medium mb-1">Sin ventas aún</p>
        <p className="text-gray-400 text-sm">Las ventas aparecerán aquí cuando se realice una compra</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-x-auto">
      <table className="w-full text-sm min-w-[640px]">
        <thead>
          <tr className="border-b border-gray-100 text-left bg-gray-50">
            {["Email comprador", "Dorsal", "Colección", "Estado", "Monto", "Fecha", "Acciones"].map((h, i) => (
              <th key={i} className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((sale) => (
            <tr key={sale.id} className="border-t border-gray-50 transition-colors hover:bg-gray-50">
              <td className="px-5 py-4">
                <p className="text-gray-700">{sale.buyerEmail}</p>
                {sale.buyerName && <p className="text-gray-400 text-xs">{sale.buyerName}</p>}
              </td>
              <td className="px-5 py-4">
                <span className="font-mono font-bold text-gray-900">
                  {sale.bibNumber ? `#${sale.bibNumber}` : "—"}
                </span>
              </td>
              <td className="px-5 py-4 text-gray-500 text-xs">{sale.collection.title}</td>
              <td className="px-5 py-4"><StatusBadge status={sale.status} /></td>
              <td className="px-5 py-4 font-semibold text-gray-900">
                ${Number(sale.amountPaid).toLocaleString("es-AR")}
              </td>
              <td className="px-5 py-4 text-gray-400 text-xs">
                {new Date(sale.createdAt).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}
              </td>
              <td className="px-5 py-4">
                <div className="flex items-center gap-2">
                  {sale.status !== "APPROVED" && (
                    <button
                      onClick={() => setConfirmSale(sale)}
                      disabled={approve.isPending}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 bg-green-50 text-green-700 hover:bg-green-100"
                    >
                      ✓ Aprobar
                    </button>
                  )}
                  {sale.status === "APPROVED" && sale.downloadToken && (
                    <>
                      <button
                        onClick={() => copyDownloadLink(sale.downloadToken!, sale.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-blue-50 text-blue-700 hover:bg-blue-100"
                      >
                        {copiedId === sale.id ? "¡Copiado!" : "↗ Link"}
                      </button>
                      <button
                        onClick={() => resendEmail.mutate({ purchaseId: sale.id })}
                        disabled={resendEmail.isPending}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-violet-50 text-violet-700 hover:bg-violet-100 disabled:opacity-50"
                      >
                        {emailSentId === sale.id ? "✓ Enviado" : "✉ Email"}
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
