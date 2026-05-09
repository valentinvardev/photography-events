import { NextResponse, type NextRequest } from "next/server";
import { auth } from "~/server/auth";
import { createS3UploadUrl, s3Key } from "~/lib/s3";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { path?: string; contentType?: string };
  if (!body.path) {
    return NextResponse.json({ error: "path is required" }, { status: 400 });
  }

  const key = s3Key(body.path);
  const signedUrl = await createS3UploadUrl(
    key,
    body.contentType ?? "application/octet-stream",
  );

  return NextResponse.json({ signedUrl, key, path: key });
}
