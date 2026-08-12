import { type NextRequest, NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { db } from "~/server/db";

/**
 * Detected bib for a photo, polled by the uploader while OCR runs in the
 * background. Reads what `runOcr` already wrote — it never triggers Rekognition
 * itself, so polling is free.
 *
 * The uploader has always called this; the route was missing, so the badge sat
 * on "detectando…" forever even though the bib was saved fine.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const photoId = req.nextUrl.searchParams.get("photoId");
  if (!photoId) return NextResponse.json({ error: "photoId required" }, { status: 400 });

  const photo = await db.photo.findUnique({
    where: { id: photoId },
    select: { bibNumber: true },
  });
  if (!photo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ bib: photo.bibNumber });
}
