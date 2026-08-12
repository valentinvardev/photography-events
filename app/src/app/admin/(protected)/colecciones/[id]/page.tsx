import { notFound } from "next/navigation";
import Link from "next/link";
import { api } from "~/trpc/server";
import { PhotoUploader } from "~/app/_components/admin/PhotoUploader";
import { PhotoManager } from "~/app/_components/admin/PhotoManager";
import { CollectionActions } from "~/app/_components/admin/CollectionActions";
import { FaceReindexButton } from "~/app/_components/admin/FaceReindexButton";
import { WatermarkAllButton } from "~/app/_components/admin/WatermarkAllButton";
import { PricingPanel } from "~/app/_components/admin/PricingPanel";
import { CollectionMetaPanel } from "~/app/_components/admin/CollectionMetaPanel";
import { CategoryAssign } from "~/app/_components/admin/CategoryAssign";
import { BannerEditor } from "~/app/_components/admin/BannerEditor";
import { SearchSettings } from "~/app/_components/admin/SearchSettings";
import { parseTiers } from "~/lib/pricing";
import { createSignedUrl } from "~/lib/supabase/admin";
import { isS3Key } from "~/lib/s3";
import { resolveMediaUrl } from "~/lib/media";

const PAGE_SIZE = 48;

export default async function EditCollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; q?: string; sort?: string }>;
}) {
  const { id } = await params;
  const { page: pageParam, q, sort } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const [collection, allCategories] = await Promise.all([
    api.collection.adminGetById({ id }),
    api.category.adminList(),
  ]);
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
      orderBy: sort === "newest"
        ? [{ createdAt: "asc" }, { order: "asc" }]
        : sort === "oldest"
        ? [{ createdAt: "desc" }, { order: "desc" }]
        : [{ bibNumber: { sort: "asc", nulls: "first" } }, { order: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id: true, filename: true, bibNumber: true, storageKey: true, previewKey: true, price: true, mimeType: true },
    }),
  ]);

  const photos = await Promise.all(
    rawPhotos.map(async (p) => {
      const isVideo = /\.(mp4|mov|webm|mkv|m4v)$/i.test(p.filename) || !!p.mimeType?.startsWith("video/");
      const key = isVideo && p.previewKey ? p.previewKey : p.storageKey;
      const ct = isVideo && p.previewKey ? "video/mp4" : (p.mimeType ?? (isVideo ? "video/mp4" : undefined));
      const url = key.startsWith("http")
        ? key
        : isS3Key(key)
        ? await resolveMediaUrl(key, { contentType: ct })
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

        {/* Reindex + Watermark */}
        <div className="px-6 py-4 border-t border-[color:var(--color-grey-300)] flex items-center gap-6 flex-wrap">
          <FaceReindexButton collectionId={collection.id} />
          <WatermarkAllButton collectionId={collection.id} />
        </div>
      </div>

      {/* Metadata panel */}
      <div className="border border-[color:var(--color-grey-300)] bg-[color:var(--color-paper)] p-6 mb-px">
        <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mb-5">
          Datos del evento
        </p>
        <CollectionMetaPanel
          collectionId={id}
          initialTitle={collection.title}
          initialDescription={collection.description}
          initialSlug={collection.slug}
          initialEventDate={collection.eventDate ? new Date(collection.eventDate) : null}
        />
      </div>

      {/* Upload takes half; the two one-control settings share the rest.
          Pricing gets its own full-width row below — four equal columns left it
          squeezing three inputs per tier into ~250px. */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-px border border-[color:var(--color-grey-300)] bg-[color:var(--color-grey-300)] mb-px">
        <div className="lg:col-span-6 bg-[color:var(--color-paper)] p-6">
          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mb-5">
            Subir fotos
          </p>
          <PhotoUploader collectionId={id} bibSearchEnabled={collection.bibSearchEnabled} />
        </div>
        <div className="lg:col-span-3 bg-[color:var(--color-paper)] p-6">
          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mb-5">
            Categoría
          </p>
          <CategoryAssign
            collectionId={id}
            initialCategoryId={collection.categoryId ?? null}
            categories={allCategories.map((c) => ({ id: c.id, name: c.name }))}
          />
        </div>
        <div className="lg:col-span-3 bg-[color:var(--color-paper)] p-6">
          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mb-5">
            Búsqueda
          </p>
          <SearchSettings
            collectionId={id}
            initialBibSearchEnabled={collection.bibSearchEnabled ?? true}
          />
        </div>
      </div>

      {/* Pricing — full width: base, pack and the discount tiers side by side */}
      <div className="border border-[color:var(--color-grey-300)] bg-[color:var(--color-paper)] p-6 mb-px">
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

      {/* Apariencia — banner / logo */}
      <div className="grid grid-cols-1 gap-px border border-[color:var(--color-grey-300)] bg-[color:var(--color-grey-300)] mb-px">
        <div className="bg-[color:var(--color-paper)] p-6">
          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mb-5">
            Apariencia
          </p>
          <BannerEditor
            collectionId={id}
            initialBannerUrl={collection.bannerUrl ?? null}
            initialBannerKey={collection.bannerUrlRaw ?? null}
            initialLogoUrl={collection.logoUrl ?? null}
            initialLogoKey={collection.logoUrlRaw ?? null}
            initialFocalY={collection.bannerFocalY ?? 0.5}
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
            sort={sort ?? ""}
          />
        </div>
      </div>
    </div>
  );
}
