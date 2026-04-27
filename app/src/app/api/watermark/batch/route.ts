import { NextResponse, type NextRequest } from "next/server";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { auth } from "~/server/auth";
import { db } from "~/server/db";

const lambda = new LambdaClient({ region: process.env.AWS_REGION ?? "us-east-2" });

const CHUNK_SIZE = 10;
const CHUNK_DELAY_MS = 250;
const MAX_RETRIES = 4;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function invokeWithRetry(
  arn: string,
  photoId: string,
  storageKey: string,
  existingPreviewKey: string | undefined,
) {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      await lambda.send(new InvokeCommand({
        FunctionName: arn,
        InvocationType: "Event",
        Payload: Buffer.from(JSON.stringify({ photoId, storageKey, existingPreviewKey })),
      }));
      return;
    } catch (err: unknown) {
      const e = err as { name?: string; Reason?: string };
      const isRateLimit =
        e.name === "TooManyRequestsException" ||
        e.Reason === "CallerRateLimitExceeded";
      if (isRateLimit && attempt < MAX_RETRIES - 1) {
        // Exponential backoff: 500ms, 1s, 2s, 4s
        await sleep(500 * Math.pow(2, attempt));
        continue;
      }
      console.error(`[WatermarkBatch] Failed to invoke for ${photoId}:`, err);
      return;
    }
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const arn = process.env.LAMBDA_WATERMARK_ARN;
  if (!arn) return NextResponse.json({ error: "Lambda not configured" }, { status: 503 });

  const body = await request.json() as { collectionId?: string; onlyMissing?: boolean };
  if (!body.collectionId) return NextResponse.json({ error: "collectionId required" }, { status: 400 });

  const photos = await db.photo.findMany({
    where: {
      collectionId: body.collectionId,
      ...(body.onlyMissing ? { previewKey: null } : {}),
    },
    select: { id: true, storageKey: true, previewKey: true, mimeType: true, filename: true },
  });

  const targets = photos.filter(
    (p) => !p.mimeType?.startsWith("video/") && !/\.(mp4|mov|webm|mkv|m4v)$/i.test(p.filename),
  );

  // Fire-and-forget the throttled rollout so the request returns immediately.
  void (async () => {
    for (let i = 0; i < targets.length; i += CHUNK_SIZE) {
      const chunk = targets.slice(i, i + CHUNK_SIZE);
      await Promise.all(
        chunk.map((p) => invokeWithRetry(arn, p.id, p.storageKey, p.previewKey ?? undefined)),
      );
      if (i + CHUNK_SIZE < targets.length) await sleep(CHUNK_DELAY_MS);
    }
    console.log(`[WatermarkBatch] Done invoking Lambda for ${targets.length} photos in ${body.collectionId}`);
  })();

  return NextResponse.json({ queued: targets.length });
}
