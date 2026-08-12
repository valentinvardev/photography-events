import { NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";

// SEARCH_FACE_* variants all represent a paid Rekognition call. Counting only
// the successful ones hid part of the bill.
const VALID_TYPES = new Set([
  "VISIT",
  "SEARCH_BIB",
  "SEARCH_FACE",
  "SEARCH_FACE_NO_MATCH",
  "SEARCH_FACE_NO_FACE",
  "SEARCH_FACE_ERROR",
  "CART_ADD",
]);

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { type?: string; collectionId?: string };
    if (!body.type || !VALID_TYPES.has(body.type)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    await db.analyticsEvent.create({
      data: {
        type: body.type,
        collectionId: body.collectionId ?? null,
      },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
