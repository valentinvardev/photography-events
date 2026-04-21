import Link from "next/link";
import { api } from "~/trpc/server";
import { CollectionActions } from "~/app/_components/admin/CollectionActions";

export default async function CollectionsPage() {
  const collections = await api.collection.adminList();

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Eventos</h1>
          <p className="text-gray-500 text-sm mt-0.5">{collections.length} evento{collections.length !== 1 ? "s" : ""} en total</p>
        </div>
        <Link
          href="/admin/colecciones/nueva"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 shadow-sm"
          style={{ background: "linear-gradient(135deg, #1a3a6b, #2563eb)" }}
        >
          <span className="text-lg leading-none">+</span>
          Crear evento
        </Link>
      </div>

      {/* Empty */}
      {collections.length === 0 && (
        <div className="rounded-2xl border border-gray-100 py-20 text-center bg-white shadow-sm">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-blue-50">
            <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-gray-900 font-medium mb-2">No hay eventos aún</p>
          <p className="text-gray-500 text-sm mb-6">Creá tu primer evento para empezar a vender fotos</p>
          <Link
            href="/admin/colecciones/nueva"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white shadow-sm"
            style={{ background: "linear-gradient(135deg, #1a3a6b, #2563eb)" }}
          >
            Crear primer evento
          </Link>
        </div>
      )}

      {/* List */}
      {collections.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {collections.map((col) => (
            <div
              key={col.id}
              className="group rounded-2xl border border-gray-100 bg-white shadow-sm px-5 py-4 flex items-center justify-between transition-all hover:shadow-md hover:border-blue-100"
            >
              <div className="flex items-center gap-4 min-w-0">
                {/* Cover thumbnail or placeholder */}
                <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-blue-50">
                  {col.coverUrl ? (
                    <img src={col.coverUrl} alt={col.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-semibold text-gray-900">{col.title}</h2>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={col.isPublished
                        ? { background: "#dcfce7", color: "#16a34a" }
                        : { background: "#f1f5f9", color: "#64748b" }
                      }
                    >
                      {col.isPublished ? "Publicado" : "Borrador"}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs mt-0.5 truncate">
                    /colecciones/{col.slug} · <span className="text-gray-500">{col._count.photos} foto{col._count.photos !== 1 ? "s" : ""}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-4">
                <Link
                  href={`/colecciones/${col.slug}`}
                  target="_blank"
                  className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-gray-700 transition-colors hover:bg-gray-50"
                  title="Ver en sitio público"
                >
                  ↗
                </Link>
                <Link
                  href={`/admin/colecciones/${col.id}`}
                  className="px-4 py-1.5 rounded-lg text-xs font-medium text-white transition-all hover:opacity-90"
                  style={{ background: "#1a3a6b" }}
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
