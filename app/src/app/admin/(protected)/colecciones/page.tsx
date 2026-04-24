import Link from "next/link";
import { api } from "~/trpc/server";
import { SortableCollectionList } from "~/app/_components/admin/SortableCollectionList";

export default async function CollectionsPage() {
  const collections = await api.collection.adminList();

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mb-2">
            {collections.length} evento{collections.length !== 1 ? "s" : ""}
          </p>
          <h1
            className="font-display italic font-light leading-[0.92] tracking-[-0.03em]"
            style={{ fontSize: "clamp(36px, 5vw, 72px)" }}
          >
            Eventos.
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <p className="hidden md:block font-mono text-[9px] uppercase tracking-[0.18em] text-[color:var(--color-grey-400)]">
            Arrastrá para reordenar
          </p>
          <Link
            href="/admin/colecciones/nueva"
            className="group inline-flex items-center gap-3 px-5 py-3 bg-[color:var(--color-ink)] text-[color:var(--color-paper)] hover:bg-[color:var(--color-grey-900)] transition-colors"
          >
            <span className="font-mono text-[11px] uppercase tracking-[0.18em]">Nuevo evento</span>
            <span className="font-mono text-[11px] transition-transform group-hover:translate-x-0.5">+</span>
          </Link>
        </div>
      </div>

      {collections.length === 0 ? (
        <div className="border border-dashed border-[color:var(--color-grey-300)] py-24 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mb-3">
            Estado
          </p>
          <p className="font-display italic text-[44px] leading-tight text-[color:var(--color-ink)]">
            Sin eventos.
          </p>
          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mb-8">
            Creá tu primer evento para empezar a vender fotos
          </p>
          <Link
            href="/admin/colecciones/nueva"
            className="inline-flex items-center gap-3 px-6 py-3 border border-[color:var(--color-ink)] font-mono text-[11px] uppercase tracking-[0.18em] hover:bg-[color:var(--color-ink)] hover:text-[color:var(--color-paper)] transition-colors"
          >
            Crear primer evento →
          </Link>
        </div>
      ) : (
        <SortableCollectionList
          initialCollections={collections.map((c) => ({
            id: c.id,
            title: c.title,
            slug: c.slug,
            coverUrl: c.coverUrl,
            isPublished: c.isPublished,
            order: c.order,
            _count: c._count,
          }))}
        />
      )}
    </div>
  );
}
