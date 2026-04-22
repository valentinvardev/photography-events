import Link from "next/link";
import {
  LegalLayout,
  LegalSection,
  LegalSubSection,
  LegalTable,
  LegalCallout,
} from "~/app/_components/design/LegalLayout";

export const metadata = {
  title: "Privacidad — Ivana Maritano",
  description:
    "Política de privacidad y tratamiento de datos personales del estudio Ivana Maritano, conforme a la Ley 25.326.",
};

export default function PrivacidadPage() {
  return (
    <LegalLayout
      eyebrow="Privacidad"
      title={<>Tratamiento <span className="not-italic">de datos.</span></>}
      subtitle="Cómo procesamos, conservamos y protegemos los datos personales que el sitio recolecta cuando comprás o buscás tus fotos."
      updated="abril 2026"
      intro={
        <>
          Esta política se rige por la <strong>Ley 25.326 de Protección de los Datos Personales</strong> de la
          República Argentina y sus normas complementarias dictadas por la Agencia de Acceso a la
          Información Pública (AAIP).
        </>
      }
      nextLink={{ href: "/terminos", label: "Condiciones de Servicio" }}
    >
      <LegalSection index="01" title="Responsable del tratamiento">
        <p>
          La responsable del tratamiento de los datos personales recolectados a través de esta plataforma
          es <strong>Ivana Maritano</strong>, fotógrafa profesional con domicilio en la República Argentina.
        </p>
        <p>
          Contacto para asuntos de privacidad:{" "}
          <a href="mailto:hola@ivanamaritano.com.ar">hola@ivanamaritano.com.ar</a>
        </p>
      </LegalSection>

      <LegalSection index="02" title="Datos que recolectamos">
        <p>Recolectamos los siguientes datos según la interacción del usuario con el servicio:</p>

        <LegalSubSection title="2.1 Proporcionados directamente">
          <ul>
            <li>
              <strong>Correo electrónico</strong> — para acceso a compras y envío del comprobante.
            </li>
            <li>
              <strong>Datos de pago</strong> — gestionados exclusivamente por MercadoPago. No almacenamos
              números de tarjeta ni CVV.
            </li>
          </ul>
        </LegalSubSection>

        <LegalSubSection title="2.2 Recolectados automáticamente">
          <ul>
            <li>
              <strong>Dirección IP</strong> y datos de navegación (navegador, sistema operativo, páginas).
            </li>
            <li>
              <strong>Cookies técnicas</strong> necesarias para el funcionamiento (sesión y preferencias).
            </li>
          </ul>
        </LegalSubSection>

        <LegalSubSection title="2.3 Imágenes para reconocimiento facial (opcional)">
          <p>
            Si el usuario elige usar la búsqueda por selfie, la imagen se transmite cifrada al servicio{" "}
            <strong>Amazon Rekognition (AWS)</strong> para comparación con las fotografías del evento. La
            imagen <strong>no se almacena</strong> en los servidores del estudio. El uso es completamente
            voluntario.
          </p>
        </LegalSubSection>
      </LegalSection>

      <LegalSection index="03" title="Finalidad del tratamiento">
        <p>Los datos recolectados se utilizan exclusivamente para las siguientes finalidades:</p>
        <LegalTable
          headers={["Dato", "Finalidad"]}
          rows={[
            ["Correo electrónico", "Comprobante de compra y enlace de descarga"],
            ["Datos de sesión", "Autenticación y acceso al historial"],
            ["Datos de pago", "Procesamiento (MercadoPago)"],
            ["IP / navegación", "Seguridad, prevención de fraude, mejora del servicio"],
            ["Imagen (selfie)", "Búsqueda por reconocimiento facial — uso puntual, no almacenada"],
          ]}
        />
      </LegalSection>

      <LegalSection index="04" title="Base legal del tratamiento">
        <ul>
          <li>
            <strong>Ejecución de contrato</strong> — para procesar compras y entregar archivos adquiridos.
          </li>
          <li>
            <strong>Consentimiento</strong> — para datos biométricos (imagen facial), otorgado de forma
            libre, expresa e informada al usar la búsqueda por selfie.
          </li>
          <li>
            <strong>Interés legítimo</strong> — seguridad y prevención de fraude.
          </li>
          <li>
            <strong>Obligación legal</strong> — cuando lo requiera la normativa vigente.
          </li>
        </ul>
      </LegalSection>

      <LegalSection index="05" title="Datos biométricos y reconocimiento facial">
        <p>
          Por el carácter sensible de los datos biométricos conforme al artículo 2 de la{" "}
          <strong>Ley 25.326</strong>, adoptamos las siguientes medidas:
        </p>
        <ul>
          <li>La imagen se transmite cifrada (HTTPS/TLS) directamente al servicio de comparación.</li>
          <li>No se construyen perfiles biométricos permanentes de los usuarios.</li>
          <li>
            Las colecciones de AWS Rekognition contienen vectores de las fotografías del evento,{" "}
            <strong>no de los usuarios</strong>.
          </li>
          <li>El consentimiento puede retirarse dejando de usar la función.</li>
          <li>La imagen utilizada para la búsqueda no se reutiliza, almacena ni vincula a perfiles de usuario.</li>
        </ul>
      </LegalSection>

      <LegalSection index="06" title="Transferencia de datos a terceros">
        <p>Compartimos datos con los siguientes proveedores, sólo en lo necesario para prestar el servicio:</p>
        <LegalTable
          headers={["Proveedor", "Finalidad", "País"]}
          rows={[
            ["MercadoPago", "Procesamiento de pagos", "Argentina"],
            ["Amazon Web Services", "Almacenamiento y reconocimiento facial", "EE. UU. / Brasil"],
            ["Supabase", "Base de datos y storage", "EE. UU."],
            ["Resend", "Correos transaccionales", "EE. UU."],
          ]}
        />
        <p>
          Las transferencias internacionales se realizan bajo cláusulas contractuales estándar o hacia
          países con nivel adecuado de protección. <strong>No vendemos ni cedemos datos personales</strong>{" "}
          a terceros con fines comerciales. No utilizamos los datos personales para fines publicitarios
          ni de perfilado comercial.
        </p>
      </LegalSection>

      <LegalSection index="07" title="Plazo de conservación">
        <ul>
          <li>
            <strong>Compras y email:</strong> 5 años desde la transacción, por obligaciones contables.
          </li>
          <li>
            <strong>Sesión y navegación:</strong> hasta 12 meses.
          </li>
          <li>
            <strong>Imagen facial:</strong> no se almacena; se procesa en tiempo real y se descarta.
          </li>
          <li>
            <strong>Fotografías:</strong> Las fotografías podrán permanecer disponibles en la
            plataforma por tiempo limitado según cada evento.
          </li>
        </ul>
      </LegalSection>

      <LegalSection index="08" title="Derechos del titular de los datos">
        <p>
          Conforme a los artículos 14 a 16 de la <strong>Ley 25.326</strong>, el titular tiene derecho a:
        </p>
        <ul>
          <li>
            <strong>Acceso</strong> — solicitar información sobre los datos que conservamos.
          </li>
          <li>
            <strong>Rectificación</strong> — corregir datos inexactos o incompletos.
          </li>
          <li>
            <strong>Supresión</strong> — solicitar la eliminación de los datos.
          </li>
          <li>
            <strong>Confidencialidad</strong> — oponerse al tratamiento en determinadas circunstancias.
          </li>
        </ul>
        <p>
          Para ejercer cualquiera de estos derechos, escribinos a{" "}
          <a href="mailto:hola@ivanamaritano.com.ar">hola@ivanamaritano.com.ar</a> indicando tu nombre,
          email asociado y derecho que querés ejercer. Respondemos dentro de los{" "}
          <strong>30 días hábiles</strong> conforme a la normativa.
        </p>
        <LegalCallout label="Autoridad de control">
          Si considerás que el tratamiento no se ajusta a la normativa, podés presentar reclamo ante la{" "}
          <strong>Agencia de Acceso a la Información Pública (AAIP)</strong> en{" "}
          <a href="https://www.argentina.gob.ar/aaip" target="_blank" rel="noopener noreferrer">
            argentina.gob.ar/aaip
          </a>
          .
        </LegalCallout>
      </LegalSection>

      <LegalSection index="09" title="Cookies">
        <p>
          Usamos <strong>cookies técnicas y de sesión</strong> estrictamente necesarias para el
          funcionamiento (autenticación y preferencias). No usamos cookies de seguimiento publicitario ni
          compartimos datos de navegación con redes de publicidad.
        </p>
        <p>
          Podés configurar tu navegador para rechazar cookies, aunque puede afectar algunas funcionalidades.
        </p>
      </LegalSection>

      <LegalSection index="10" title="Seguridad de la información">
        <p>
          Implementamos medidas técnicas y organizativas razonables para proteger los datos contra acceso
          no autorizado, alteración, divulgación o destrucción:
        </p>
        <ul>
          <li>Comunicaciones cifradas mediante TLS / HTTPS.</li>
          <li>Acceso restringido según el principio de mínimo privilegio.</li>
          <li>Proveedores de infraestructura certificados (AWS, Supabase).</li>
        </ul>
      </LegalSection>

      <LegalSection index="11" title="Menores de edad">
        <p>
          El servicio no está dirigido a menores de <strong>13 años</strong>. Si tomamos conocimiento de
          haber recolectado datos de un menor sin consentimiento de su representante legal, los
          eliminaremos.
        </p>
        <p>
          Las imágenes pueden incluir menores de edad en el contexto de eventos públicos o privados.
          El tratamiento de dichas imágenes se realiza conforme a la normativa vigente y bajo
          responsabilidad de los organizadores del evento.
        </p>
      </LegalSection>

      <LegalSection index="12" title="Modificaciones de esta política">
        <p>
          Podemos actualizar esta política periódicamente. Notificaremos cambios significativos publicando
          la nueva versión en esta página con la fecha de actualización. El uso continuado del servicio
          implica aceptación de la política revisada.
        </p>
      </LegalSection>

      <LegalSection index="13" title="Contacto">
        <p>Para cualquier consulta sobre el tratamiento de tus datos personales:</p>
        <ul>
          <li>
            Email — <a href="mailto:hola@ivanamaritano.com.ar">hola@ivanamaritano.com.ar</a>
          </li>
          <li>
            Términos —{" "}
            <Link href="/terminos" className="underline underline-offset-4">
              Condiciones de Servicio
            </Link>
          </li>
        </ul>
      </LegalSection>
    </LegalLayout>
  );
}
