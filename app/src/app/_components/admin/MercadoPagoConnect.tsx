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

  // Show feedback from OAuth redirect
  const mpParam = searchParams.get("mp");
  useEffect(() => {
    if (mpParam) {
      void utils.settings.getMpStatus.invalidate();
      router.replace("/admin/configuracion");
    }
  }, [mpParam, utils, router]);

  if (isLoading) {
    return <div className="h-10 w-48 bg-gray-100 rounded-xl animate-pulse" />;
  }

  if (data?.connected) {
    return (
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 border border-green-100">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-sm font-medium text-green-700">Cuenta conectada</span>
          {data.userId && (
            <span className="text-xs text-green-500 font-mono">#{data.userId}</span>
          )}
        </div>
        <button
          onClick={() => disconnect.mutate()}
          disabled={disconnect.isPending}
          className="px-3 py-2 rounded-xl text-xs font-medium text-red-500 hover:bg-red-50 border border-red-100 transition-all disabled:opacity-50"
        >
          {disconnect.isPending ? "Desconectando..." : "Desconectar"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {mpParam === "error" && (
        <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
          Hubo un error al conectar. Intentá de nuevo.
        </p>
      )}
      <a
        href="/api/mercadopago/connect"
        className="inline-flex items-center justify-center px-8 py-2 rounded-xl transition-all hover:opacity-90 w-fit select-none"
        style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Mercado_Pago.svg/960px-Mercado_Pago.svg.png"
          alt="Mercado Pago"
          className="h-8 w-auto"
        />
      </a>
      <p className="text-xs text-gray-400">
        Se abrirá MercadoPago para que autoricés el acceso. Tus credenciales quedan guardadas de forma segura.
      </p>
    </div>
  );
}
