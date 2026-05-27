import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  CloudFrontClient,
  CreateInvalidationCommand,
} from "@aws-sdk/client-cloudfront";

const s3 = new S3Client({
  region: process.env.AWS_REGION ?? "us-east-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const cfClient = process.env.CLOUDFRONT_DISTRIBUTION_ID
  ? new CloudFrontClient({
      region: "us-east-1",
      credentials:
        process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
          ? {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            }
          : undefined,
    })
  : null;

export const S3_BUCKET = process.env.AWS_S3_BUCKET ?? "mediaseller-photos";

/** Prefijo de carpeta dentro del bucket, e.g. "ivana/" para separar clientes. */
export const S3_PREFIX = process.env.AWS_S3_PREFIX
  ? process.env.AWS_S3_PREFIX.replace(/\/?$/, "/")
  : "";

/** Construye una key S3 aplicando el prefijo configurado. */
export function s3Key(path: string): string {
  return `${S3_PREFIX}${path}`;
}

/** Genera una URL firmada para que el browser suba directamente a S3 (PUT). */
export async function createS3UploadUrl(
  key: string,
  contentType: string,
  expiresIn = 300,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3, command, { expiresIn });
}

/** Genera una URL firmada para descargar/mostrar una foto desde S3 (GET). */
export async function createS3DownloadUrl(
  key: string,
  expiresIn = 3600,
  responseContentType?: string,
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ...(responseContentType ? { ResponseContentType: responseContentType } : {}),
  });
  return getSignedUrl(s3, command, { expiresIn });
}

/** Descarga el contenido de un objeto S3 como bytes. */
export async function getS3ObjectBytes(key: string): Promise<Uint8Array> {
  const response = await s3.send(
    new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }),
  );
  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

/** Sube bytes a S3 directamente desde el servidor. */
export async function putS3Object(
  key: string,
  bytes: Uint8Array | Buffer,
  contentType: string,
): Promise<void> {
  await s3.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: bytes,
    ContentType: contentType,
  }));
}

/** Elimina uno o más objetos de S3. */
export async function deleteS3Objects(keys: string[]): Promise<void> {
  await Promise.all(
    keys.map((key) => s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }))),
  );
}

/** Returns a CloudFront URL for a given S3 key, or null if CF is not configured. */
export function getCFUrl(key: string): string | null {
  return process.env.CLOUDFRONT_DOMAIN
    ? `https://${process.env.CLOUDFRONT_DOMAIN}/${key}`
    : null;
}

/**
 * Invalidates CloudFront cache for the given paths (must start with "/").
 * No-op if CF is not configured. Use wildcards for bulk: ["/prefix/*"].
 */
export async function createCFInvalidation(paths: string[]): Promise<void> {
  if (!cfClient || !process.env.CLOUDFRONT_DISTRIBUTION_ID || paths.length === 0) return;
  try {
    await cfClient.send(
      new CreateInvalidationCommand({
        DistributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
        InvalidationBatch: {
          CallerReference: Date.now().toString(),
          Paths: { Quantity: paths.length, Items: paths },
        },
      }),
    );
  } catch (err) {
    console.error("[cloudfront] invalidation failed:", err);
  }
}

/** Determina si una storageKey apunta a S3 (en lugar de Supabase).
 *  Asume que cualquier key que empieza con S3_PREFIX es de S3.
 *  Conserva fallback para legacy S3 keys subidas antes de configurar el prefijo. */
export function isS3Key(storageKey: string): boolean {
  if (S3_PREFIX && storageKey.startsWith(S3_PREFIX)) return true;
  return storageKey.startsWith("uploads/") || storageKey.startsWith("previews/");
}
