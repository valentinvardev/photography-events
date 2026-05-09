// Regenera previews para fotos cuyo previewKey quedó null
// (típicamente porque la Lambda crasheó en un upload pasado).
//
// Uso: node scripts/regenerate-missing-previews.mjs

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

const lambda = new LambdaClient({ region: process.env.AWS_REGION ?? "us-east-2" });
const db = new PrismaClient({
  datasourceUrl: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
});

const photos = await db.photo.findMany({
  where: { previewKey: null },
  select: { id: true, storageKey: true, filename: true, mimeType: true },
});

// Skip videos — Lambda solo procesa imágenes
const targets = photos.filter(
  (p) => !p.mimeType?.startsWith("video/") && !/\.(mp4|mov|webm|mkv|m4v)$/i.test(p.filename),
);

console.log(`Encontradas ${targets.length} fotos sin preview. Invocando Lambda…`);

let ok = 0;
let fail = 0;
for (const p of targets) {
  try {
    await lambda.send(
      new InvokeCommand({
        FunctionName: ARN,
        InvocationType: "Event",
        Payload: Buffer.from(JSON.stringify({ photoId: p.id, storageKey: p.storageKey })),
      }),
    );
    ok++;
    console.log(`  ✓ ${p.id} (${p.filename})`);
    await new Promise((r) => setTimeout(r, 50));
  } catch (err) {
    fail++;
    console.error(`  ✗ ${p.id} (${p.filename}):`, err.message);
  }
}

console.log(`\nListo: ${ok} invocadas, ${fail} fallaron.`);
console.log("Esperá 30-60s y revisá la galería. Si siguen sin preview, mirá los CloudWatch logs.");

await db.$disconnect();
