import { createHmac } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "~/server/db";
import { logIfUnsent, sendPurchaseApprovedEmail } from "~/lib/email";
import { mpTokenCandidates } from "~/lib/mercadopago";
import { nonApprovalChange } from "~/lib/mp-webhook";
import { approvalPhotoCount } from "~/lib/purchase-photos";
import { PurchaseStatus } from "../../../../../generated/prisma";

function verifyWebhookSignature(request: NextRequest, rawBody: string): boolean {
  const { env } = require("~/env") as { env: { MERCADOPAGO_WEBHOOK_SECRET?: string } };
  const secret = env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) return true;

  const signature = request.headers.get("x-signature");
  const requestId = request.headers.get("x-request-id");
  if (!signature || !requestId) return false;

  const tsMatch = /ts=([^,]+)/.exec(signature);
  const v1Match = /v1=([^,]+)/.exec(signature);
  if (!tsMatch?.[1] || !v1Match?.[1]) return false;

  const ts = tsMatch[1];
  const expectedHash = v1Match[1];
  const manifest = `id:${requestId};request-id:${requestId};ts:${ts};${rawBody}`;
  const calculated = createHmac("sha256", secret).update(manifest).digest("hex");

  return calculated === expectedHash;
}

type MpPayment = {
  id: number;
  status: string;
  external_reference?: string;
  order?: { id?: string };
};

const MP_API = "https://api.mercadopago.com";
const MP_TIMEOUT_MS = 8000;

const statusMap: Record<string, PurchaseStatus> = {
  approved: PurchaseStatus.APPROVED,
  rejected: PurchaseStatus.REJECTED,
  refunded: PurchaseStatus.REFUNDED,
  // The money went back to the buyer, same as a refund.
  charged_back: PurchaseStatus.REFUNDED,
};

const done = () => NextResponse.json({ received: true });

// MP redelivers a notification that doesn't get a 2xx, for days. Every path
// below is safe to repeat, so failures ask for that instead of acking: a 200
// on a failure loses the notification for good — a cash payment that cleared
// while the OAuth token was expired stayed PENDING even after reconnecting.
const retryLater = () => NextResponse.json({ retry: true }, { status: 503 });

/**
 * Reads the payment with each token, OAuth first, the same order checkout
 * uses. "not-ours" only when every account answered 404; an expired token, a
 * rate limit or MP being down could still be hiding our payment.
 */
