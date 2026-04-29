import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { createSignedUrl } from "~/lib/supabase/admin";
import { createS3DownloadUrl, isS3Key } from "~/lib/s3";

function parsePhotoIds(raw: string | null): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw) as string[]; }
  catch { return []; }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const token = searchParams.get("token");
  const photoId = searchParams.get("photoId");

  if (!token || !photoId) {
    return NextResponse.json({ error: "token and photoId required" }, { status: 400 });
  }

  // Validate token
  const purchase = await db.purchase.findUnique({
    where: { downloadToken: token },
  });

  if (!purchase || purchase.status !== "APPROVED") {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 403 });
  }

  // Verify this photoId belongs to the purchase
  const purchasedIds = parsePhotoIds(purchase.photoIds);
  const isAuthorized =
    purchasedIds.length === 0 // legacy purchase without photoIds — check by bib below
      ? true
      : purchasedIds.includes(photoId);

  if (!isAuthorized) {
    return NextResponse.json({ error: "Photo not in purchase" }, { status: 403 });
  }

  const photo = await db.photo.findUnique({
    where: { id: photoId },
    select: { id: true, storageKey: true, filename: true, mimeType: true, collectionId: true },
  });

  if (!photo) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  // For legacy purchases, verify the photo belongs to the same collection+bib
  if (purchasedIds.length === 0) {
    if (photo.collectionId !== purchase.collectionId) {
      return NextResponse.json({ error: "Photo not in purchase" }, { status: 403 });
    }
  }

  // Fetch from storage server-side
  const storageUrl = isS3Key(photo.storageKey)
    ? await createS3DownloadUrl(photo.storageKey, 300)
    : await createSignedUrl(photo.storageKey, 300);

  if (!storageUrl) {
    return NextResponse.json({ error: "Could not generate download URL" }, { status: 500 });
  }

  const storageRes = await fetch(storageUrl);
  if (!storageRes.ok) {
    return NextResponse.json({ error: "Failed to fetch photo from storage" }, { status: 502 });
  }

  const contentType = photo.mimeType ?? storageRes.headers.get("content-type") ?? "image/jpeg";
  const filename = encodeURIComponent(photo.filename);

  return new NextResponse(storageRes.body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${photo.filename}"; filename*=UTF-8''${filename}`,
      "Cache-Control": "private, no-store",
    },
  });
}
