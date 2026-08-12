import { type NextRequest, NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { db } from "~/server/db";

/**
 * Re-runs face indexing for a collection.
 *
 * The button for this shipped without the route, so it has been 404-ing — which
 * is the only reason the account never paid for a duplicate index. IndexFaces
 * mints new FaceIds every run, so a naive "loop over every photo" costs USD
 * 0,001 per photo *and* doubles the stored faces, billed monthly forever.
 *
 * So: GET reports what would happen and what it would cost, POST only touches
 * photos with no faces on record unless `force` is passed explicitly, and force
 * deletes the old faces before re-indexing.
 */

const COST_PER_CALL_USD = 0.001;

async function plan(collectionId: string, force: boolean) {
  const [total, indexed] = await Promise.all([
    db.photo.count({ where: { collectionId, NOT: { mimeType: { startsWith: "video/" } } } }),
    db.photo.count({
      where: {
        collectionId,
        NOT: { mimeType: { startsWith: "video/" } },
        faceRecords: { some: {} },
      },
    }),
  ]);
  const targets = force ? total : total - indexed;
  return {
    total,
    alreadyIndexed: indexed,
    willProcess: targets,
    estimatedCostUsd: Number((targets * COST_PER_CALL_USD).toFixed(3)),
  };
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const collectionId = req.nextUrl.searchParams.get("collectionId");
  const force = req.nextUrl.searchParams.get("force") === "true";
  if (!collectionId) {
    return NextResponse.json({ error: "collectionId required" }, { status: 400 });
  }
  return NextResponse.json(await plan(collectionId, force));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { collectionId, force = false } = (await req.json()) as {
    collectionId?: string;
    force?: boolean;
  };
  if (!collectionId) {
    return NextResponse.json({ error: "collectionId required" }, { status: 400 });
  }

  const photos = await db.photo.findMany({
    where: {
      collectionId,
      NOT: { mimeType: { startsWith: "video/" } },
      ...(force ? {} : { faceRecords: { none: {} } }),
    },
    select: { id: true },
    orderBy: { order: "asc" },
  });

  const summary = await plan(collectionId, force);

  if (photos.length === 0) {
    return NextResponse.json({ ...summary, queued: 0 });
  }

  // Sequential and detached: a large collection would blow past Nginx's
  // proxy_read_timeout, and there's no reason to hammer Rekognition.
  void (async () => {
    const { runFaceIndex } = await import("~/lib/photo-processing");
    let done = 0;
    for (const photo of photos) {
      await runFaceIndex(photo.id, collectionId, { force });
      done++;
    }
    console.log(`[face-reindex] collectionId=${collectionId} force=${force} processed ${done}`);
  })();

  return NextResponse.json({ ...summary, queued: photos.length });
}
