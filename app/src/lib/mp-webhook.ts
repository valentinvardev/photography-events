/**
 * What a MercadoPago notification that is NOT an approval does to a purchase.
 * Pure, so every payment lifecycle can be tested without MP or a database.
 *
 * One Checkout Pro preference can collect several payments under the same
 * external_reference (the purchase id): a cash ticket abandoned for a card, a
 * rejected first attempt, even two approved payments. A notification speaks
 * for one payment only, so it can't revoke a purchase on its own say-so —
 * only when MP confirms no payment for the purchase is still approved.
 * Approvals don't come through here: the webhook claims those atomically.
 */

export type PurchaseState = "PENDING" | "APPROVED" | "REJECTED" | "REFUNDED";

export type NonApprovalChange = { status: PurchaseState; mercadopagoPaymentId: string } | null;

export function nonApprovalChange(input: {
  row: { status: PurchaseState; mercadopagoPaymentId: string | null };
  /** The payment the notification is about. */
  paymentId: string;
  /** Mapped from MP's status; never APPROVED here. */
  newStatus: Exclude<PurchaseState, "APPROVED">;
  /**
   * Only consulted for a refund of an approved purchase: the id of another
   * payment of this purchase that MP reports as approved, null when MP says
   * there is none, undefined when MP can't be asked at all with this token.
   * A transient failure never gets here: the webhook asks MP to redeliver.
   */
  otherApproved?: string | null;
}): NonApprovalChange {
  const { row, paymentId, newStatus, otherApproved } = input;

  if (row.status === "APPROVED") {
    // Pending, rejected, cancelled, expired, in mediation: none of these take
    // back money that was paid, so they never revoke. Before, a sibling
    // ticket expiring killed the buyer's download link.
    if (newStatus !== "REFUNDED") return null;
    // Refunded or charged back, but another payment still covers it.
    if (otherApproved) {
      return otherApproved === row.mercadopagoPaymentId
        ? null
        : { status: "APPROVED", mercadopagoPaymentId: otherApproved };
    }
    if (otherApproved === null) return { status: "REFUNDED", mercadopagoPaymentId: paymentId };
    // MP can't be asked. Revoke only if this is the payment we know approved
    // it, or we never recorded one (approved by hand).
    return row.mercadopagoPaymentId === paymentId || row.mercadopagoPaymentId === null
      ? { status: "REFUNDED", mercadopagoPaymentId: paymentId }
      : null;
  }

  // A refund is final against stale news from abandoned siblings; a new
  // approval can still reopen it through the claim.
  if (row.status === "REFUNDED") return null;

  // Not approved yet: mirror whatever MP says about the latest payment.
  if (row.status === newStatus && row.mercadopagoPaymentId === paymentId) return null;
  return { status: newStatus, mercadopagoPaymentId: paymentId };
}
