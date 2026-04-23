import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.AWS_REGION ?? "us-east-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const S3_BUCKET = process.env.AWS_S3_BUCKET ?? "mediaseller-photos";

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

/** Determina si una storageKey apunta a S3 (en lugar de Supabase). */
export function isS3Key(storageKey: string): boolean {
  return storageKey.startsWith("uploads/") || storageKey.startsWith("previews/");
}
