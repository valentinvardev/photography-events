import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { createSignedUrl } from "~/lib/supabase/admin";
import { createS3AttachmentUrl, isS3Key } from "~/lib/s3";

/**
 * Download of a purchased original.
 *
 * Validates the token and that the photo belongs to the purchase, then
 * REDIRECTS to a presigned S3 URL that already carries
 * Content-Disposition: attachment. This endpoint used to pull the file from
 * S3 into the VPS and stream it back out: measured in production, 6.4 s to
 * first byte and ~14 KB/s, against ~1 MB/s straight from S3. A 2 MB photo
 * took minutes and the download button looked dead.
 *
 * Two ways in:
 * - page navigation (phones, direct links): failures redirect back to the
 *   download page with ?error=, instead of leaving the buyer on raw JSON;
 * - `frame=1`, a hidden iframe (desktop): failures answer a tiny page that
 *   tells the parent via postMessage, since nothing in the frame is visible.
 */

// Used immediately by the redirect; short on purpose.
const LINK_TTL_S = 300;

type DownloadError = "link" | "foto" | "archivo";

function parsePhotoIds(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

const NO_STORE = { "Cache-Control": "private, no-store" };

// Relative Location on purpose: behind Cloudflare Flexible SSL the origin sees
// plain http, so an absolute URL built from request.url would downgrade to http.
function redirectTo(path: string) {
  return new NextResponse(null, { status: 303, headers: { Location: path, ...NO_STORE } });
}

// Only the fixed error code goes into the page — nothing from the request.
// Echoing a query value into a <script> would be an XSS ("</script>" ends it).
function frameError(code: DownloadError) {
  const html = `<!doctype html><script>parent.postMessage({type:"download-error",code:"${code}"},location.origin)</script>`;
  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", ...NO_STORE },
  });
}

// Content-Disposition's ASCII fallback: storage-js percent-encodes the
// download name and then encodeURI's the whole URL again, so any non-ASCII
// character would reach the buyer double-encoded.
const asciiName = (name: string) =>
  name.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\x20-\x7e]/g, "_");

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const token = searchParams.get("token");
  const photoId = searchParams.get("photoId");
  const inFrame = searchParams.get("frame") === "1";

  const fail = (error: DownloadError) =>
    inFrame
      ? frameError(error)
      : redirectTo(token ? `/descarga/${encodeURIComponent(token)}?error=${error}` : "/");

  if (!token) return fail("link");
  if (!photoId) return fail("archivo");

  // In parallel: from the VPS each round trip to the pooler costs ~1.2 s, and
  // the photo lookup doesn't depend on the purchase. Nothing about the photo
  // is returned until the purchase authorizes it.
  const [purchase, photo] = await Promise.all([
    db.purchase.findUnique({
      where: { downloadToken: token },
      select: { status: true, photoIds: true, collectionId: true },
    }),
    db.photo.findUnique({
      where: { id: photoId },
      select: { storageKey: true, filename: true, mimeType: true, collectionId: true },
    }),
  ]);
  if (!purchase || purchase.status !== "APPROVED") return fail("link");

  // Fail closed: a purchase with no recorded photoIds grants nothing (the old
  // legacy branch authorized any photo in the collection), and the photo must
  // also sit in the purchase's own collection — purchases stored whatever ids
  // the client sent, so the list alone isn't proof.
  if (!parsePhotoIds(purchase.photoIds).includes(photoId)) return fail("foto");
  if (!photo || photo.collectionId !== purchase.collectionId) return fail("foto");

  const url = isS3Key(photo.storageKey)
    ? await createS3AttachmentUrl(photo.storageKey, photo.filename, photo.mimeType ?? "image/jpeg", LINK_TTL_S)
    : await createSignedUrl(photo.storageKey, LINK_TTL_S, { download: asciiName(photo.filename) });
  // createSignedUrl hands http(s) keys back untouched: those would open inline
  // with no attachment, so they don't count as a download link.
  if (!url || url === photo.storageKey) return fail("archivo");

  return new NextResponse(null, {
    status: 302,
    // no-store: the presigned URL dies in minutes, a cached redirect would too.
    headers: { Location: url, ...NO_STORE },
  });
}
