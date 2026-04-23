import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

const PERIODS = {
  "1h":  60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "7d":  7  * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
  "90d": 90 * 24 * 60 * 60 * 1000,
} as const;

export const analyticsRouter = createTRPCRouter({
  adminStats: protectedProcedure
    .input(z.object({ since: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const since = input.since
        ? new Date(input.since)
        : new Date(Date.now() - PERIODS["24h"]);
      const where = { createdAt: { gte: since } };

      const [visits, searchBib, searchFace, cartAdds] = await Promise.all([
        ctx.db.analyticsEvent.count({ where: { ...where, type: "VISIT" } }),
        ctx.db.analyticsEvent.count({ where: { ...where, type: "SEARCH_BIB" } }),
        ctx.db.analyticsEvent.count({ where: { ...where, type: "SEARCH_FACE" } }),
        ctx.db.analyticsEvent.count({ where: { ...where, type: "CART_ADD" } }),
      ]);

      return { visits, searchBib, searchFace, cartAdds };
    }),
});
