/**
 * Core processing functions called directly from the server (bulkAdd mutation).
 * No HTTP, no auth — pure server-side logic.
 */

import sharp from "sharp";
import {
  RekognitionClient,
  DetectTextCommand,
  CreateCollectionCommand,
  IndexFacesCommand,
} from "@aws-sdk/client-rekognition";
import { db } from "~/server/db";
import { getAdminClient } from "~/lib/supabase/admin";
import { WATERMARK_KEY } from "~/lib/watermark";
import { getS3ObjectBytes, putS3Object, deleteS3Objects, isS3Key, s3Key } from "~/lib/s3";

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

// ── Rekognition client (shared) ───────────────────────────────────────────────

const rekognition = new RekognitionClient({
  region: process.env.AWS_REGION ?? "sa-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

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

  const imageBytes = await downloadBytes(photo.storageKey);
  if (!imageBytes) { console.error("[OCR] Download failed:", photo.storageKey); return { bib: null }; }

  try {
    const response = await rekognition.send(new DetectTextCommand({ Image: { Bytes: imageBytes } }));
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

async function buildWatermarkComposite(
  client: NonNullable<ReturnType<typeof getAdminClient>>,
  imageWidth: number,
  imageHeight: number,
): Promise<{ input: Buffer; tile: boolean; blend: "over" }> {
  const { data: wmData, error: wmError } = await client.storage.from("photos").download(WATERMARK_KEY);
  const wmPng = (!wmError && wmData) ? Buffer.from(await wmData.arrayBuffer()) : null;

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

  const useS3 = isS3Key(photo.storageKey);
  const bytes = await downloadBytes(photo.storageKey);
  if (!bytes) { console.error("[Watermark] Download failed:", photo.storageKey); return { previewKey: null }; }

  const buffer = Buffer.from(bytes);
  const meta = await sharp(buffer).metadata();
  const w = meta.width ?? 1200;
  const h = meta.height ?? 800;

  try {
    // Watermark is always read from Supabase (WATERMARK_KEY) for now
    const supabase = getAdminClient();
    const composite = supabase
      ? await buildWatermarkComposite(supabase, w, h)
      : await buildFallbackComposite();
    const watermarked = await sharp(buffer).composite([composite]).jpeg({ quality: 78 }).toBuffer();

    // Delete previous preview from the correct backend
    if (photo.previewKey) {
      if (isS3Key(photo.previewKey)) {
        await deleteS3Objects([photo.previewKey]);
      } else if (supabase) {
        await supabase.storage.from("photos").remove([photo.previewKey]);
      }
    }

    const previewKey = s3Key(`previews/${photo.id}.jpg`);

    if (useS3) {
      await putS3Object(previewKey, watermarked, "image/jpeg");
    } else {
      if (!supabase) { console.error("[Watermark] Supabase not available for preview upload"); return { previewKey: null }; }
      const { error: upError } = await supabase.storage
        .from("photos")
        .upload(previewKey, watermarked, { contentType: "image/jpeg", upsert: true });
      if (upError) { console.error("[Watermark] Upload failed:", upError); return { previewKey: null }; }
    }

    await db.photo.update({ where: { id: photoId }, data: { previewKey } });
    console.log(`[Watermark] photoId=${photoId} done (${useS3 ? "s3" : "supabase"})`);
    return { previewKey };
  } catch (err) {
    console.error(`[Watermark] Error for photoId=${photoId}:`, err);
    return { previewKey: null };
  }
}

function buildFallbackComposite(): { input: Buffer; tile: boolean; blend: "over" } {
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

// ── Face index ────────────────────────────────────────────────────────────────

function rekognitionCollectionId(collectionId: string) {
  return `foto-${collectionId.replace(/[^a-zA-Z0-9_.\-]/g, "-")}`;
}

async function ensureRekognitionCollection(collId: string) {
  try {
    await rekognition.send(new CreateCollectionCommand({ CollectionId: collId }));
  } catch (err: unknown) {
    if ((err as { name?: string }).name !== "ResourceAlreadyExistsException") throw err;
  }
}

export async function runFaceIndex(photoId: string, collectionId: string): Promise<void> {
  const photo = await db.photo.findUnique({
    where: { id: photoId },
    select: { id: true, storageKey: true },
  });
  if (!photo) return;

  const imageBytes = await downloadBytes(photo.storageKey);
  if (!imageBytes) { console.error("[FaceIndex] Download failed:", photo.storageKey); return; }

  const rekCollectionId = rekognitionCollectionId(collectionId);

  try {
    await ensureRekognitionCollection(rekCollectionId);
    const result = await rekognition.send(new IndexFacesCommand({
      CollectionId: rekCollectionId,
      Image: { Bytes: imageBytes },
      ExternalImageId: photoId,
      DetectionAttributes: [],
      MaxFaces: 10,
    }));

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
  } catch (err) {
    console.error(`[FaceIndex] Error for photoId=${photoId}:`, err);
  }
}
