import { NextResponse, type NextRequest } from "next/server";
import { auth } from "~/server/auth";
import {
  deleteS3Objects,
  putS3Object,
  createCFInvalidation,
} from "~/lib/s3";
import { resolveMediaUrl } from "~/lib/media";
import { WATERMARK_KEY } from "~/lib/watermark";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const url = await resolveMediaUrl(WATERMARK_KEY);
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ url: null });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const bytes = Buffer.from(await file.arrayBuffer());

  try {
    await putS3Object(WATERMARK_KEY, bytes, file.type || "image/png");
    void createCFInvalidation([`/${WATERMARK_KEY}`]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[WatermarkSettings] upload error:", err);
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await deleteS3Objects([WATERMARK_KEY]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[WatermarkSettings] delete error:", err);
    return NextResponse.json({ ok: true });
  }
}
