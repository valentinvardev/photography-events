/**
 * Core processing functions called directly from the server (bulkAdd mutation).
 * No HTTP, no auth — pure server-side logic.
 */

import sharp from "sharp";
import {
  DetectTextCommand,
  IndexFacesCommand,
  type Image as RekImage,
} from "@aws-sdk/client-rekognition";
import { db } from "~/server/db";
import { getAdminClient } from "~/lib/supabase/admin";
import { WATERMARK_KEY } from "~/lib/watermark";
import {
  getS3ObjectBytes,
  putS3Object,
  deleteS3Objects,
  isS3Key,
  s3Key,
  S3_BUCKET,
} from "~/lib/s3";
import {
  getRekognitionClient,
  rekSend,
  ensureRekognitionCollection,
  deleteIndexedFaces,
} from "~/lib/rekognition";

// ── Storage backend helpers ───────────────────────────────────────────────────

async function downloadBytes(storageKey: string): Promise<Uint8Array | null> {
  if (isS3Key(storageKey)) {
    try {
      return await getS3ObjectBytes(storageKey);
    } catch (err) {
      console.error("[storage] S3 download failed:", storageKey, err);
      return null;
    }
  }
  const supabase = getAdminClient();
  if (!supabase) return null;
  const { data, error } = await supabase.storage.from("photos").download(storageKey);
  if (error ?? !data) return null;
  return new Uint8Array(await data.arrayBuffer());
}

// ── Rekognition ───────────────────────────────────────────────────────────────

const rekognition = getRekognitionClient();

/**
 * How we hand an image to Rekognition.
 *
 * S3Object whenever possible: it skips downloading the original to this box
 * only to upload it straight back to AWS (paying S3 egress for nothing), and it
 * raises the size limit from 5 MB to 15 MB. With `Bytes`, every original over
 * 5 MB threw ImageTooLargeException into a swallowed catch and silently never
 * got indexed. Legacy Supabase keys still have to go through bytes.
 *
 * Requires the bucket to live in REK_REGION — both come from AWS_REGION, which
 * is now resolved in one place precisely so they can't drift apart.
 */
async function buildRekognitionImage(storageKey: string): Promise<RekImage | null> {
  if (isS3Key(storageKey)) {
    return { S3Object: { Bucket: S3_BUCKET, Name: storageKey } };
  }
  const bytes = await downloadBytes(storageKey);
  return bytes ? { Bytes: bytes } : null;
}

// ── OCR ───────────────────────────────────────────────────────────────────────

function extractAllBibs(
  detections: Array<{ DetectedText?: string; Type?: string; Confidence?: number }>,
): string[] {
  const candidates: { value: string; score: number }[] = [];

  for (const d of detections) {
    if (d.Type !== "LINE") continue;
    const text = (d.DetectedText ?? "").trim();
    const confidence = d.Confidence ?? 0;
    if (confidence < 50) continue;

    const matches = text.match(/\b\d{2,5}\b/g) ?? [];
    for (const m of matches) {
      if (/^\d{1,2}:\d{2}/.test(text)) continue;
      if (text.includes("%")) continue;
      if (/^\d+\s*km$/i.test(text)) continue;
      if (parseInt(m) > 99999) continue;

      const len = m.length;
      const lenScore = len === 3 ? 4 : len === 4 ? 5 : len === 2 ? 3 : len === 5 ? 2 : 1;
      const isolatedBonus = text === m ? 3 : 0;
      const confBonus = confidence / 50;
      candidates.push({ value: m, score: lenScore + isolatedBonus + confBonus });
    }
  }

  if (candidates.length === 0) return [];

  const best = new Map<string, number>();
  for (const c of candidates) {
    if (!best.has(c.value) || best.get(c.value)! < c.score) best.set(c.value, c.score);
  }

  return Array.from(best.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([v]) => v);
}

export async function runOcr(photoId: string): Promise<{ bib: string | null }> {
  const photo = await db.photo.findUnique({
    where: { id: photoId },
    select: { id: true, storageKey: true, bibNumber: true },
  });
  if (!photo) return { bib: null };
  if (photo.bibNumber !== null) return { bib: photo.bibNumber };

  const image = await buildRekognitionImage(photo.storageKey);
  if (!image) { console.error("[OCR] Image unavailable:", photo.storageKey); return { bib: null }; }

  try {
    const response = await rekSend(
      { op: "DetectText", imageKey: photo.storageKey },
      () => rekognition.send(new DetectTextCommand({ Image: image })),
    );
    const bibs = extractAllBibs(response.TextDetections ?? []);

    console.log(`[OCR] photoId=${photoId} bibs=${bibs.join(",") || "none"}`);

    if (bibs.length > 0) {
      const bibString = bibs.join(",");
      await db.photo.update({ where: { id: photoId }, data: { bibNumber: bibString } });
      return { bib: bibString };
    }
    return { bib: null };
  } catch (err) {
    console.error(`[OCR] Rekognition error for photoId=${photoId}:`, err);
    return { bib: null };
  }
}

// ── Watermark ─────────────────────────────────────────────────────────────────

// Cache the raw watermark PNG in memory for 10 minutes to avoid re-downloading
// from S3 on every photo processed.
let wmCache: { buf: Buffer; expiresAt: number } | null = null;

async function getWatermarkBytes(): Promise<Buffer | null> {
  const now = Date.now();
  if (wmCache && now < wmCache.expiresAt) return wmCache.buf;
  try {
    const bytes = await getS3ObjectBytes(WATERMARK_KEY);
    const buf = Buffer.from(bytes);
    wmCache = { buf, expiresAt: now + 10 * 60 * 1000 };
    return buf;
  } catch {
    return null;
  }
}

