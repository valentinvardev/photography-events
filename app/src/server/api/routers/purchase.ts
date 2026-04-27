import { MercadoPagoConfig, Preference } from "mercadopago";
import { z } from "zod";
import { env } from "~/env";
import { sendPurchaseApprovedEmail } from "~/lib/email";
import { createSignedUrl } from "~/lib/supabase/admin";
import { createS3DownloadUrl, isS3Key } from "~/lib/s3";
import { parseTiers, calcEffectivePricePerPhoto } from "~/lib/pricing";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { db as dbInstance } from "~/server/db";

function parsePhotoIds(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

const getMp = async (db: typeof dbInstance) => {
  const setting = await db.setting.findUnique({ where: { key: "mp_access_token" } });
  const token = setting?.value ?? env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new Error("MercadoPago no está conectado. Configuralo en /admin/configuracion.");
  return new MercadoPagoConfig({ accessToken: token });
};

export const purchaseRouter = createTRPCRouter({
  // ─── Public ────────────────────────────────────────────────────────────────

  createPreference: publicProcedure
    .input(
      z.object({
        collectionId: z.string(),
        photoIds: z.array(z.string()).min(1),
        buyerEmail: z.string().email(),
        buyerName: z.string().optional(),
        buyerLastName: z.string().optional(),
        buyerPhone: z.string().optional(),
        packMode: z.boolean().optional(),
        totalPhotosInSearch: z.number().int().min(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const collection = await ctx.db.collection.findFirstOrThrow({
        where: { id: input.collectionId, isPublished: true },
        select: { title: true, slug: true, pricePerBib: true, packPrice: true, discountTiers: true },
      });

      const photos = await ctx.db.photo.findMany({
        where: { collectionId: input.collectionId, id: { in: input.photoIds } },
        select: { id: true, price: true },
      });
      if (photos.length === 0) throw new Error("No se encontraron fotos válidas para comprar.");

      let totalAmount: number;

      if (input.packMode && collection.packPrice !== null && collection.packPrice !== undefined) {
        totalAmount = Number(collection.packPrice);
      } else {
        const tiers = parseTiers(collection.discountTiers);
        const basePrice = Number(collection.pricePerBib);
        // Tier qualification: cart quantity (photos being purchased), not search total.
        const effectiveBase = calcEffectivePricePerPhoto(photos.length, basePrice, tiers);
        totalAmount = photos.reduce((sum, p) => {
          const custom = p.price !== null ? Number(p.price) : null;
          return sum + (custom !== null && custom !== basePrice ? custom : effectiveBase);
        }, 0);
      }

      const purchase = await ctx.db.purchase.create({
        data: {
          collectionId: input.collectionId,
          bibNumber: null,
          buyerEmail: input.buyerEmail,
          buyerName: input.buyerName,
          buyerLastName: input.buyerLastName,
          buyerPhone: input.buyerPhone,
          amountPaid: totalAmount,
          photoIds: JSON.stringify(input.photoIds),
        },
      });

      const preference = await new Preference(await getMp(ctx.db)).create({
        body: {
          items: [{
            id: input.collectionId,
            title: `${photos.length} foto${photos.length !== 1 ? "s" : ""} — ${collection.title}`,
            quantity: 1,
            unit_price: totalAmount,
            currency_id: "ARS",
          }],
          payer: {
            email: input.buyerEmail,
            name: input.buyerName,
            surname: input.buyerLastName,
            phone: input.buyerPhone ? { number: input.buyerPhone } : undefined,
          },
          ...(env.NEXT_PUBLIC_BASE_URL && !env.NEXT_PUBLIC_BASE_URL.includes("localhost")
            ? {
                back_urls: {
                  success: `${env.NEXT_PUBLIC_BASE_URL}/descarga/pendiente?purchase=${purchase.id}`,
                  failure: `${env.NEXT_PUBLIC_BASE_URL}/colecciones/${collection.slug}`,
                  pending: `${env.NEXT_PUBLIC_BASE_URL}/descarga/pendiente?purchase=${purchase.id}`,
                },
                auto_return: "approved" as const,
                notification_url: `${env.NEXT_PUBLIC_BASE_URL}/api/webhooks/mercadopago`,
              }
            : {}),
          external_reference: purchase.id,
        },
      });

      await ctx.db.purchase.update({
        where: { id: purchase.id },
        data: { mercadopagoPreferenceId: preference.id },
      });

      return {
        preferenceId: preference.id,
        initPoint: preference.init_point,
      };
    }),

  accessByEmail: publicProcedure
    .input(z.object({ email: z.string().email(), collectionId: z.string(), bibNumber: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const purchase = await ctx.db.purchase.findFirst({
        where: {
          buyerEmail: { equals: input.email, mode: "insensitive" },
          collectionId: input.collectionId,
          bibNumber: input.bibNumber,
          status: "APPROVED",
          downloadToken: { not: null },
        },
        select: { downloadToken: true },
      });
      return purchase?.downloadToken ?? null;
    }),

  getDownloadInfo: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ ctx, input }) => {
      const purchase = await ctx.db.purchase.findUnique({
        where: { downloadToken: input.token },
        include: {
          collection: { select: { title: true } },
        },
      });

      if (!purchase) return null;
      if (purchase.status !== "APPROVED") return null;

      const purchasedIds = parsePhotoIds(purchase.photoIds);
      const photos = await ctx.db.photo.findMany({
        where: purchasedIds.length > 0
          ? { id: { in: purchasedIds } }
          : {
              // Legacy fallback for purchases created before photoIds was tracked
              collectionId: purchase.collectionId,
              bibNumber: purchase.bibNumber ?? undefined,
            },
        orderBy: { order: "asc" },
      });

      const photoUrls = await Promise.all(
        photos.map(async (photo) => {
          const url = isS3Key(photo.storageKey)
            ? await createS3DownloadUrl(photo.storageKey, 3600 * 24)
            : await createSignedUrl(photo.storageKey, 3600 * 24);
          return { id: photo.id, filename: photo.filename, url };
        }),
      );

      const suggestions = purchase.bibNumber
        ? await ctx.db.collection.findMany({
            where: {
              isPublished: true,
              id: { not: purchase.collectionId },
              photos: { some: { bibNumber: purchase.bibNumber } },
              purchases: {
                none: {
                  buyerEmail: purchase.buyerEmail,
                  bibNumber: purchase.bibNumber,
                  status: "APPROVED",
                },
              },
            },
            select: {
              id: true,
              slug: true,
              title: true,
              coverUrl: true,
              pricePerBib: true,
              eventDate: true,
              _count: { select: { photos: { where: { bibNumber: purchase.bibNumber } } } },
            },
          })
        : [];

      return {
        bibNumber: purchase.bibNumber,
        collectionTitle: purchase.collection.title,
        buyerName: purchase.buyerName,
        isPublic: purchase.isPublic,
        photos: photoUrls.filter((p): p is { id: string; filename: string; url: string } => p.url !== null),
        suggestions: suggestions.map((s) => ({
          id: s.id,
          slug: s.slug,
          title: s.title,
          coverUrl: s.coverUrl,
          pricePerBib: Number(s.pricePerBib),
          eventDate: s.eventDate,
          photoCount: s._count.photos,
        })),
      };
    }),

  makePublic: publicProcedure
    .input(z.object({ token: z.string(), isPublic: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const purchase = await ctx.db.purchase.findFirst({
        where: { downloadToken: input.token, status: "APPROVED" },
      });
      if (!purchase) throw new Error("Invalid token");
      await ctx.db.purchase.update({
        where: { id: purchase.id },
        data: { isPublic: input.isPublic },
      });
      return { isPublic: input.isPublic };
    }),

  // ─── Admin ─────────────────────────────────────────────────────────────────

  adminStats: protectedProcedure
    .input(z.object({ since: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const baseWhere = {
        buyerEmail: { not: "public@system" },
        ...(input.since ? { createdAt: { gte: new Date(input.since) } } : {}),
      };
      const [total, approved, pending, revenue] = await Promise.all([
        ctx.db.purchase.count({ where: baseWhere }),
        ctx.db.purchase.count({ where: { ...baseWhere, status: "APPROVED" } }),
        ctx.db.purchase.count({ where: { ...baseWhere, status: "PENDING" } }),
        ctx.db.purchase.aggregate({
          where: { ...baseWhere, status: "APPROVED" },
          _sum: { amountPaid: true },
        }),
      ]);
      return {
        total,
        approved,
        pending,
        revenue: Number(revenue._sum.amountPaid ?? 0),
      };
    }),

  adminList: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(20),
        status: z.enum(["PENDING", "APPROVED", "REJECTED", "REFUNDED"]).optional(),
        since: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where = {
        buyerEmail: { not: "public@system" },
        ...(input.status ? { status: input.status } : {}),
        ...(input.since ? { createdAt: { gte: new Date(input.since) } } : {}),
      };
      const [items, total] = await Promise.all([
        ctx.db.purchase.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
          include: { collection: { select: { title: true } } },
        }),
        ctx.db.purchase.count({ where }),
      ]);
      return { items, total, pages: Math.ceil(total / input.limit) };
    }),

  manualApprove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const token = crypto.randomUUID();
      const updated = await ctx.db.purchase.update({
        where: { id: input.id },
        data: { status: "APPROVED", downloadToken: token, downloadTokenExpires: null },
        include: { collection: { select: { title: true } } },
      });
      const purchasedIds = parsePhotoIds(updated.photoIds);
      const photoCount = purchasedIds.length > 0
        ? purchasedIds.length
        : await ctx.db.photo.count({
            where: { collectionId: updated.collectionId, bibNumber: updated.bibNumber ?? undefined },
          });
      void sendPurchaseApprovedEmail({
        to: updated.buyerEmail,
        buyerName: updated.buyerName,
        bibNumber: updated.bibNumber,
        collectionTitle: updated.collection.title,
        downloadToken: token,
        photoCount,
      });
      return updated;
    }),
});
