import { NextResponse, type NextRequest } from "next/server";
import { auth } from "~/server/auth";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { photoId?: string };
  if (!body.photoId) return NextResponse.json({ error: "photoId required" }, { status: 400 });

  const { runWatermark } = await import("~/lib/photo-processing");
  const result = await runWatermark(body.photoId);
  return NextResponse.json({ previewKey: result.previewKey });
}
