import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { createSignedUrl } from "~/lib/supabase/admin";

async function resolveCover(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return createSignedUrl(url, 7200);
}

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
    const cats = await ctx.db.category.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      include: { _count: { select: { collections: { where: { isPublished: true } } } } },
    });
    return Promise.all(cats.map(async (c) => ({ ...c, coverUrl: await resolveCover(c.coverUrl) })));
  }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const cat = await ctx.db.category.findUnique({
        where: { slug: input.slug },
        include: {
          collections: {
            where: { isPublished: true },
            orderBy: [{ order: "asc" }, { eventDate: "desc" }, { createdAt: "desc" }],
            include: { _count: { select: { photos: true } } },
          },
        },
      });
      if (!cat) return null;
      const cover = await resolveCover(cat.coverUrl);
      const collections = await Promise.all(
        cat.collections.map(async (c) => ({
          ...c,
          coverUrl: await resolveCover(c.coverUrl),
          bannerUrl: await resolveCover(c.bannerUrl),
          logoUrl: await resolveCover(c.logoUrl),
        })),
      );
      return { ...cat, coverUrl: cover, collections };
    }),

  adminList: protectedProcedure.query(async ({ ctx }) => {
    const cats = await ctx.db.category.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      include: { _count: { select: { collections: true } } },
    });
    return Promise.all(cats.map(async (c) => ({ ...c, coverUrl: await resolveCover(c.coverUrl) })));
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

  reorder: protectedProcedure
    .input(z.array(z.object({ id: z.string(), order: z.number().int() })))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.$transaction(
        input.map(({ id, order }) => ctx.db.category.update({ where: { id }, data: { order } })),
      );
    }),
});
