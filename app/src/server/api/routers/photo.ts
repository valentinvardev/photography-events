import path from "path";
import { z } from "zod";
import { getAdminClient, createSignedUrl } from "~/lib/supabase/admin";
import {
  createS3UploadUrl,
  createS3DownloadUrl,
  deleteS3Objects,
  isS3Key,
} from "~/lib/s3";
import { isVideoMimeType } from "~/lib/video-utils";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

const STORAGE_LIMIT_BYTES = 100 * 1024 * 1024 * 1024; // 100 GB

const ACCEPTED_CONTENT_TYPES = z.string().refine(
  (t) => t.startsWith("image/") || t.startsWith("video/"),
  { message: "Solo se aceptan imágenes y videos" },
);

export const photoRouter = createTRPCRouter({
  // ─── Public ────────────────────────────────────────────────────────────────

  listAll: publicProcedure
    .input(z.object({ collectionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const photos = await ctx.db.photo.findMany({
        where: { collectionId: input.collectionId },
        orderBy: { order: "asc" },
        select: { id: true, bibNumber: true, price: true, mimeType: true, filename: true },
      });
      const norm = (p: (typeof photos)[number]) => ({
        ...p,
        price: p.price !== null ? Number(p.price) : null,
      });
      return [
        ...photos.filter((p) => !p.bibNumber).map(norm),
        ...photos.filter((p) => !!p.bibNumber).map(norm),
      ];
    }),

  searchByBib: publicProcedure
    .input(
      z.object({
        collectionId: z.string(),
        bib: z.string().min(1).max(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const q = input.bib.trim();

      const select = {
        id: true,
        bibNumber: true,
        price: true,
        mimeType: true,
        filename: true,
        storageKey: true,
        previewKey: true,
      } as const;

      const exact = await ctx.db.photo.findMany({
        where: {
          collectionId: input.collectionId,
          bibNumber: { contains: q, mode: "insensitive" },
        },
        orderBy: { order: "asc" },
        select,
      });

      let fuzzy: typeof exact = [];
      if (/^\d{3,4}$/.test(q)) {
        const candidates = await ctx.db.photo.findMany({
          where: {
            collectionId: input.collectionId,
            bibNumber: { not: null },
            AND: [{ bibNumber: { not: q } }],
          },
          select,
        });
        fuzzy = candidates.filter((p) => {
          const n = p.bibNumber?.trim() ?? "";
          if (n.length !== q.length) return false;
          let diffs = 0;
          for (let i = 0; i < q.length; i++) {
            if (n[i] !== q[i]) diffs++;
          }
          return diffs === 1;
        });
      }

      const normPrice = (p: (typeof exact)[number]) => ({
        ...p,
        price: p.price !== null ? Number(p.price) : null,
      });

      const groupByBib = (photos: typeof exact) => {
        const map = new Map<string, typeof exact>();
        for (const p of photos) {
          const key = p.bibNumber ?? "?";
          if (!map.has(key)) map.set(key, []);
          map.get(key)!.push(p);
        }
        return Array.from(map.entries()).map(([bib, photos]) => ({
          bib,
          photos: photos.map(normPrice),
        }));
      };

      return { exact: groupByBib(exact), fuzzy: groupByBib(fuzzy) };
    }),

  /** Returns signed preview URLs + mimeType for a list of photo IDs. */
  getPreviewUrls: publicProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .query(async ({ ctx, input }) => {
      const photos = await ctx.db.photo.findMany({
        where: { id: { in: input.ids } },
        select: { id: true, storageKey: true, previewKey: true, mimeType: true, filename: true },
      });
      const results = await Promise.all(
        photos.map(async (p) => {
          const key = p.previewKey ?? p.storageKey;
          const url = isS3Key(key)
            ? await createS3DownloadUrl(key, 3600)
            : await createSignedUrl(key, 3600);
          return { id: p.id, url, mimeType: p.mimeType, filename: p.filename };
        }),
      );
      return results.filter(
        (r): r is { id: string; url: string; mimeType: string | null; filename: string } =>
          r.url !== null,
      );
    }),

  // ─── Admin ─────────────────────────────────────────────────────────────────

  /** S3 presigned PUT URL — accepts both images and videos. */
  getS3UploadUrl: protectedProcedure
    .input(
      z.object({
        collectionId: z.string(),
        filename: z.string(),
        contentType: ACCEPTED_CONTENT_TYPES,
      }),
    )
    .mutation(async ({ input }) => {
      const ext = path.extname(input.filename).toLowerCase() || ".jpg";
      const key = `uploads/${input.collectionId}/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
      const url = await createS3UploadUrl(key, input.contentType);
      return { uploadUrl: url, key };
    }),

  /** Register uploaded files in DB and kick off background processing. */
  bulkAdd: protectedProcedure
    .input(
      z.object({
        collectionId: z.string(),
        photos: z.array(
          z.object({
            storageKey: z.string(),
            filename: z.string(),
            mimeType: z.string().optional(),
            bibNumber: z.string().optional(),
            fileSize: z.number().optional(),
            width: z.number().optional(),
            height: z.number().optional(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const count = await ctx.db.photo.count({ where: { collectionId: input.collectionId } });
      const created = await Promise.all(
        input.photos.map((p, i) =>
          ctx.db.photo.create({
            data: {
              collectionId: input.collectionId,
              storageKey: p.storageKey,
              filename: p.filename,
              mimeType: p.mimeType ?? null,
              bibNumber: p.bibNumber ?? null,
              fileSize: p.fileSize,
              width: p.width,
              height: p.height,
              order: count + i,
            },
            select: { id: true, mimeType: true },
          }),
        ),
      );

      const ids = created.map((c) => ({ id: c.id, isVideo: isVideoMimeType(c.mimeType) }));

      void (async () => {
        const { runOcr, runWatermark, runFaceIndex } = await import("~/lib/photo-processing");
        const { runVideoWatermark } = await import("~/lib/video-processing");
        for (let i = 0; i < ids.length; i++) {
          const { id: photoId, isVideo } = ids[i]!;
          await new Promise((r) => setTimeout(r, i * 400));
          if (isVideo) {
            void runVideoWatermark(photoId);
          } else {
            void runOcr(photoId);
            void runWatermark(photoId);
            void runFaceIndex(photoId, input.collectionId);
          }
        }
      })();

      return { ids: ids.map((x) => x.id) };
    }),

  getStorageUsage: protectedProcedure.query(async ({ ctx }) => {
    const result = await ctx.db.photo.aggregate({ _sum: { fileSize: true } });
    return {
      usedBytes: Number(result._sum.fileSize ?? 0),
      limitBytes: STORAGE_LIMIT_BYTES,
    };
  }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const photo = await ctx.db.photo.findUniqueOrThrow({ where: { id: input.id } });

      const s3Keys: string[] = [];
      const supabaseKeys: string[] = [];
      for (const k of [photo.storageKey, photo.previewKey].filter(Boolean) as string[]) {
        if (isS3Key(k)) s3Keys.push(k);
        else if (!k.startsWith("http")) supabaseKeys.push(k);
      }

      if (s3Keys.length) await deleteS3Objects(s3Keys);
      if (supabaseKeys.length) {
        const client = getAdminClient();
        if (client) await client.storage.from("photos").remove(supabaseKeys);
      }

      return ctx.db.photo.delete({ where: { id: input.id } });
    }),

  bulkDelete: protectedProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const photos = await ctx.db.photo.findMany({ where: { id: { in: input.ids } } });

      const s3Keys: string[] = [];
      const supabaseKeys: string[] = [];
      for (const p of photos) {
        for (const k of [p.storageKey, p.previewKey].filter(Boolean) as string[]) {
          if (isS3Key(k)) s3Keys.push(k);
          else if (!k.startsWith("http")) supabaseKeys.push(k);
        }
      }

      if (s3Keys.length) await deleteS3Objects(s3Keys);
      if (supabaseKeys.length) {
        const client = getAdminClient();
        if (client) await client.storage.from("photos").remove(supabaseKeys);
      }

      await ctx.db.photo.deleteMany({ where: { id: { in: input.ids } } });
    }),

  listUnwatermarked: protectedProcedure
    .input(z.object({ collectionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const photos = await ctx.db.photo.findMany({
        where: { collectionId: input.collectionId, previewKey: null },
        select: { id: true },
        orderBy: { order: "asc" },
      });
      return photos.map((p) => p.id);
    }),

  setBibNumber: protectedProcedure
    .input(z.object({ id: z.string(), bibNumber: z.string().nullable() }))
    .mutation(({ ctx, input }) =>
      ctx.db.photo.update({ where: { id: input.id }, data: { bibNumber: input.bibNumber } }),
    ),

  setPrice: protectedProcedure
    .input(z.object({ id: z.string(), price: z.number().positive().nullable() }))
    .mutation(({ ctx, input }) =>
      ctx.db.photo.update({ where: { id: input.id }, data: { price: input.price } }),
    ),
});
