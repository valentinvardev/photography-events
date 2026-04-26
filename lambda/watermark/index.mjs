import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";
import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import pg from "pg";

const { Client } = pg;

const s3 = new S3Client({ region: process.env.BUCKET_REGION });
const BUCKET = process.env.BUCKET_NAME;
const S3_PREFIX = process.env.BUCKET_PREFIX
  ? process.env.AWS_S3_PREFIX.replace(/\/?$/, "/")
  : "";
const WATERMARK_KEY = "watermarks/active.png";

// Reused across warm invocations
let wmCache = null;
let wmCacheExpiry = 0;

async function getWatermarkBytes() {
  const now = Date.now();
  if (wmCache && now < wmCacheExpiry) return wmCache;
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data, error } = await supabase.storage.from("photos").download(WATERMARK_KEY);
  if (error || !data) return null;
  wmCache = Buffer.from(await data.arrayBuffer());
  wmCacheExpiry = now + 10 * 60 * 1000;
  return wmCache;
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
  const w = meta.width ?? 1200;
  const h = meta.height ?? 800;

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
    .composite([composite])
    .jpeg({ quality: 78 })
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

  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  await db.query('UPDATE "Photo" SET "previewKey" = $1 WHERE id = $2', [previewKey, photoId]);
  await db.end();

  console.log(`[Lambda] photoId=${photoId} done → ${previewKey}`);
  return { previewKey };
}
