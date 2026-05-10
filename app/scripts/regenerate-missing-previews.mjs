// Regenera previews invocando la Lambda de watermark.
//
// Uso:
//   node scripts/regenerate-missing-previews.mjs              → solo las que tienen previewKey null
//   node scripts/regenerate-missing-previews.mjs --all        → todas las fotos del sistema
//   node scripts/regenerate-missing-previews.mjs --collection <id>   → todas las de una colección
//
// La Lambda procesa en paralelo, así que tirar muchas a la vez es OK.

import { PrismaClient } from "../generated/prisma/index.js";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
for (const line of readFileSync(resolve(__dirname, "../.env"), "utf8").split(/\r?\n/)) {
  const m = /^([A-Z_]+)=(.*)$/.exec(line);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}

const ARN = process.env.LAMBDA_WATERMARK_ARN;
if (!ARN) {
  console.error("LAMBDA_WATERMARK_ARN no está configurado en .env");
  process.exit(1);
}

const args = process.argv.slice(2);
const ALL = args.includes("--all");
const collIdx = args.indexOf("--collection");
const COLLECTION = collIdx >= 0 ? args[collIdx + 1] : null;

const lambda = new LambdaClient({ region: process.env.AWS_REGION ?? "us-east-2" });
const db = new PrismaClient({
  datasourceUrl: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
});

const where = COLLECTION
  ? { collectionId: COLLECTION }
  : ALL
  ? {}
  : { previewKey: null };

const photos = await db.photo.findMany({
  where,
  select: { id: true, storageKey: true, previewKey: true, filename: true, mimeType: true },
});

const targets = photos.filter(
  (p) => !p.mimeType?.startsWith("video/") && !/\.(mp4|mov|webm|mkv|m4v)$/i.test(p.filename),
);

console.log(`Encontradas ${targets.length} fotos para regenerar (modo: ${ALL ? "todas" : COLLECTION ? "colección" : "solo missing"}).`);

const CHUNK = 50;
const CHUNK_DELAY_MS = 100;
let ok = 0;
let fail = 0;

for (let i = 0; i < targets.length; i += CHUNK) {
  const batch = targets.slice(i, i + CHUNK);
  await Promise.all(
    batch.map(async (p) => {
      try {
        await lambda.send(
          new InvokeCommand({
            FunctionName: ARN,
            InvocationType: "Event",
            Payload: Buffer.from(
              JSON.stringify({
                photoId: p.id,
                storageKey: p.storageKey,
                existingPreviewKey: p.previewKey ?? undefined,
              }),
            ),
          }),
        );
        ok++;
      } catch (err) {
        fail++;
        console.error(`  ✗ ${p.id}:`, err.message);
      }
    }),
  );
  process.stdout.write(`\r${Math.min(i + CHUNK, targets.length)} / ${targets.length}`);
  if (i + CHUNK < targets.length) await new Promise((r) => setTimeout(r, CHUNK_DELAY_MS));
}

console.log(`\nListo: ${ok} invocadas, ${fail} fallaron.`);
console.log("La Lambda corre async — esperá unos minutos y revisá la galería.");

await db.$disconnect();
