import { WatermarkSettings } from "~/app/_components/admin/WatermarkSettings";
import { MercadoPagoConnect } from "~/app/_components/admin/MercadoPagoConnect";

export default function ConfigPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-500 text-sm mt-0.5">Ajustes globales de la plataforma</p>
      </div>

      <div className="max-w-lg flex flex-col gap-8">
        <section className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">MercadoPago</h2>
          <p className="text-xs mb-5 text-gray-500">
            Conectá tu cuenta de MercadoPago para recibir pagos. Solo necesitás autorizar el acceso una vez.
          </p>
          <MercadoPagoConnect />
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Marca de agua</h2>
          <p className="text-xs mb-5 text-gray-500">
            Subí un PNG con fondo transparente. Se compone directamente sobre la imagen al generar
            previews — no es un elemento de CSS, no se puede remover con DevTools.
          </p>
          <WatermarkSettings />
        </section>
      </div>
    </div>
  );
}
