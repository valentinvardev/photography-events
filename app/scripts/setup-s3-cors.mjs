import { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } from "@aws-sdk/client-s3";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
for (const line of readFileSync(resolve(__dirname, "../.env"), "utf8").split(/\r?\n/)) {
  const m = /^([A-Z_]+)="?([^"]*)"?$/.exec(line);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const BUCKET = process.env.AWS_S3_BUCKET ?? "mediaseller-photos";

const s3 = new S3Client({
  region: process.env.AWS_REGION ?? "us-east-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const corsConfig = {
  CORSRules: [
    {
      AllowedOrigins: [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://*.vercel.app",
      ],
      AllowedMethods: ["GET", "PUT", "POST", "HEAD", "DELETE"],
      AllowedHeaders: ["*"],
      ExposeHeaders: ["ETag"],
      MaxAgeSeconds: 3000,
    },
  ],
};

await s3.send(new PutBucketCorsCommand({ Bucket: BUCKET, CORSConfiguration: corsConfig }));
console.log(`✓ CORS aplicado a ${BUCKET}`);

const current = await s3.send(new GetBucketCorsCommand({ Bucket: BUCKET }));
console.log("Config actual:", JSON.stringify(current.CORSRules, null, 2));
