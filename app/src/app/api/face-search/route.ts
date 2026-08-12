import { type NextRequest, NextResponse } from "next/server";
import { SearchFacesByImageCommand } from "@aws-sdk/client-rekognition";
import { db } from "~/server/db";
import { signPackToken } from "~/lib/pack-token";
import { getRekognitionClient, rekSend, rekCollectionId } from "~/lib/rekognition";

const rekognition = getRekognitionClient();

/**
 * This endpoint is public by design — a runner shouldn't need an account to
 * find themselves — but every call costs USD 0,001, so it can't be unbounded.
 * A real person searches a handful of times; a loop would run up the bill with
 * nothing stopping it.
 *
 * In-memory on purpose: one Node process per deployment under PM2. It resets on
 * restart and doesn't span instances, which is the right trade for a spend cap
 * rather than a security control.
 */
const RATE_LIMIT = 15;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1h
const hits = new Map<string, number[]>();

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("cf-connecting-ip") ?? req.headers.get("x-real-ip") ?? "unknown";
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);

  // Opportunistic cleanup so the map can't grow without bound.
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= RATE_WINDOW_MS)) hits.delete(key);
    }
  }
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    if (rateLimited(ip)) {
      console.warn(`[face-search] rate limited ip=${ip}`);
      return NextResponse.json(
        { error: "Demasiadas búsquedas. Esperá un rato e intentá de nuevo." },
        { status: 429 },
      );
    }

    const { imageBase64, collectionId } = (await req.json()) as {
      imageBase64?: string;
      collectionId?: string;
    };

    if (!imageBase64 || !collectionId) {
      return NextResponse.json({ error: "Missing imageBase64 or collectionId" }, { status: 400 });
    }

    const collection = await db.collection.findFirst({
      where: { id: collectionId, isPublished: true },
      select: { id: true },
    });
    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    const imageBytes = Buffer.from(imageBase64, "base64");
    const rekCollection = rekCollectionId(collectionId);

    let matchedPhotoIds: string[] = [];
    try {
      const result = await rekSend(
        { op: "SearchFacesByImage", collectionId: rekCollection },
        () => rekognition.send(new SearchFacesByImageCommand({
          CollectionId: rekCollection,
          Image: { Bytes: new Uint8Array(imageBytes) },
          MaxFaces: 50,
          FaceMatchThreshold: 80,
        })),
      );

      matchedPhotoIds = [
        ...new Set(
          (result.FaceMatches ?? [])
            .map((m) => m.Face?.ExternalImageId)
            .filter((id): id is string => !!id)
        ),
      ];
    } catch (err: unknown) {
      if ((err as { name?: string }).name === "InvalidParameterException") {
        return NextResponse.json({ groups: [], noFaceDetected: true });
      }
      if ((err as { name?: string }).name === "ResourceNotFoundException") {
        return NextResponse.json({ groups: [] });
      }
      if ((err as { name?: string }).name === "ImageTooLargeException") {
        return NextResponse.json({ groups: [], noFaceDetected: true });
      }
      throw err;
    }

    if (matchedPhotoIds.length === 0) {
      return NextResponse.json({ groups: [] });
    }

    const photos = await db.photo.findMany({
      where: { id: { in: matchedPhotoIds }, collectionId },
      select: { id: true, bibNumber: true },
    });

    const bibMap = new Map<string, string[]>();
    for (const p of photos) {
      const key = p.bibNumber ?? "sin-dorsal";
      if (!bibMap.has(key)) bibMap.set(key, []);
      bibMap.get(key)!.push(p.id);
    }

    const groups = Array.from(bibMap.entries()).map(([bib, photoIds]) => ({
      bib,
      photoIds,
    }));

    // Signed proof of this result set, so checkout can charge the pack price for it.
    const packToken = signPackToken(collectionId, photos.map((p) => p.id));

    console.log(`[face-search] collectionId=${collectionId} found ${matchedPhotoIds.length} photos in ${groups.length} groups`);
    return NextResponse.json({ groups, packToken });
  } catch (err) {
    console.error("[face-search] error:", err);
    return NextResponse.json({ error: "Face search failed" }, { status: 500 });
  }
}
