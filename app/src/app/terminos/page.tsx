import Link from "next/link";
import {
  LegalLayout,
  LegalSection,
  LegalCallout,
} from "~/app/_components/design/LegalLayout";

export const metadata = {
  title: "Condiciones de Servicio — Ivana Maritano",
  description: "Términos y condiciones de uso de la plataforma de Ivana Maritano.",
};

export default function TerminosPage() {
  return (
    <LegalLayout
      eyebrow="Condiciones"
      title={
        <>
          Condiciones <span className="not-italic">de servicio.</span>
        </>
      }
      subtitle="Marco contractual entre vos y el estudio cuando comprás, descargás y usás las fotografías ofrecidas en este sitio."
      updated="abril 2026"
      prevLink={{ href: "/privacidad", label: "Política de Privacidad" }}
    >
      <LegalSection index="01" title="Aceptación de las condiciones">
        <p>
          Al acceder y utilizar la plataforma de Ivana Maritano (en adelante, &ldquo;el Servicio&rdquo;),
          operada por <strong>Ivana Maritano</strong> (en adelante, &ldquo;la Estudio&rdquo;), aceptás
          quedar vinculado por las presentes Condiciones de Servicio. Si no estás de acuerdo con alguna,
          no utilices el Servicio.
        </p>
        <p>
          El uso del Servicio implica la aceptación plena de estas condiciones, así como de la{" "}
          <Link href="/privacidad" className="underline underline-offset-4">
            Política de Privacidad
          </Link>{" "}
          vigente.
        </p>
      </LegalSection>

      <LegalSection index="02" title="Descripción del Servicio">
        <p>
          El estudio Ivana Maritano es una plataforma de fotografía deportiva profesional que permite a
          los usuarios:
        </p>
        <ul>
          <li>Buscar y visualizar fotografías tomadas en eventos deportivos.</li>
          <li>Adquirir fotografías digitales en alta resolución.</li>
          <li>Utilizar reconocimiento facial para encontrar fotografías propias.</li>
          <li>Descargar las fotografías adquiridas en formato digital.</li>
        </ul>
        <p>
          Las fotografías se adquieren mediante pago electrónico procesado por MercadoPago. Una vez
          confirmado el pago, el usuario recibe acceso de descarga.
        </p>
      </LegalSection>

      <LegalSection index="03" title="Registro y cuenta de usuario">
        <p>
          Algunas funciones pueden requerir crear una cuenta. El usuario es responsable de mantener la
          confidencialidad de sus credenciales y de la actividad que ocurra bajo su cuenta. La Estudio
          no será responsable por pérdidas derivadas del uso no autorizado de la cuenta.
        </p>
        <p>El usuario se compromete a proporcionar información veraz y actualizada al registrarse.</p>
      </LegalSection>

      <LegalSection index="04" title="Propiedad intelectual y licencia de uso">
        <p>
          Todas las fotografías disponibles son propiedad exclusiva de Ivana Maritano y están
          protegidas por la <strong>Ley 11.723 de Propiedad Intelectual</strong> de la República
          Argentina.
        </p>
        <p>
          Al adquirir una fotografía, obtenés una <strong>licencia personal, no exclusiva e
          intransferible</strong> que te permite:
        </p>
        <ul>
          <li>Imprimir y enmarcar la fotografía para uso personal.</li>
          <li>Compartirla en redes sociales personales, con crédito a Ivana Maritano.</li>
          <li>Almacenarla en tus dispositivos personales.</li>
        </ul>
        <LegalCallout label="Prohibido" tone="safelight">
          Revender, sublicenciar o distribuir comercialmente. Modificar, editar o eliminar marcas de
          agua sin autorización expresa. Utilizar las fotografías con fines publicitarios o
          comerciales sin acuerdo previo escrito.
        </LegalCallout>
      </LegalSection>

      <LegalSection index="05" title="Precios y pagos">
        <p>
          Los precios son los indicados en la plataforma al momento de la compra y se expresan en{" "}
          <strong>pesos argentinos (ARS)</strong>, salvo indicación en contrario. Los precios incluyen
          el Impuesto al Valor Agregado (IVA) cuando corresponda.
        </p>
        <p>
          Los pagos se procesan exclusivamente a través de <strong>MercadoPago</strong>. No
          almacenamos datos de tarjetas de crédito ni débito. El procesamiento está sujeto a los
          términos de MercadoPago.
        </p>
        <p>
          La Estudio se reserva el derecho de modificar los precios en cualquier momento, sin afectar
          las compras ya realizadas y confirmadas.
        </p>
      </LegalSection>

      <LegalSection index="06" title="Política de reembolsos y devoluciones">
        <p>
          Por la naturaleza digital de los productos, una vez descargada la fotografía no procederá la
          devolución del importe, salvo en los siguientes casos:
        </p>
        <ul>
          <li>Error técnico imputable a la plataforma que impida la descarga.</li>
          <li>Entrega de un archivo diferente al adquirido.</li>
          <li>Defecto grave de calidad no atribuible a las condiciones de captura.</li>
        </ul>
        <p>
          Las solicitudes de reembolso deben realizarse dentro de los <strong>10 días corridos</strong>{" "}
          posteriores a la compra, escribiendo a{" "}
          <a href="mailto:hola@ivanamaritano.com.ar">hola@ivanamaritano.com.ar</a> con el comprobante
          de pago.
        </p>
        <LegalCallout label="Defensa del consumidor">
          De conformidad con el artículo 34 de la <strong>Ley 24.240</strong> y modificaciones, el
          usuario tiene derecho a revocar la aceptación durante DIEZ (10) días corridos contados desde
          la celebración del contrato o desde la posesión del bien, lo que ocurra último, cuando el
          contrato se haya celebrado fuera del establecimiento comercial, incluyendo modalidad
          electrónica.
        </LegalCallout>
      </LegalSection>

      <LegalSection index="07" title="Reconocimiento facial">
        <p>
          La plataforma ofrece de manera opcional la búsqueda por reconocimiento facial a partir de una
          imagen (selfie) aportada voluntariamente. Esta funcionalidad:
        </p>
        <ul>
          <li>Es de uso estrictamente <strong>voluntario</strong>.</li>
          <li>Procesa la imagen únicamente para la búsqueda solicitada, sin almacenar el rostro.</li>
          <li>Utiliza Amazon Web Services (AWS Rekognition) bajo sus condiciones de privacidad.</li>
        </ul>
        <p>
          Al usar esta función, consentís expresamente el procesamiento temporal de tu imagen para la
          búsqueda. Consultá nuestra{" "}
          <Link href="/privacidad" className="underline underline-offset-4">
            Política de Privacidad
          </Link>{" "}
          para más detalle.
        </p>
      </LegalSection>

      <LegalSection index="08" title="Conducta del usuario">
        <p>El usuario se compromete a no utilizar el Servicio para:</p>
        <ul>
          <li>Actividades ilegales o contrarias a la moral y las buenas costumbres.</li>
          <li>Intentar acceder sin autorización a sistemas, datos o cuentas ajenas.</li>
          <li>Distribuir malware, spam u otro contenido dañino.</li>
          <li>Vulnerar derechos de terceros, incluyendo derechos de imagen y privacidad.</li>
        </ul>
      </LegalSection>

      <LegalSection index="09" title="Limitación de responsabilidad">
        <p>
          La Estudio no será responsable por daños indirectos, incidentales, especiales o consecuentes
          derivados del uso o imposibilidad de uso del Servicio, incluidos pérdida de datos o lucro
          cesante.
        </p>
        <p>
          Las fotografías se entregan en el estado en que fueron capturadas. No se garantiza que todas
          las fotografías de un evento estarán disponibles, ni que el usuario aparezca en alguna.
        </p>
      </LegalSection>

      <LegalSection index="10" title="Modificaciones del servicio y las condiciones">
        <p>
          La Estudio se reserva el derecho de modificar, suspender o discontinuar el Servicio en
          cualquier momento, con o sin previo aviso. También podrá actualizar estas Condiciones
          periódicamente. El uso continuado tras la publicación de cambios implica aceptación.
        </p>
      </LegalSection>

      <LegalSection index="11" title="Ley aplicable y jurisdicción">
        <p>
          Las presentes Condiciones se rigen por las leyes de la <strong>República Argentina</strong>.
          Cualquier controversia será sometida a la jurisdicción de los Tribunales Ordinarios de la
          Ciudad Autónoma de Buenos Aires, con renuncia expresa a cualquier otro fuero que pudiera
          corresponder.
        </p>
        <p>
          Son de aplicación, entre otras, la <strong>Ley 24.240</strong>, la{" "}
          <strong>Ley 25.326</strong> y la <strong>Ley 11.723</strong>.
        </p>
      </LegalSection>

      <LegalSection index="12" title="Contacto">
        <p>
          Para consultas relacionadas con estas Condiciones:{" "}
          <a href="mailto:hola@ivanamaritano.com.ar">hola@ivanamaritano.com.ar</a>
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
