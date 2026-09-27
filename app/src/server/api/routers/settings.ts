import { z } from "zod";
import { env } from "~/env";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { sendPurchaseApprovedEmail } from "~/lib/email";
import { approvalPhotoCount } from "~/lib/purchase-photos";
import { checkMpToken } from "~/lib/mercadopago";
import { MP_OAUTH_TOKEN_DAYS, mpWarning } from "~/lib/mp-warning";

const DAY_MS = 86_400_000;

export const settingsRouter = createTRPCRouter({
  getMpStatus: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.setting.findMany({
      where: { key: { in: ["mp_access_token", "mp_user_id", "mp_token_expires_at"] } },
    });
    const row = (key: string) => rows.find((r) => r.key === key);
    const token = row("mp_access_token");
    const envFallback = !!env.MERCADOPAGO_ACCESS_TOKEN;

    if (!token) {
      // Checkout runs on the env token here. It has no expiry to count down
      // to, but it can still be revoked or regenerated in MP's panel.
      const valid = env.MERCADOPAGO_ACCESS_TOKEN
        ? await checkMpToken(env.MERCADOPAGO_ACCESS_TOKEN)
        : null;
      return {
        connected: false,
        userId: null,
        expiresAt: null,
        expiryEstimated: false,
        daysLeft: null,
        valid,
        warning: mpWarning({ connected: false, envFallback, valid, daysLeft: null }),
      };
    }

    // Exact when the connect callback recorded MP's expires_in. Tokens saved
    // before that only have their save date plus MP's documented lifetime.
    const stored = row("mp_token_expires_at");
    const storedDate = stored ? new Date(stored.value) : null;
    const exact = !!storedDate && !Number.isNaN(storedDate.getTime());
    const expiresAt = exact
      ? storedDate
      : new Date(token.updatedAt.getTime() + MP_OAUTH_TOKEN_DAYS * DAY_MS);
    // Drives the warning levels only (7 and 30 days, where rounding up is
    // harmless). The wording counts calendar days: see expiryPhrase.
    const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / DAY_MS);
    const valid = await checkMpToken(token.value);
    const warning = mpWarning({ connected: true, envFallback, valid, daysLeft });

    return {
      connected: true,
      userId: row("mp_user_id")?.value ?? null,
      expiresAt,
      expiryEstimated: !exact,
      daysLeft,
      valid,
      warning,
    };
  }),

  disconnectMp: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db.setting.deleteMany({
      where: {
        key: { in: ["mp_access_token", "mp_refresh_token", "mp_user_id", "mp_token_expires_at"] },
      },
    });
    return { ok: true };
  }),

  resendPurchaseEmail: protectedProcedure
    .input(z.object({ purchaseId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const purchase = await ctx.db.purchase.findUnique({
        where: { id: input.purchaseId },
        include: { collection: { select: { title: true } } },
      });
      if (!purchase || purchase.status !== "APPROVED" || !purchase.downloadToken) {
        throw new Error("Compra no aprobada o sin token");
      }
      const photoCount = await approvalPhotoCount(ctx.db, purchase);
      const result = await sendPurchaseApprovedEmail({
        to: purchase.buyerEmail,
        buyerName: purchase.buyerName,
        bibNumber: purchase.bibNumber,
        collectionTitle: purchase.collection.title,
        downloadToken: purchase.downloadToken,
        photoCount,
      });
      // This button is how the admin recovers a lost approval email; saying
      // "Enviado" when Resend refused left the buyer without a link.
      if (!result.sent) {
        throw new Error(
          result.reason === "no-api-key"
            ? "El envío de emails no está configurado (falta RESEND_API_KEY)."
            : `Resend no envió el email (${result.reason}). Probá de nuevo o mandá el link a mano.`,
        );
      }
      return { ok: true };
    }),
});
