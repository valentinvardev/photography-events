// Migra covers/banners/logos desde Supabase Storage a S3.
// Lee de la DB todas las colecciones y categorías cuyas keys NO sean de S3,
// las baja de Supabase, las sube a S3 con el prefix configurado, y updatea la DB.
//
// Uso:  node scripts/migrate-supabase-to-s3.mjs           (dry-run)
//       node scripts/migrate-supabase-to-s3.mjs --apply   (ejecuta cambios)

import { PrismaClient } from "../generated/prisma/index.js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
for (const line of readFileSync(resolve(__dirname, "../.env"), "utf8").split(/\r?\n/)) {
  const m = /^([A-Z_]+)=(.*)$/.exec(line);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}

const APPLY = process.argv.includes("--apply");
const BUCKET = process.env.AWS_S3_BUCKET ?? "mediaseller-photos";
const PREFIX = process.env.AWS_S3_PREFIX
  ? process.env.AWS_S3_PREFIX.replace(/\/?$/, "/")
  : "";

const s3 = new S3Client({
  region: process.env.AWS_REGION ?? "us-east-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const db = new PrismaClient({
  datasourceUrl: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
});

function isS3Key(key) {
  if (!key) return false;
  if (PREFIX && key.startsWith(PREFIX)) return true;
  return key.startsWith("uploads/") || key.startsWith("previews/");
}

function extToContentType(filename) {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "avif") return "image/avif";
  if (ext === "gif") return "image/gif";
  return "application/octet-stream";
}

async function migrateOne(supabaseKey) {
  if (!supabaseKey || isS3Key(supabaseKey) || supabaseKey.startsWith("http")) {
    return { skipped: true, newKey: supabaseKey };
  }

  // Download from Supabase
  const { data, error } = await supabase.storage.from("photos").download(supabaseKey);
  if (error || !data) {
    return { error: `download failed: ${error?.message ?? "no data"}` };
  }
  const bytes = Buffer.from(await data.arrayBuffer());
  const contentType = data.type || extToContentType(supabaseKey);

  const newKey = `${PREFIX}${supabaseKey}`;

  if (!APPLY) {
    return { migrated: false, newKey, size: bytes.length, dryRun: true };
  }

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: newKey,
      Body: bytes,
      ContentType: contentType,
    }),
  );

  return { migrated: true, newKey, size: bytes.length };
}

async function processCollection(col) {
  const updates = {};
  const log = [];

  for (const field of ["coverUrl", "bannerUrl", "logoUrl"]) {
    const oldKey = col[field];
    if (!oldKey) continue;

    const result = await migrateOne(oldKey);
    if (result.skipped) {
      log.push(`  ${field}: ya en S3 / http — skip`);
      continue;
    }
    if (result.error) {
      log.push(`  ${field}: ERROR — ${result.error}`);
      continue;
    }
    updates[field] = result.newKey;
    log.push(
      `  ${field}: ${oldKey} → ${result.newKey} (${(result.size / 1024).toFixed(1)} kB)${result.dryRun ? " [dry-run]" : ""}`,
    );
  }

  if (Object.keys(updates).length === 0) return { changed: false, log };

  if (APPLY) {
    await db.collection.update({ where: { id: col.id }, data: updates });
  }
  return { changed: true, log };
}

async function processCategory(cat) {
  const oldKey = cat.coverUrl;
  if (!oldKey) return { changed: false, log: [] };

  const result = await migrateOne(oldKey);
  if (result.skipped) return { changed: false, log: [`  coverUrl: ya en S3 / http — skip`] };
  if (result.error) return { changed: false, log: [`  coverUrl: ERROR — ${result.error}`] };

  const log = [
    `  coverUrl: ${oldKey} → ${result.newKey} (${(result.size / 1024).toFixed(1)} kB)${result.dryRun ? " [dry-run]" : ""}`,
  ];

  if (APPLY) {
    await db.category.update({ where: { id: cat.id }, data: { coverUrl: result.newKey } });
  }
  return { changed: true, log };
}

console.log(`\n=== Migración Supabase → S3 ${APPLY ? "(APPLY)" : "(DRY-RUN)"} ===`);
console.log(`Bucket: ${BUCKET}`);
console.log(`Prefix: ${PREFIX || "(ninguno)"}`);
console.log("");

const collections = await db.collection.findMany({
  select: { id: true, title: true, coverUrl: true, bannerUrl: true, logoUrl: true },
});
const categories = await db.category.findMany({
  select: { id: true, name: true, coverUrl: true },
});

let totalChanged = 0;

console.log(`▸ ${collections.length} colecciones`);
for (const col of collections) {
  const { changed, log } = await processCollection(col);
  if (log.length === 0) continue;
  console.log(`\n[col] ${col.title}`);
  for (const line of log) console.log(line);
  if (changed) totalChanged++;
}

console.log(`\n▸ ${categories.length} categorías`);
for (const cat of categories) {
  const { changed, log } = await processCategory(cat);
  if (log.length === 0) continue;
  console.log(`\n[cat] ${cat.name}`);
  for (const line of log) console.log(line);
  if (changed) totalChanged++;
}

console.log(`\n=== Listo. ${totalChanged} registro(s) ${APPLY ? "actualizados" : "a actualizar"}. ===`);
if (!APPLY) console.log(`Si los resultados se ven bien, correr:  node scripts/migrate-supabase-to-s3.mjs --apply`);

await db.$disconnect();
