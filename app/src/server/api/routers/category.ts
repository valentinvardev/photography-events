import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

const categoryInput = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional().nullable(),
  coverUrl: z.string().optional().nullable(),
  buttonText: z.string().optional().nullable(),
  buttonHref: z.string().optional().nullable(),
  order: z.number().int().optional(),
});

export const categoryRouter = createTRPCRouter({
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.category.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      include: { _count: { select: { collections: { where: { isPublished: true } } } } },
    });
  }),

  adminList: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.category.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      include: { _count: { select: { collections: true } } },
    });
  }),

  create: protectedProcedure.input(categoryInput).mutation(async ({ ctx, input }) => {
    return ctx.db.category.create({ data: input });
  }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), data: categoryInput.partial() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.category.update({ where: { id: input.id }, data: input.data });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.category.delete({ where: { id: input.id } });
    }),
});
