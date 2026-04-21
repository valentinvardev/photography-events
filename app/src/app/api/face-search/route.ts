import { type NextRequest, NextResponse } from "next/server";
import {
  RekognitionClient,
  SearchFacesByImageCommand,
} from "@aws-sdk/client-rekognition";
import { db } from "~/server/db";

const rekognition = new RekognitionClient({
  region: process.env.AWS_REGION ?? "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

function rekognitionCollectionId(collectionId: string) {
  return `foto-${collectionId.replace(/[^a-zA-Z0-9_.\-]/g, "-")}`;
}

export async function POST(req: NextRequest) {
  try {
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
    const rekCollectionId = rekognitionCollectionId(collectionId);

    let matchedPhotoIds: string[] = [];
    try {
      const result = await rekognition.send(new SearchFacesByImageCommand({
        CollectionId: rekCollectionId,
        Image: { Bytes: new Uint8Array(imageBytes) },
        MaxFaces: 50,
        FaceMatchThreshold: 80,
      }));

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

    console.log(`[face-search] collectionId=${collectionId} found ${matchedPhotoIds.length} photos in ${groups.length} groups`);
    return NextResponse.json({ groups });
  } catch (err) {
    console.error("[face-search] error:", err);
    return NextResponse.json({ error: "Face search failed" }, { status: 500 });
  }
}
