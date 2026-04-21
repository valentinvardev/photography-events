import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { sendPurchaseApprovedEmail } from "~/lib/email";

export const settingsRouter = createTRPCRouter({
  getMpStatus: protectedProcedure.query(async ({ ctx }) => {
    const setting = await ctx.db.setting.findUnique({
      where: { key: "mp_access_token" },
    });
    const userId = await ctx.db.setting.findUnique({
      where: { key: "mp_user_id" },
    });
    return {
      connected: !!setting?.value,
      userId: userId?.value ?? null,
    };
  }),

  disconnectMp: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db.setting.deleteMany({
      where: { key: { in: ["mp_access_token", "mp_refresh_token", "mp_user_id"] } },
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
      const photoCount = await ctx.db.photo.count({
        where: { collectionId: purchase.collectionId, bibNumber: purchase.bibNumber ?? undefined },
      });
      await sendPurchaseApprovedEmail({
        to: purchase.buyerEmail,
        buyerName: purchase.buyerName,
        bibNumber: purchase.bibNumber,
        collectionTitle: purchase.collection.title,
        downloadToken: purchase.downloadToken,
        photoCount,
      });
      return { ok: true };
    }),
});
