import { Resend } from "resend";
import { env } from "~/env";

const getResend = () => {
  if (!env.RESEND_API_KEY) return null;
  return new Resend(env.RESEND_API_KEY);
};

const FROM = env.RESEND_FROM_EMAIL ?? "Ivana Maritano <noreply@ivanamaritano.com>";
const BASE_URL = env.NEXT_PUBLIC_BASE_URL ?? "https://ivanamaritano.com";
const BCC_EMAIL = "valentinvarela0508@gmail.com";

function purchaseApprovedHtml({
  buyerName,
  bibNumber,
  collectionTitle,
  downloadUrl,
  photoCount,
}: {
  buyerName: string | null;
  bibNumber: string | null;
  collectionTitle: string;
  downloadUrl: string;
  photoCount?: number;
}) {
  const name = buyerName ?? "corredor";
  const bib = bibNumber ? `#${bibNumber}` : "";
  const photoText = photoCount
    ? `${photoCount} foto${photoCount !== 1 ? "s" : ""} tuya${photoCount !== 1 ? "s" : ""}`
    : "tus fotos";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tus fotos están listas — Ivana Maritano</title>
</head>
<body style="margin:0;padding:0;background:#f5f2ec;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f2ec;padding:48px 24px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <p style="margin:0;font-size:22px;font-style:italic;font-weight:300;color:#0a0a0a;letter-spacing:-0.03em;line-height:1;">
                Ivana Maritano
              </p>
              <p style="margin:4px 0 0;font-family:monospace;font-size:9px;letter-spacing:0.22em;text-transform:uppercase;color:#888;">
                Fotografía de carrera
              </p>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border:1px solid #e5e0d8;padding:40px 40px 36px;">

              <p style="margin:0 0 4px;font-family:monospace;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#888;text-align:center;">
                ${collectionTitle}${bib ? ` · Dorsal ${bib}` : ""}
              </p>
              <p style="margin:0 0 32px;color:#0a0a0a;font-size:26px;font-style:italic;font-weight:300;text-align:center;line-height:1.1;letter-spacing:-0.02em;">
                Tus fotos<br />están listas.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr><td style="border-top:1px solid #e5e0d8;"></td></tr>
              </table>

              <p style="margin:0 0 12px;color:#0a0a0a;font-size:15px;line-height:1.7;">
                Hola, <strong>${name}</strong>
              </p>
              <p style="margin:0 0 32px;color:#444;font-size:15px;line-height:1.7;">
                Capturamos ${photoText} y ya las tenés disponibles en alta resolución, sin marca de agua y listas para descargar.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td align="center">
                    <a href="${downloadUrl}" style="display:inline-block;padding:14px 40px;background:#0a0a0a;color:#f5f2ec;font-family:monospace;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;text-decoration:none;">
                      Ver mis fotos
                    </a>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr><td style="border-top:1px solid #e5e0d8;"></td></tr>
              </table>

              <p style="margin:0;color:#999;font-size:13px;line-height:1.6;text-align:center;">
                El link no expira. ¿Alguna duda? Respondé este email y te ayudamos.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 0 0;text-align:center;">
              <p style="margin:0 0 4px;color:#aaa;font-family:monospace;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;">
                © ${new Date().getFullYear()} Ivana Maritano
              </p>
              <a href="${BASE_URL}" style="color:#aaa;font-family:monospace;font-size:10px;letter-spacing:0.1em;text-decoration:none;">${BASE_URL.replace("https://", "")}</a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendPurchaseApprovedEmail({
  to,
  buyerName,
  bibNumber,
  collectionTitle,
  downloadToken,
  photoCount,
}: {
  to: string;
  buyerName: string | null;
  bibNumber: string | null;
  collectionTitle: string;
  downloadToken: string;
  photoCount?: number;
}) {
  const resend = getResend();
  if (!resend) return;

  const downloadUrl = `${BASE_URL}/descarga/${downloadToken}`;
  const bib = bibNumber ? `dorsal #${bibNumber}` : collectionTitle;

  try {
    await resend.emails.send({
      from: FROM,
      to,
      bcc: BCC_EMAIL,
      subject: `Tus fotos de ${bib} están listas — Ivana Maritano`,
      html: purchaseApprovedHtml({ buyerName, bibNumber, collectionTitle, downloadUrl, photoCount }),
    });
  } catch (err) {
    console.error("[Resend] Error sending email:", err);
  }
}