async function readPayment(
  paymentId: string,
): Promise<{ payment: MpPayment; token: string } | "not-ours" | "retry"> {
  const tokens = await mpTokenCandidates(db);
  let retry = tokens.length === 0;
  for (const token of tokens) {
    try {
      const res = await fetch(`${MP_API}/v1/payments/${encodeURIComponent(paymentId)}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(MP_TIMEOUT_MS),
      });
      if (res.ok) return { payment: (await res.json()) as MpPayment, token };
      if (res.status !== 404) retry = true;
    } catch {
      retry = true;
    }
  }
  return retry ? "retry" : "not-ours";
}

/**
 * Another payment of this purchase that MP reports as approved: its id, or
 * null when there is none. "retry" when MP may answer on a redelivery
 * (timeout, rate limit, MP down): a revocation decided without the answer is
 * acked and never revisited. undefined when this token can never search (a
 * definite 4xx), so retrying would only hold the refund for days.
 */
async function otherApprovedPayment(
  token: string,
  purchaseId: string,
  exceptId: string,
): Promise<string | null | "retry" | undefined> {
  try {
    const res = await fetch(
      `${MP_API}/v1/payments/search?external_reference=${encodeURIComponent(purchaseId)}&limit=100`,
      { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(MP_TIMEOUT_MS) },
    );
    if (res.status === 429 || res.status >= 500) return "retry";
    if (!res.ok) return undefined;
    const data = (await res.json()) as { results?: { id: number; status: string }[] };
    if (!Array.isArray(data.results)) return "retry";
    const other = data.results.find((p) => p.status === "approved" && String(p.id) !== exceptId);
    return other ? String(other.id) : null;
  } catch {
    return "retry";
  }
}

async function approve(
  purchaseId: string,
  mpIds: { mercadopagoPaymentId: string; mercadopagoOrderId?: string },
) {
  // Everything the email needs is read BEFORE the claim. Once the claim lands
  // a redelivery finds the purchase approved and sends nothing, so a failure
  // between the two would lose the buyer's email for good.
  const purchase = await db.purchase.findUnique({
    where: { id: purchaseId },
    include: { collection: { select: { title: true } } },
  });
  if (!purchase) return done();

  const photoCount = await approvalPhotoCount(db, purchase);

  // Idempotency: only rotate the token + send the email on the actual
  // transition into APPROVED. MP webhooks are at-least-once, so a duplicate
  // delivery for the same payment would otherwise invalidate the link we
  // already sent and spam the buyer with a second email.
  const newToken = crypto.randomUUID();
  const claim = await db.purchase.updateMany({
    where: { id: purchaseId, status: { not: PurchaseStatus.APPROVED } },
    data: {
      ...mpIds,
      status: PurchaseStatus.APPROVED,
      downloadToken: newToken,
      downloadTokenExpires: null,
    },
  });

  if (claim.count === 0) {
    // Already approved: an earlier delivery, a sibling payment, or by hand.
    // Point the row at this payment, which MP just reported approved. A hand
    // approval leaves no id, or the id of the attempt that failed; either way
    // a later refund of this payment has to be recognized as the one that
    // pays for the purchase. (null needs its own branch: SQL's <> skips it.)
    await db.purchase.updateMany({
      where: {
        id: purchaseId,
        status: PurchaseStatus.APPROVED,
        OR: [{ mercadopagoPaymentId: null }, { mercadopagoPaymentId: { not: mpIds.mercadopagoPaymentId } }],
      },
      data: mpIds,
    });
    return done();
  }

  void sendPurchaseApprovedEmail({
    to: purchase.buyerEmail,
    buyerName: purchase.buyerName,
    bibNumber: purchase.bibNumber,
    collectionTitle: purchase.collection.title,
    downloadToken: newToken,
    photoCount,
  }).then(logIfUnsent(purchaseId));
  return done();
}

async function handlePayment(paymentId: string) {
  const read = await readPayment(paymentId);
  if (read === "retry") return retryLater();
  if (read === "not-ours") return done();
  const { payment, token } = read;

  const purchaseId = payment.external_reference;
  if (!purchaseId) return done();

  const id = String(payment.id);
  const mpIds = {
    mercadopagoPaymentId: id,
    mercadopagoOrderId: payment.order?.id ? String(payment.order.id) : undefined,
  };
  const newStatus = statusMap[payment.status] ?? PurchaseStatus.PENDING;
  if (newStatus === PurchaseStatus.APPROVED) return approve(purchaseId, mpIds);

  // Anything else speaks for one payment only; see nonApprovalChange.
  const row = await db.purchase.findUnique({
    where: { id: purchaseId },
    select: { status: true, mercadopagoPaymentId: true },
  });
  if (!row) return done();
  const otherApproved =
    row.status === PurchaseStatus.APPROVED && newStatus === PurchaseStatus.REFUNDED
      ? await otherApprovedPayment(token, purchaseId, id)
      : undefined;
  if (otherApproved === "retry") return retryLater();
  const change = nonApprovalChange({ row, paymentId: id, newStatus, otherApproved });
  if (!change) return done();

  // Only over the state the decision was made on. If an approval claimed the
  // row in between, redo the decision with fresh state on the redelivery.
  const applied = await db.purchase.updateMany({
    where: { id: purchaseId, status: row.status, mercadopagoPaymentId: row.mercadopagoPaymentId },
    data: {
      status: change.status,
      mercadopagoPaymentId: change.mercadopagoPaymentId,
      // The order id belongs to the notified payment, not to a sibling.
      mercadopagoOrderId: change.mercadopagoPaymentId === id ? mpIds.mercadopagoOrderId : undefined,
    },
  });
  return applied.count === 1 ? done() : retryLater();
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  if (!verifyWebhookSignature(request, rawBody)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: { type?: string; data?: { id?: string | number } };
  try {
    body = JSON.parse(rawBody) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (body.type !== "payment" || !body.data?.id) return done();

  try {
    return await handlePayment(String(body.data.id));
  } catch (err) {
    // DB or network failure. Only the error's kind: Prisma messages echo the
    // query arguments.
    console.error("[webhook/mercadopago]", {
      paymentId: String(body.data.id),
      error: err instanceof Error ? err.name : typeof err,
      code: (err as { code?: unknown } | null)?.code,
    });
    return retryLater();
  }
}