async function buildWatermarkComposite(
  imageWidth: number,
  imageHeight: number,
): Promise<{ input: Buffer; tile: boolean; blend: "over" }> {
  const wmPng = await getWatermarkBytes();

  if (wmPng) {
    const meta = await sharp(wmPng).metadata();
    const wmW = meta.width ?? 300;
    const wmH = meta.height ?? 100;
    const targetW = Math.round(Math.min(imageWidth, imageHeight) * 0.40);
    const targetH = Math.round((wmH / wmW) * targetW);

    const scaled = await sharp(wmPng)
      .resize(targetW, targetH, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .rotate(-35, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    return { input: scaled, tile: true, blend: "over" };
  }

  const tileSize = 220;
  const half = tileSize / 2;
  const fallback = Buffer.from(
    `<svg width="${tileSize}" height="${tileSize}" xmlns="http://www.w3.org/2000/svg">
      <text x="${half}" y="${half}" text-anchor="middle" dominant-baseline="middle"
        font-family="Arial, sans-serif" font-size="22" font-weight="bold" letter-spacing="3"
        fill="rgba(255,255,255,0.38)"
        transform="rotate(-35, ${half}, ${half})">PREVIEW</text>
    </svg>`,
  );
  return { input: fallback, tile: true, blend: "over" };
}

export async function runWatermark(photoId: string): Promise<{ previewKey: string | null }> {
  const photo = await db.photo.findUnique({ where: { id: photoId } });
  if (!photo) return { previewKey: null };

  const bytes = await downloadBytes(photo.storageKey);
  if (!bytes) { console.error("[Watermark] Download failed:", photo.storageKey); return { previewKey: null }; }

  const buffer = Buffer.from(bytes);
  const meta = await sharp(buffer).metadata();
  const origW = meta.width ?? 1200;
  const origH = meta.height ?? 800;

  // Cap preview size to keep S3 egress low.
  const MAX_DIM = 1600;
  const scale = Math.min(1, MAX_DIM / Math.max(origW, origH));
  const w = Math.round(origW * scale);
  const h = Math.round(origH * scale);

  try {
    const composite = await buildWatermarkComposite(w, h);
    const watermarked = await sharp(buffer)
      .resize({ width: MAX_DIM, height: MAX_DIM, fit: "inside", withoutEnlargement: true })
      .composite([composite])
      .jpeg({ quality: 72, mozjpeg: true })
      .toBuffer();

    // Delete previous preview from the correct backend
    if (photo.previewKey) {
      if (isS3Key(photo.previewKey)) {
        await deleteS3Objects([photo.previewKey]).catch(() => null);
      } else {
        const supabase = getAdminClient();
        if (supabase) {
          await supabase.storage.from("photos").remove([photo.previewKey]).catch(() => null);
        }
      }
    }

    const previewKey = s3Key(`previews/${photo.id}.jpg`);
    await putS3Object(previewKey, watermarked, "image/jpeg");

    await db.photo.update({ where: { id: photoId }, data: { previewKey } });
    console.log(`[Watermark] photoId=${photoId} done`);
    return { previewKey };
  } catch (err) {
    console.error(`[Watermark] Error for photoId=${photoId}:`, err);
    return { previewKey: null };
  }
}

// ── Face index ────────────────────────────────────────────────────────────────

/**
 * Indexes the faces in a photo.
 *
 * Idempotent by default: IndexFaces mints brand-new FaceIds on every run, so
 * calling it twice doesn't refresh anything — it pays for the call again and
 * doubles the stored faces, which are billed monthly forever. Pass `force` to
 * genuinely re-index; the previous faces are deleted first so nothing leaks.
 */
export async function runFaceIndex(
  photoId: string,
  collectionId: string,
  opts: { force?: boolean } = {},
): Promise<{ indexed: number; skipped: boolean }> {
  const photo = await db.photo.findUnique({
    where: { id: photoId },
    select: { id: true, storageKey: true },
  });
  if (!photo) return { indexed: 0, skipped: true };

  const existing = await db.faceRecord.findMany({
    where: { photoId },
    select: { rekFaceId: true, collectionId: true },
  });

  if (existing.length > 0) {
    if (!opts.force) return { indexed: existing.length, skipped: true };
    await deleteIndexedFaces(existing);
    await db.faceRecord.deleteMany({ where: { photoId } });
  }

  const image = await buildRekognitionImage(photo.storageKey);
  if (!image) { console.error("[FaceIndex] Image unavailable:", photo.storageKey); return { indexed: 0, skipped: true }; }

  try {
    const rekCollection = await ensureRekognitionCollection(collectionId);
    const result = await rekSend(
      { op: "IndexFaces", imageKey: photo.storageKey, collectionId: rekCollection },
      () => rekognition.send(new IndexFacesCommand({
        CollectionId: rekCollection,
        Image: image,
        ExternalImageId: photoId,
        DetectionAttributes: [],
        MaxFaces: 10,
      })),
    );

    const indexed = result.FaceRecords ?? [];
    console.log(`[FaceIndex] photoId=${photoId} indexed ${indexed.length} faces`);

    for (const fr of indexed) {
      const faceId = fr.Face?.FaceId;
      if (!faceId) continue;
      await db.faceRecord.upsert({
        where: { rekFaceId: faceId },
        update: { photoId, collectionId, confidence: fr.Face?.Confidence ?? null },
        create: { rekFaceId: faceId, photoId, collectionId, confidence: fr.Face?.Confidence ?? null },
      });
    }
    return { indexed: indexed.length, skipped: false };
  } catch (err) {
    console.error(`[FaceIndex] Error for photoId=${photoId}:`, err);
    return { indexed: 0, skipped: false };
  }
}
