import type { db as dbInstance } from "~/server/db";

/** A purchase's photo ids, as stored in Purchase.photoIds (a JSON array). */
export function parsePhotoIds(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/**
 * How many photos the approval email announces: the purchased set. Every
 * path that sends that email goes through here — the resend button used to
 * count the bib's photos, and checkout stores no bib, so it announced the
 * whole album. Only a purchase from before photoIds were stored falls back.
 */
export async function approvalPhotoCount(
  db: typeof dbInstance,
  purchase: { photoIds: string | null; collectionId: string; bibNumber: string | null },
): Promise<number> {
  const ids = parsePhotoIds(purchase.photoIds);
  if (ids.length > 0) return ids.length;
  return db.photo.count({
    where: { collectionId: purchase.collectionId, bibNumber: purchase.bibNumber ?? undefined },
  });
}
