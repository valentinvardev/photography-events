import { NextResponse, type NextRequest } from "next/server";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { auth } from "~/server/auth";
import { db } from "~/server/db";

const lambda = new LambdaClient({ region: process.env.AWS_REGION ?? "us-east-2" });

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const arn = process.env.LAMBDA_WATERMARK_ARN;
  if (!arn) return NextResponse.json({ error: "Lambda not configured" }, { status: 503 });

  const body = await request.json() as { collectionId?: string };
  if (!body.collectionId) return NextResponse.json({ error: "collectionId required" }, { status: 400 });

  const photos = await db.photo.findMany({
    where: { collectionId: body.collectionId },
    select: { id: true, storageKey: true, previewKey: true, mimeType: true, filename: true },
  });

  // Fire all Lambda invocations in parallel (async — Lambda updates DB when done)
  const invocations = photos
    .filter((p) => !p.mimeType?.startsWith("video/") && !/\.(mp4|mov|webm|mkv|m4v)$/i.test(p.filename))
    .map((p) =>
      lambda.send(new InvokeCommand({
        FunctionName: arn,
        InvocationType: "Event", // async fire-and-forget
        Payload: Buffer.from(JSON.stringify({
          photoId: p.id,
          storageKey: p.storageKey,
          existingPreviewKey: p.previewKey ?? undefined,
        })),
      })).catch((err) => console.error(`[WatermarkBatch] Failed to invoke for ${p.id}:`, err))
    );

  await Promise.all(invocations);

  console.log(`[WatermarkBatch] Invoked Lambda for ${invocations.length} photos in collection ${body.collectionId}`);
  return NextResponse.json({ queued: invocations.length });
}
