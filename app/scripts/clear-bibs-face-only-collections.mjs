// Limpia bibNumber en todas las fotos de colecciones que estén en modo
// solo-selfie (bibSearchEnabled=false).
//
// Uso: node scripts/clear-bibs-face-only-collections.mjs

import { PrismaClient } from "../generated/prisma/index.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
for (const line of readFileSync(resolve(__dirname, "../.env"), "utf8").split(/\r?\n/)) {
  const m = /^([A-Z_]+)=(.*)$/.exec(line);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}

const db = new PrismaClient({
  datasourceUrl: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
});

const collections = await db.collection.findMany({
  where: { bibSearchEnabled: false },
  select: { id: true, title: true },
});

console.log(`Colecciones en modo solo-selfie: ${collections.length}`);

for (const c of collections) {
  const result = await db.photo.updateMany({
    where: { collectionId: c.id, bibNumber: { not: null } },
    data: { bibNumber: null },
  });
  console.log(`  ${c.title} → ${result.count} bibs limpiados`);
}

await db.$disconnect();
console.log("Listo.");
