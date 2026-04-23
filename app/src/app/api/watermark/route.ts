import { NextResponse, type NextRequest } from "next/server";
import { auth } from "~/server/auth";
import { db } from "~/server/db";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { photoId?: string };
  if (!body.photoId) return NextResponse.json({ error: "photoId required" }, { status: 400 });

  const photo = await db.photo.findUnique({
    where: { id: body.photoId },
    select: { mimeType: true, filename: true },
  });
  if (!photo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isVideo =
    photo.mimeType?.startsWith("video/") ??
    /\.(mp4|mov|webm|mkv|m4v)$/i.test(photo.filename);

  if (isVideo) {
    const { runVideoWatermark } = await import("~/lib/video-processing");
    const result = await runVideoWatermark(body.photoId);
    return NextResponse.json({ previewKey: result.previewKey });
  } else {
    const { runWatermark } = await import("~/lib/photo-processing");
    const result = await runWatermark(body.photoId);
    return NextResponse.json({ previewKey: result.previewKey });
  }
}
