import { NextResponse, type NextRequest } from "next/server";
import { auth } from "~/server/auth";
import { getAdminClient } from "~/lib/supabase/admin";
import { WATERMARK_KEY } from "~/lib/watermark";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getAdminClient();
  if (!supabase) return NextResponse.json({ url: null });

  const { data } = await supabase.storage.from("photos").createSignedUrl(WATERMARK_KEY, 3600);
  return NextResponse.json({ url: data?.signedUrl ?? null });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  console.log("[WatermarkSettings] POST session:", !!session);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getAdminClient();
  console.log("[WatermarkSettings] supabase client:", !!supabase);
  if (!supabase) return NextResponse.json({ error: "Storage not configured" }, { status: 503 });

  const form = await request.formData();
  const file = form.get("file") as File | null;
  console.log("[WatermarkSettings] file:", file?.name, file?.type, file?.size);
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error } = await supabase.storage
    .from("photos")
    .upload(WATERMARK_KEY, bytes, { contentType: file.type, upsert: true });

  if (error) {
    console.error("[WatermarkSettings] upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getAdminClient();
  if (!supabase) return NextResponse.json({ error: "Storage not configured" }, { status: 503 });

  await supabase.storage.from("photos").remove([WATERMARK_KEY]);
  return NextResponse.json({ ok: true });
}
