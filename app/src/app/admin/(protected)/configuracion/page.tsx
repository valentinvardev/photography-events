import { WatermarkSettings } from "~/app/_components/admin/WatermarkSettings";
import { MercadoPagoConnect } from "~/app/_components/admin/MercadoPagoConnect";

export default function ConfigPage() {
  return (
    <div>
      <div className="mb-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mb-2">
          Ajustes globales
        </p>
        <h1
          className="font-display italic font-light leading-[0.92] tracking-[-0.03em]"
          style={{ fontSize: "clamp(36px, 5vw, 72px)" }}
        >
          Configuración.
        </h1>
      </div>

      <div className="max-w-xl border border-[color:var(--color-grey-300)] divide-y divide-[color:var(--color-grey-300)]">
        <section className="p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mb-1">
            MercadoPago
          </p>
          <p className="font-sans text-[13px] leading-[1.6] text-[color:var(--color-grey-700)] mb-5">
            Conectá tu cuenta para recibir pagos. Solo necesitás autorizar el acceso una vez.
          </p>
          <MercadoPagoConnect />
        </section>

        <section className="p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mb-1">
            Marca de agua
          </p>
          <p className="font-sans text-[13px] leading-[1.6] text-[color:var(--color-grey-700)] mb-5">
            Subí un PNG con fondo transparente. Se compone directamente sobre la imagen al generar
            previews — no es un elemento de CSS, no se puede remover con DevTools.
          </p>
          <WatermarkSettings />
        </section>
      </div>
    </div>
  );
}
