import sharp from "sharp";
import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import pg from "pg";

const { Pool } = pg;

const s3 = new S3Client({ region: process.env.BUCKET_REGION });
const BUCKET = process.env.BUCKET_NAME;
const S3_PREFIX = process.env.BUCKET_PREFIX
  ? process.env.BUCKET_PREFIX.replace(/\/?$/, "/")
  : "";
const WATERMARK_KEY = `${S3_PREFIX}watermarks/active.png`;

// Reused across warm invocations
let wmCache = null;
let wmCacheExpiry = 0;

// Module-level pg pool — reused across warm invocations.
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
  idleTimeoutMillis: 5_000,
  connectionTimeoutMillis: 5_000,
});
pgPool.on("error", (err) => console.error("[pg pool error]", err));

async function getWatermarkBytes() {
  const now = Date.now();
  if (wmCache && now < wmCacheExpiry) return wmCache;
  try {
    wmCache = await getS3Bytes(WATERMARK_KEY);
    wmCacheExpiry = now + 10 * 60 * 1000;
    return wmCache;
  } catch {
    return null;
  }
}

async function getS3Bytes(key) {
  const chunks = [];
  const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  for await (const chunk of res.Body) chunks.push(chunk);
  return Buffer.concat(chunks);
}

export async function handler(event) {
  const { photoId, storageKey, existingPreviewKey } = event;

  const photoBytes = await getS3Bytes(storageKey);
  const meta = await sharp(photoBytes).metadata();
  const origW = meta.width ?? 1200;
  const origH = meta.height ?? 800;

  // Cap preview size to keep S3 egress and Lambda memory low.
  const MAX_DIM = 1600;
  const scale = Math.min(1, MAX_DIM / Math.max(origW, origH));
  const w = Math.round(origW * scale);
  const h = Math.round(origH * scale);

  const wmPng = await getWatermarkBytes();
  let composite;

  if (wmPng) {
    const wmMeta = await sharp(wmPng).metadata();
    const wmW = wmMeta.width ?? 300;
    const wmH = wmMeta.height ?? 100;
    const targetW = Math.round(Math.min(w, h) * 0.40);
    const targetH = Math.round((wmH / wmW) * targetW);
    const scaled = await sharp(wmPng)
      .resize(targetW, targetH, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .rotate(-35, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    composite = { input: scaled, tile: true, blend: "over" };
  } else {
    const tileSize = 220;
    const half = tileSize / 2;
    composite = {
      input: Buffer.from(
        `<svg width="${tileSize}" height="${tileSize}" xmlns="http://www.w3.org/2000/svg">
          <text x="${half}" y="${half}" text-anchor="middle" dominant-baseline="middle"
            font-family="Arial, sans-serif" font-size="22" font-weight="bold" letter-spacing="3"
            fill="rgba(255,255,255,0.38)"
            transform="rotate(-35, ${half}, ${half})">PREVIEW</text>
        </svg>`
      ),
      tile: true,
      blend: "over",
    };
  }

  const watermarked = await sharp(photoBytes)
    .resize({ width: MAX_DIM, height: MAX_DIM, fit: "inside", withoutEnlargement: true })
    .composite([composite])
    .jpeg({ quality: 72, mozjpeg: true })
    .toBuffer();

  if (existingPreviewKey) {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: existingPreviewKey })).catch(() => null);
  }

  const previewKey = `${S3_PREFIX}previews/${photoId}.jpg`;
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: previewKey,
    Body: watermarked,
    ContentType: "image/jpeg",
  }));

  await pgPool.query('UPDATE "Photo" SET "previewKey" = $1 WHERE id = $2', [previewKey, photoId]);

  console.log(`[Lambda] photoId=${photoId} done → ${previewKey}`);
  return { previewKey };
}
