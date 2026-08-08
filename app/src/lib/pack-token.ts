import "server-only";

import { createHmac, timingSafeEqual } from "crypto";

/**
 * Signed proof that a set of photo IDs really came out of a face search.
 *
 * The pack price ("todas las fotos de tu búsqueda") is charged flat, so the
 * server has to know the requested set is a legitimate search result — otherwise
 * a crafted request could buy the whole collection for one pack price.
 *
 * Bib searches don't need this: `createPreference` re-runs the bib query itself.
 * Face searches aren't reproducible server-side, so `/api/face-search` signs the
 * IDs it matched and the checkout hands the token back.
 */

const TTL_MS = 60 * 60 * 1000; // 1h — a checkout takes minutes, not hours

function key(): string {
  const secret = process.env.AUTH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET is required to sign pack tokens");
  }
  return "dev-only-pack-token-secret";
}

function digest(collectionId: string, photoIds: string[], expiresAt: number): string {
  const payload = `${collectionId}|${[...photoIds].sort().join(",")}|${expiresAt}`;
  return createHmac("sha256", key()).update(payload).digest("hex");
}

export function signPackToken(collectionId: string, photoIds: string[]): string | null {
  if (photoIds.length === 0) return null;
  const expiresAt = Date.now() + TTL_MS;
  return `${expiresAt}.${digest(collectionId, photoIds, expiresAt)}`;
}

/** True only if `photoIds` is exactly the set that was signed, and the token is fresh. */
export function verifyPackToken(
  token: string,
  collectionId: string,
  photoIds: string[],
): boolean {
  const [expiresRaw, mac] = token.split(".");
  const expiresAt = Number(expiresRaw);
  if (!expiresRaw || !mac || !Number.isFinite(expiresAt) || Date.now() > expiresAt) {
    return false;
  }

  const expected = digest(collectionId, photoIds, expiresAt);
  const received = Buffer.from(mac, "hex");
  const computed = Buffer.from(expected, "hex");
  return received.length === computed.length && timingSafeEqual(received, computed);
}
