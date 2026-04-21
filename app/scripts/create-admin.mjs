import { PrismaClient } from "../generated/prisma/index.js";
import bcrypt from "bcryptjs";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env");
for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const m = /^([A-Z_]+)=(.*)$/.exec(line);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}

const EMAIL = "ivana@ivanamaritano.com";
const PASSWORD = "Admin123!";
const NAME = "Ivana Maritano";

const db = new PrismaClient({
  datasourceUrl: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
});

const passwordHash = await bcrypt.hash(PASSWORD, 12);

const user = await db.user.upsert({
  where: { email: EMAIL },
  update: { passwordHash, name: NAME },
  create: { email: EMAIL, name: NAME, passwordHash },
});

console.log(`✓ Admin listo: ${user.email} (id: ${user.id})`);
await db.$disconnect();
