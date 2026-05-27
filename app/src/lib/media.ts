import "server-only";

import { getCFUrl, createS3DownloadUrl } from "~/lib/s3";

/**
 * Resolves a display URL for a media key (previews, covers, logos, watermarks).
 * Uses CloudFront when configured; falls back to presigned S3 in dev.
 * Never use for post-purchase original downloads — those always use createS3DownloadUrl directly.
 */
export async function resolveMediaUrl(
  key: string,
  opts?: { expiresIn?: number; contentType?: string },
): Promise<string> {
  return getCFUrl(key) ?? createS3DownloadUrl(key, opts?.expiresIn ?? 3600, opts?.contentType);
}
