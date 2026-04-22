"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { api } from "~/trpc/react";

export function MercadoPagoConnect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const utils = api.useUtils();

  const { data, isLoading } = api.settings.getMpStatus.useQuery();
  const disconnect = api.settings.disconnectMp.useMutation({
    onSuccess: () => {
      void utils.settings.getMpStatus.invalidate();
      router.replace("/admin/configuracion");
    },
  });

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

  if (data?.connected) {
    return (
      <div className="flex items-center gap-4 flex-wrap">
        <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-grey-700)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] shrink-0" />
          Conectado
          {data.userId && (
            <span className="text-[color:var(--color-grey-500)]">· #{data.userId}</span>
          )}
        </span>
        <button
          onClick={() => disconnect.mutate()}
          disabled={disconnect.isPending}
          className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-safelight)] hover:underline underline-offset-4 disabled:opacity-50 transition-opacity"
        >
          {disconnect.isPending ? "Desconectando…" : "Desconectar"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {mpParam === "error" && (
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-safelight)] border-l-2 border-[color:var(--color-safelight)] pl-3 py-1">
          Error al conectar. Intentá de nuevo.
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
