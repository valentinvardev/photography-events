"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import { ConfirmModal } from "~/app/_components/admin/ConfirmModal";
import { MP_TIME_ZONE, calendarDaysUntil } from "~/lib/mp-warning";

export function MercadoPagoConnect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const utils = api.useUtils();
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const { data, isLoading } = api.settings.getMpStatus.useQuery();
  const disconnect = api.settings.disconnectMp.useMutation({
    onSuccess: () => {
      void utils.settings.getMpStatus.invalidate();
      router.replace("/admin/configuracion");
    },
  });

  // Captured once: the effect below clears ?mp= from the URL right away, and the
  // message has to outlive that.
  const [flash] = useState(() => searchParams.get("mp"));
  const mpParam = searchParams.get("mp");
  useEffect(() => {
    if (mpParam) {
      void utils.settings.getMpStatus.invalidate();
      router.replace("/admin/configuracion");
    }
  }, [mpParam, utils, router]);

  if (isLoading) {
    return <div className="h-9 w-48 bg-[color:var(--color-grey-100)] animate-pulse" />;
  }

  const flashMessage =
    flash === "otra-cuenta" ? (
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] leading-relaxed text-[color:var(--color-safelight)] border-l-2 border-[color:var(--color-safelight)] pl-3 py-1 max-w-xl">
        Conectaste una cuenta de MercadoPago distinta a la anterior. Desde ahora los pagos van a esa
        cuenta. Si fue un error, reconectá con la cuenta correcta.
      </p>
    ) : flash === "connected" ? (
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#16a34a] border-l-2 border-[#16a34a] pl-3 py-1">
        ✓ MercadoPago conectado
      </p>
    ) : flash === "error" ? (
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-safelight)] border-l-2 border-[color:var(--color-safelight)] pl-3 py-1">
        Error al conectar. Intentá de nuevo.
      </p>
    ) : null;

  if (data?.connected) {
    const expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
    const dateStr = expiresAt
      ? new Intl.DateTimeFormat("es-AR", {
          day: "numeric",
          month: "long",
          year: "numeric",
          timeZone: MP_TIME_ZONE,
        }).format(expiresAt)
      : null;
    const past = !!expiresAt && expiresAt.getTime() <= Date.now();
    const days = expiresAt && !past ? calendarDaysUntil(expiresAt) : null;
    const countdown =
      days === null ? "" : days === 0 ? " · vence hoy" : days === 1 ? " · falta 1 día" : ` · faltan ${days} días`;
    const warn = data.warning !== null;

    return (
      <div className="flex flex-col gap-3">
        {flashMessage}
        <div className="flex items-center gap-4 flex-wrap">
          <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-grey-700)]">
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                data.warning === "broken"
                  ? "bg-[color:var(--color-safelight)]"
                  : warn
                    ? "bg-[#d97706]"
                    : "bg-[#16a34a]"
              }`}
            />
            {data.warning === "broken" ? "Desconectado · MercadoPago rechaza el acceso" : "Conectado"}
            {data.userId && <span className="text-[color:var(--color-grey-500)]">· #{data.userId}</span>}
          </span>
          {/* Straight through OAuth again: the callback overwrites the token in
              place, so sales keep working. Disconnecting first would not. */}
          <a
            href="/api/mercadopago/connect"
            className={`font-mono text-[10px] uppercase tracking-[0.18em] underline-offset-4 hover:underline ${
              warn ? "text-[color:var(--color-ink)] font-bold" : "text-[color:var(--color-grey-700)]"
            }`}
          >
            Reconectar
          </a>
          <button
            onClick={() => setConfirmDisconnect(true)}
            disabled={disconnect.isPending}
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-safelight)] hover:underline underline-offset-4 disabled:opacity-50 transition-opacity"
          >
            {disconnect.isPending ? "Desconectando…" : "Desconectar"}
          </button>
        </div>
        {dateStr && data.warning !== "broken" && (
          <p
            className={`font-mono text-[9px] uppercase tracking-[0.16em] ${
              warn ? "text-[#b45309]" : "text-[color:var(--color-grey-500)]"
            }`}
          >
            {past ? "La conexión vencía el " : "La conexión vence el "}
            {dateStr}
            {data.expiryEstimated ? " (aprox.)" : ""}
            {countdown}.{" "}
            {past ? "Reconectala ahora" : "Reconectala antes"} con la misma cuenta.
          </p>
        )}

        {confirmDisconnect && (
          <ConfirmModal
            title="¿Desconectar MercadoPago?"
            message="Desde que confirmes, nadie va a poder comprar fotos hasta que vuelvas a conectar una cuenta. Para renovar la conexión usá «Reconectar», que no corta las ventas."
            confirmLabel="Desconectar"
            onCancel={() => setConfirmDisconnect(false)}
            onConfirm={() => {
              setConfirmDisconnect(false);
              disconnect.mutate();
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {flashMessage}
      {data?.valid === false && (
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-safelight)] border-l-2 border-[color:var(--color-safelight)] pl-3 py-1">
          MercadoPago rechaza las credenciales del servidor: nadie puede pagar. Conectá la cuenta.
        </p>
      )}
      <a
        href="/api/mercadopago/connect"
        className="inline-flex items-center gap-3 px-5 py-3 border border-[color:var(--color-grey-300)] hover:border-[color:var(--color-ink)] transition-colors w-fit"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Mercado_Pago.svg/960px-Mercado_Pago.svg.png"
          alt="Mercado Pago"
          className="h-6 w-auto"
        />
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-grey-700)]">
          Conectar cuenta →
        </span>
      </a>
      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[color:var(--color-grey-500)]">
        Se abrirá MercadoPago para autorizar el acceso.
      </p>
    </div>
  );
}
