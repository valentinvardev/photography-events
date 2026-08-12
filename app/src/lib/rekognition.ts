import "server-only";

import {
  RekognitionClient,
  CreateCollectionCommand,
  DeleteCollectionCommand,
  DeleteFacesCommand,
} from "@aws-sdk/client-rekognition";

/**
 * Single entry point for Amazon Rekognition.
 *
 * The AWS account is shared with other platforms, so every call is logged with
 * the deployment that made it. Without that, the bill can't be split and a
 * spike has no owner — which is exactly the state this module was written to
 * end. Grep the PM2 logs for `"tag":"REK"` to get the breakdown.
 */

/** Which deployment is calling. `AWS_S3_PREFIX` already identifies the client. */
export const PLATFORM = process.env.AWS_S3_PREFIX?.replace(/\/$/, "") ?? "unknown";

/**
 * One region for everything. This used to be resolved in three places with
 * three different fallbacks (sa-east-1, us-east-1, us-east-2) — with the env
 * var missing, faces would be indexed in one region and searched in another.
 */
export const REK_REGION = process.env.AWS_REGION ?? "us-east-2";

const rekognition = new RekognitionClient({
  region: REK_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  // Surfaces in the CloudTrail userAgent, so calls are attributable even
  // before per-platform IAM keys exist.
  userAgentAppId: `mediaseller-${PLATFORM}`,
});

type CallMeta = { op: string; imageKey?: string | null; collectionId?: string | null };

/**
 * Wraps every Rekognition call with attribution logging.
 * Billable operations are the ones worth counting: one line per call, one JSON
 * object per line, so the logs can be aggregated with jq.
 */
export async function rekSend<T>(meta: CallMeta, run: () => Promise<T>): Promise<T> {
  const startedAt = Date.now();
  try {
    const result = await run();
    console.log(
      JSON.stringify({
        tag: "REK",
        platform: PLATFORM,
        op: meta.op,
        imageKey: meta.imageKey ?? null,
        collectionId: meta.collectionId ?? null,
        ms: Date.now() - startedAt,
        ok: true,
      }),
    );
    return result;
  } catch (err) {
    console.log(
      JSON.stringify({
        tag: "REK",
        platform: PLATFORM,
        op: meta.op,
        imageKey: meta.imageKey ?? null,
        collectionId: meta.collectionId ?? null,
        ms: Date.now() - startedAt,
        ok: false,
        err: (err as { name?: string }).name ?? "Error",
      }),
    );
    throw err;
  }
}

export function getRekognitionClient() {
  return rekognition;
}

/** Rekognition collection id for one of our events. */
export function rekCollectionId(collectionId: string): string {
  return `foto-${collectionId.replace(/[^a-zA-Z0-9_.\-]/g, "-")}`;
}

// Collections already known to exist in this process. CreateCollection used to
// run once per photo — ~16.800 calls to create 35 collections.
const knownCollections = new Set<string>();

export async function ensureRekognitionCollection(collectionId: string): Promise<string> {
  const collId = rekCollectionId(collectionId);
  if (knownCollections.has(collId)) return collId;

  try {
    await rekSend({ op: "CreateCollection", collectionId: collId }, () =>
      rekognition.send(new CreateCollectionCommand({ CollectionId: collId })),
    );
  } catch (err: unknown) {
    if ((err as { name?: string }).name !== "ResourceAlreadyExistsException") throw err;
  }
  knownCollections.add(collId);
  return collId;
}

/**
 * Drops the whole Rekognition collection for an event.
 *
 * Stored faces cost USD 0,00001 each per month *forever*, so deleting an event
 * without this leaks money for as long as the AWS account exists.
 */
export async function deleteRekognitionCollection(collectionId: string): Promise<void> {
  const collId = rekCollectionId(collectionId);
  try {
    await rekSend({ op: "DeleteCollection", collectionId: collId }, () =>
      rekognition.send(new DeleteCollectionCommand({ CollectionId: collId })),
    );
  } catch (err: unknown) {
    if ((err as { name?: string }).name !== "ResourceNotFoundException") {
      console.error("[rekognition] DeleteCollection failed:", collId, err);
    }
  }
  knownCollections.delete(collId);
}

/** DeleteFaces accepts at most 4096 ids per call. */
const DELETE_FACES_BATCH = 1000;

/**
 * Removes indexed faces. Callers must read the FaceRecord rows *before*
 * deleting the photos — Prisma cascades the rows away, and then the face ids
 * are gone from our side while Rekognition keeps billing for them.
 */
export async function deleteIndexedFaces(
  faces: { rekFaceId: string; collectionId: string }[],
): Promise<void> {
  const byCollection = new Map<string, string[]>();
  for (const face of faces) {
    const collId = rekCollectionId(face.collectionId);
    if (!byCollection.has(collId)) byCollection.set(collId, []);
    byCollection.get(collId)!.push(face.rekFaceId);
  }

  for (const [collId, faceIds] of byCollection) {
    for (let i = 0; i < faceIds.length; i += DELETE_FACES_BATCH) {
      const batch = faceIds.slice(i, i + DELETE_FACES_BATCH);
      try {
        await rekSend({ op: "DeleteFaces", collectionId: collId }, () =>
          rekognition.send(
            new DeleteFacesCommand({ CollectionId: collId, FaceIds: batch }),
          ),
        );
      } catch (err: unknown) {
        // A missing collection means the faces are already gone — nothing to bill.
        if ((err as { name?: string }).name !== "ResourceNotFoundException") {
          console.error("[rekognition] DeleteFaces failed:", collId, err);
        }
      }
    }
  }
}
