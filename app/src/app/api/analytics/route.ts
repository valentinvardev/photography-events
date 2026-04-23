import { NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";

const VALID_TYPES = new Set(["VISIT", "SEARCH_BIB", "SEARCH_FACE", "CART_ADD"]);

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
