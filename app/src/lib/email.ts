import { Resend } from "resend";
import { env } from "~/env";

const getResend = () => {
  if (!env.RESEND_API_KEY) return null;
  return new Resend(env.RESEND_API_KEY);
};

const FROM = env.RESEND_FROM_EMAIL ?? "ALTAFOTO <noreply@altafoto.com.ar>";
const BASE_URL = env.NEXT_PUBLIC_BASE_URL ?? "https://altafoto.com.ar";
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
  <title>Tus fotos están listas — ALTAFOTO</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:48px 24px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <img src="${BASE_URL}/logo.png" alt="ALTAFOTO" height="36" style="height:36px;width:auto;display:block;" />
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:16px;padding:40px 40px 36px;">

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:28px;">
                    <div style="display:inline-block;width:64px;height:64px;background:#eff6ff;border-radius:16px;text-align:center;line-height:64px;font-size:30px;">
                      📷
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 6px;color:#111827;font-size:22px;font-weight:800;text-align:center;line-height:1.3;">
                ¡Tus fotos están listas!
              </p>
              <p style="margin:0 0 28px;color:#6b7280;font-size:14px;text-align:center;line-height:1.6;">
                ${collectionTitle}${bib ? ` &middot; Dorsal ${bib}` : ""}
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr><td style="border-top:1px solid #f1f5f9;"></td></tr>
              </table>

              <p style="margin:0 0 8px;color:#111827;font-size:15px;line-height:1.7;">
                Hola, <strong>${name}</strong> 👋
              </p>
              <p style="margin:0 0 28px;color:#374151;font-size:15px;line-height:1.7;">
                Capturamos ${photoText} y ya las tenés disponibles en alta resolución, sin marca de agua y listas para descargar.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="${downloadUrl}" style="display:inline-block;padding:14px 36px;background:#0057A8;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;">
                      Ver mis fotos →
                    </a>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr><td style="border-top:1px solid #f1f5f9;"></td></tr>
              </table>

              <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.6;text-align:center;">
                El link no expira. ¿Alguna duda? Respondé este email y te ayudamos.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 0 0;text-align:center;">
              <p style="margin:0 0 4px;color:#9ca3af;font-size:12px;">
                © ${new Date().getFullYear()} ALTAFOTO · Fotografía deportiva en Argentina
              </p>
              <a href="${BASE_URL}" style="color:#9ca3af;font-size:12px;text-decoration:none;">${BASE_URL.replace("https://", "")}</a>
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
      subject: `Tus fotos de ${bib} están listas — ALTAFOTO`,
      html: purchaseApprovedHtml({ buyerName, bibNumber, collectionTitle, downloadUrl, photoCount }),
    });
  } catch (err) {
    console.error("[Resend] Error sending email:", err);
  }
}
