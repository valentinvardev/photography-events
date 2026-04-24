import { z } from "zod";
import { Prisma } from "../../../../generated/prisma";
import { createSignedUrl } from "~/lib/supabase/admin";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

async function resolveUrl(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return createSignedUrl(url, 7200);
}

const resolveCover = resolveUrl;

export const collectionRouter = createTRPCRouter({
  // ─── Public ────────────────────────────────────────────────────────────────

  list: publicProcedure.query(async ({ ctx }) => {
    const cols = await ctx.db.collection.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { photos: true } } },
    });
    return Promise.all(
      cols.map(async (c) => ({
        ...c,
        coverUrl: await resolveCover(c.coverUrl),
        logoUrl: await resolveUrl(c.logoUrl),
        bannerUrl: await resolveUrl(c.bannerUrl),
        bannerFocalY: c.bannerFocalY ?? 0.5,
      })),
    );
  }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const col = await ctx.db.collection.findFirst({
        where: { slug: input.slug, isPublished: true },
        include: { _count: { select: { photos: true } } },
      });
      if (!col) return null;
      return {
        ...col,
        coverUrl: await resolveCover(col.coverUrl),
        logoUrl: await resolveUrl(col.logoUrl),
        bannerUrl: await resolveUrl(col.bannerUrl),
      };
    }),

  getPrice: publicProcedure
    .input(z.object({ collectionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const col = await ctx.db.collection.findFirst({
        where: { id: input.collectionId, isPublished: true },
        select: { pricePerBib: true, title: true, packPrice: true, discountTiers: true },
      });
      if (!col) return null;
      return {
        price: Number(col.pricePerBib),
        title: col.title,
        packPrice: col.packPrice !== null && col.packPrice !== undefined ? Number(col.packPrice) : null,
        discountTiers: col.discountTiers,
      };
    }),

  // ─── Admin ─────────────────────────────────────────────────────────────────

  adminList: protectedProcedure.query(async ({ ctx }) => {
    const cols = await ctx.db.collection.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { photos: true } } },
    });
    return Promise.all(
      cols.map(async (c) => ({
        ...c,
        coverUrl: await resolveCover(c.coverUrl),
        logoUrl: await resolveUrl(c.logoUrl),
        bannerUrl: await resolveUrl(c.bannerUrl),
        bannerFocalY: c.bannerFocalY ?? 0.5,
      })),
    );
  }),

  adminGetById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const col = await ctx.db.collection.findUnique({
        where: { id: input.id },
        include: {
          _count: { select: { photos: true } },
        },
      });
      if (!col) return null;
      return {
        ...col,
        coverUrl: await resolveCover(col.coverUrl),
        logoUrl: await resolveUrl(col.logoUrl),
        bannerUrl: await resolveUrl(col.bannerUrl),
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
        coverUrl: z.string().optional(),
        logoUrl: z.string().optional(),
        bannerUrl: z.string().optional(),
        bannerFocalY: z.number().min(0).max(1).optional(),
        pricePerBib: z.number().min(0).optional(),
        packPrice: z.number().min(0).optional().nullable(),
        discountTiers: z.array(z.object({ minQty: z.number().int().positive(), priceEach: z.number().min(0) })).optional().nullable(),
        isPublished: z.boolean().optional(),
        eventDate: z.string().optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      const { eventDate, discountTiers, ...rest } = input;
      return ctx.db.collection.create({
        data: {
          ...rest,
          eventDate: eventDate ? new Date(eventDate) : undefined,
          discountTiers: discountTiers === null ? Prisma.DbNull : discountTiers ?? undefined,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
        coverUrl: z.string().optional().nullable(),
        logoUrl: z.string().optional().nullable(),
        bannerUrl: z.string().optional().nullable(),
        bannerFocalY: z.number().min(0).max(1).optional(),
        pricePerBib: z.number().min(0).optional(),
        packPrice: z.number().min(0).optional().nullable(),
        discountTiers: z.array(z.object({ minQty: z.number().int().positive(), priceEach: z.number().min(0) })).optional().nullable(),
        isPublished: z.boolean().optional(),
        eventDate: z.string().optional().nullable(),
        categoryId: z.string().optional().nullable(),
      }),
    )
    .mutation(({ ctx, input }) => {
      const { id, eventDate, discountTiers, ...rest } = input;
      return ctx.db.collection.update({
        where: { id },
        data: {
          ...rest,
          ...(eventDate !== undefined
            ? { eventDate: eventDate ? new Date(eventDate) : null }
            : {}),
          ...(discountTiers !== undefined
            ? { discountTiers: discountTiers === null ? Prisma.DbNull : discountTiers }
            : {}),
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id } = input;
      await ctx.db.purchase.deleteMany({ where: { collectionId: id } });
      await ctx.db.photo.deleteMany({ where: { collectionId: id } });
      return ctx.db.collection.delete({ where: { id } });
    }),

  togglePublish: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const current = await ctx.db.collection.findUniqueOrThrow({
        where: { id: input.id },
        select: { isPublished: true },
      });
      return ctx.db.collection.update({
        where: { id: input.id },
        data: { isPublished: !current.isPublished },
      });
    }),
});
