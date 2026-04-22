import Link from "next/link";
import { api } from "~/trpc/server";
import { CollectionActions } from "~/app/_components/admin/CollectionActions";

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
          <h1 className="font-display italic font-light leading-[0.92] tracking-[-0.03em]"
              style={{ fontSize: "clamp(36px, 5vw, 72px)" }}>
            Eventos.
          </h1>
        </div>
        <Link
          href="/admin/colecciones/nueva"
          className="group inline-flex items-center gap-3 px-5 py-3 bg-[color:var(--color-ink)] text-[color:var(--color-paper)] hover:bg-[color:var(--color-grey-900)] transition-colors"
        >
          <span className="font-mono text-[11px] uppercase tracking-[0.18em]">Nuevo evento</span>
          <span className="font-mono text-[11px] transition-transform group-hover:translate-x-0.5">+</span>
        </Link>
      </div>

      {/* Empty */}
      {collections.length === 0 && (
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
      )}

      {/* List */}
      {collections.length > 0 && (
        <div className="border border-[color:var(--color-grey-300)] divide-y divide-[color:var(--color-grey-300)]">
          {collections.map((col) => (
            <div
              key={col.id}
              className="flex items-center justify-between px-5 py-4 hover:bg-[color:var(--color-grey-100)] transition-colors"
            >
              <div className="flex items-center gap-4 min-w-0">
                {/* Cover thumbnail */}
                <div className="w-10 h-10 shrink-0 overflow-hidden bg-[color:var(--color-grey-300)]">
                  {col.coverUrl ? (
                    <img src={col.coverUrl} alt={col.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-mono text-[8px] text-[color:var(--color-grey-500)]">sin</span>
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="font-display italic text-[18px] leading-none text-[color:var(--color-ink)]">
                      {col.title}
                    </h2>
                    <span
                      className="font-mono text-[9px] uppercase tracking-[0.18em] px-1.5 py-0.5"
                      style={col.isPublished
                        ? { background: "#dcfce7", color: "#16a34a" }
                        : { background: "var(--color-grey-100)", color: "var(--color-grey-500)" }
                      }
                    >
                      {col.isPublished ? "Publicado" : "Borrador"}
                    </span>
                  </div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[color:var(--color-grey-500)] mt-1 truncate">
                    /colecciones/{col.slug} · {col._count.photos} foto{col._count.photos !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-4">
                <Link
                  href={`/colecciones/${col.slug}`}
                  target="_blank"
                  className="px-3 py-2 font-mono text-[10px] text-[color:var(--color-grey-500)] hover:text-[color:var(--color-ink)] transition-colors"
                  title="Ver en sitio público"
                >
                  ↗
                </Link>
                <Link
                  href={`/admin/colecciones/${col.id}`}
                  className="px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] border border-[color:var(--color-ink)] text-[color:var(--color-ink)] hover:bg-[color:var(--color-ink)] hover:text-[color:var(--color-paper)] transition-colors"
                >
                  Gestionar
                </Link>
                <CollectionActions id={col.id} isPublished={col.isPublished} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
