import { notFound } from "next/navigation";
import Link from "next/link";
import { api } from "~/trpc/server";
import { PhotoUploader } from "~/app/_components/admin/PhotoUploader";
import { PhotoManager } from "~/app/_components/admin/PhotoManager";
import { CollectionActions } from "~/app/_components/admin/CollectionActions";
import { FaceReindexButton } from "~/app/_components/admin/FaceReindexButton";
import { PricingPanel } from "~/app/_components/admin/PricingPanel";
import { parseTiers } from "~/lib/pricing";
import { createSignedUrl } from "~/lib/supabase/admin";
import { createS3DownloadUrl, isS3Key } from "~/lib/s3";

const PAGE_SIZE = 48;

export default async function EditCollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { id } = await params;
  const { page: pageParam, q } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const collection = await api.collection.adminGetById({ id });
  if (!collection) notFound();

  const { db } = await import("~/server/db");

  const where = {
    collectionId: id,
    ...(q ? { bibNumber: { contains: q } } : {}),
  };

  const [totalCount, unidentifiedCount, rawPhotos] = await Promise.all([
    db.photo.count({ where: { collectionId: id } }),
    db.photo.count({ where: { collectionId: id, bibNumber: null } }),
    db.photo.findMany({
      where,
      orderBy: [{ bibNumber: "asc" }, { order: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id: true, filename: true, bibNumber: true, storageKey: true, previewKey: true, price: true, mimeType: true },
    }),
  ]);

  const photos = await Promise.all(
    rawPhotos.map(async (p) => {
      const isVideo = /\.(mp4|mov|webm|mkv|m4v)$/i.test(p.filename) || !!p.mimeType?.startsWith("video/");
      const key = isVideo && p.previewKey ? p.previewKey : p.storageKey;
      const ct = p.mimeType ?? (isVideo ? "video/mp4" : undefined);
      const url = key.startsWith("http")
        ? key
        : isS3Key(key)
        ? await createS3DownloadUrl(key, 3600, ct)
        : await createSignedUrl(key, 3600);
      return { ...p, price: p.price !== null ? Number(p.price) : null, url };
    }),
  );

  const filteredTotal = q ? await db.photo.count({ where }) : totalCount;
  const totalPages = Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE));

  const eventDate = collection.eventDate
    ? new Date(collection.eventDate).toLocaleDateString("es-AR", {
        day: "numeric", month: "long", year: "numeric",
      })
    : null;

  return (
    <div>
      {/* Back */}
      <Link
        href="/admin/colecciones"
        className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-grey-500)] hover:text-[color:var(--color-ink)] transition-colors mb-8"
      >
        ← Eventos
      </Link>

      {/* Event header */}
      <div className="border border-[color:var(--color-grey-300)] mb-6">
        <div className="p-6 flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-5 min-w-0">
            {collection.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={collection.coverUrl}
                alt={collection.title}
                className="w-16 h-16 object-cover shrink-0"
              />
            ) : (
              <div className="w-16 h-16 bg-[color:var(--color-grey-100)] border border-[color:var(--color-grey-200)] flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-[color:var(--color-grey-300)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                </svg>
              </div>
            )}
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mb-1">
                Evento
              </p>
              <h1 className="font-display italic font-light text-[28px] leading-none tracking-[-0.02em] text-[color:var(--color-ink)]">
                {collection.title}
              </h1>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {eventDate && (
                  <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[color:var(--color-grey-500)]">
                    {eventDate}
                  </span>
                )}
                <span className="font-mono text-[9px] text-[color:var(--color-grey-400)]">
                  /colecciones/{collection.slug}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <Link
              href={`/colecciones/${collection.slug}`}
              target="_blank"
              className="px-3 py-1.5 border border-[color:var(--color-grey-300)] font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-grey-600)] hover:border-[color:var(--color-ink)] hover:text-[color:var(--color-ink)] transition-colors"
            >
              ↗ Ver público
            </Link>
            <CollectionActions id={collection.id} isPublished={collection.isPublished} />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-px border-t border-[color:var(--color-grey-300)] bg-[color:var(--color-grey-300)]">
          {[
            { label: "Fotos totales", value: totalCount, color: undefined },
            {
              label: "Sin dorsal",
              value: unidentifiedCount,
              color: unidentifiedCount > 0 ? "#92400e" : "#16a34a",
            },
            {
              label: "Precio ARS",
              value: `$${Number(collection.pricePerBib ?? 0).toLocaleString("es-AR")}`,
              color: undefined,
            },
          ].map((c, i) => (
            <div key={i} className="bg-[color:var(--color-paper)] px-5 py-4 text-center">
              <p className="font-display italic font-light text-[32px] leading-none" style={{ color: c.color ?? "var(--color-ink)" }}>
                {c.value}
              </p>
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[color:var(--color-grey-500)] mt-1">
                {c.label}
              </p>
            </div>
          ))}
        </div>

        {/* Reindex */}
        <div className="px-6 py-4 border-t border-[color:var(--color-grey-300)]">
          <FaceReindexButton collectionId={collection.id} totalPhotos={totalCount} />
        </div>
      </div>

      {/* Three-column layout: upload / pricing / gallery */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-px border border-[color:var(--color-grey-300)] bg-[color:var(--color-grey-300)] mb-px">
        <div className="bg-[color:var(--color-paper)] p-6">
          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mb-5">
            Subir fotos
          </p>
          <PhotoUploader collectionId={id} />
        </div>
        <div className="bg-[color:var(--color-paper)] p-6">
          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mb-5">
            Precios
          </p>
          <PricingPanel
            collectionId={id}
            initialPricePerBib={Number(collection.pricePerBib ?? 0)}
            initialPackPrice={collection.packPrice !== null && collection.packPrice !== undefined ? Number(collection.packPrice) : null}
            initialTiers={parseTiers(collection.discountTiers)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-px border border-[color:var(--color-grey-300)] bg-[color:var(--color-grey-300)]">
        <div className="bg-[color:var(--color-paper)] p-6">
          <div className="flex items-center gap-3 mb-5">
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)]">
              Galería
            </p>
            {unidentifiedCount > 0 && (
              <span className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-[#92400e]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#92400e]" />
                {unidentifiedCount} sin dorsal
              </span>
            )}
          </div>
          <PhotoManager
            collectionId={id}
            photos={photos}
            page={page}
            totalPages={totalPages}
            totalCount={filteredTotal}
            q={q ?? ""}
          />
        </div>
      </div>
    </div>
  );
}
