"use client";

import { useState } from "react";
import { api, type RouterOutputs } from "~/trpc/react";

type FaceRow = RouterOutputs["face"]["list"]["items"][number];
type Collection = { id: string; title: string; slug: string };

export function FaceDatabasePage({ collections }: { collections: Collection[] }) {
  const [collectionId, setCollectionId] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);

  const { data: stats } = api.face.stats.useQuery();
  const { data, isLoading, refetch } = api.face.list.useQuery(
    { collectionId, page, limit: 60 },
    { placeholderData: (prev) => prev },
  );

  const deleteMut = api.face.delete.useMutation({
    onSuccess: () => void refetch(),
  });

  const handleCollectionChange = (id: string | undefined) => {
    setCollectionId(id);
    setPage(1);
  };

  const totalPages = data ? Math.ceil(data.total / 60) : 1;

  return (
    <div>
      <div className="mb-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mb-2">
          Amazon Rekognition
        </p>
        <h1
          className="font-display italic font-light leading-[0.92] tracking-[-0.03em]"
          style={{ fontSize: "clamp(36px, 5vw, 72px)" }}
        >
          Reconocimiento.
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-px border border-[color:var(--color-grey-300)] bg-[color:var(--color-grey-300)] mb-8">
        {[
          { label: "Rostros indexados", value: stats?.totalFaces ?? "—" },
          { label: "Eventos con índice", value: stats?.totalCollections ?? "—" },
          { label: "Registros en vista", value: data?.total ?? "—" },
        ].map((c, i) => (
          <div key={i} className="bg-[color:var(--color-paper)] px-5 py-5">
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mb-3">
              {c.label}
            </p>
            <p className="font-display italic font-light text-[40px] leading-none text-[color:var(--color-ink)]">
              {c.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="border border-[color:var(--color-grey-300)] px-5 py-4 mb-4 flex flex-wrap gap-2 items-center">
        <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mr-2">
          Filtrar
        </span>
        <button
          onClick={() => handleCollectionChange(undefined)}
          className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors border ${
            !collectionId
              ? "bg-[color:var(--color-ink)] text-[color:var(--color-paper)] border-[color:var(--color-ink)]"
              : "border-[color:var(--color-grey-300)] text-[color:var(--color-grey-700)] hover:border-[color:var(--color-ink)] hover:text-[color:var(--color-ink)]"
          }`}
        >
          Todos
        </button>
        {collections.map((c) => (
          <button
            key={c.id}
            onClick={() => handleCollectionChange(c.id)}
            className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors border ${
              collectionId === c.id
                ? "bg-[color:var(--color-ink)] text-[color:var(--color-paper)] border-[color:var(--color-ink)]"
                : "border-[color:var(--color-grey-300)] text-[color:var(--color-grey-700)] hover:border-[color:var(--color-ink)] hover:text-[color:var(--color-ink)]"
            }`}
          >
            {c.title}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="border border-[color:var(--color-grey-300)]">
        {isLoading ? (
          <div className="py-16 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)]">
              Cargando registros…
            </p>
          </div>
        ) : !data?.items.length ? (
          <div className="py-16 text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)]">
              Sin rostros indexados
            </p>
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[color:var(--color-grey-400)] mt-2">
              Se generan al subir fotos o al usar Re-indexar en un evento
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[color:var(--color-grey-300)]">
                  {["Face ID", "Dorsal", "Evento", "Confianza", "Compra", "Fecha", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.items.map((row: FaceRow, i) => (
                  <tr
                    key={row.id}
                    className={`hover:bg-[color:var(--color-grey-100)] transition-colors ${
                      i < data.items.length - 1 ? "border-b border-[color:var(--color-grey-100)]" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-[10px] text-[color:var(--color-grey-500)] bg-[color:var(--color-grey-100)] px-2 py-0.5">
                        {row.rekFaceId.slice(-10)}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-mono text-[12px] font-bold text-[color:var(--color-ink)]">
                      {row.photo.bibNumber ? `#${row.photo.bibNumber}` : (
                        <span className="font-normal text-[color:var(--color-grey-400)]">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <a
                        href={`/admin/colecciones/${row.collection.id}`}
                        className="font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-ink)] hover:underline underline-offset-4"
                      >
                        {row.collection.title}
                      </a>
                    </td>

                    <td className="px-4 py-3">
                      {row.confidence != null ? (
                        <div className="flex items-center gap-2">
                          <div className="w-14 h-px bg-[color:var(--color-grey-300)] relative">
                            <div
                              className="absolute inset-y-0 left-0 h-full"
                              style={{
                                width: `${row.confidence}%`,
                                height: 3,
                                top: -1,
                                background: row.confidence > 90 ? "#16a34a" : row.confidence > 70 ? "#92400e" : "var(--color-safelight)",
                              }}
                            />
                          </div>
                          <span className="font-mono text-[10px] text-[color:var(--color-grey-500)]">
                            {row.confidence.toFixed(0)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-[color:var(--color-grey-400)]">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {row.purchase ? (
                        <div>
                          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#16a34a]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
                            Comprado
                          </span>
                          <p className="font-mono text-[9px] text-[color:var(--color-grey-500)] mt-0.5 truncate max-w-[140px]">
                            {row.purchase.buyerEmail}
                          </p>
                        </div>
                      ) : (
                        <span className="font-mono text-[10px] text-[color:var(--color-grey-400)]">Sin compra</span>
                      )}
                    </td>

                    <td className="px-4 py-3 font-mono text-[10px] text-[color:var(--color-grey-500)]">
                      {new Date(row.createdAt).toLocaleDateString("es-AR", {
                        day: "2-digit", month: "2-digit", year: "2-digit",
                      })}
                    </td>

                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          if (confirm("¿Eliminar este registro facial?")) {
                            deleteMut.mutate({ id: row.id });
                          }
                        }}
                        disabled={deleteMut.isPending}
                        className="font-mono text-[10px] text-[color:var(--color-grey-400)] hover:text-[color:var(--color-safelight)] transition-colors disabled:opacity-40 px-2 py-1"
                        title="Eliminar"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[color:var(--color-grey-300)]">
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[color:var(--color-grey-500)]">
              {(page - 1) * 60 + 1}–{Math.min(page * 60, data?.total ?? 0)} de {data?.total ?? 0}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] border border-[color:var(--color-grey-300)] hover:border-[color:var(--color-ink)] hover:text-[color:var(--color-ink)] disabled:opacity-40 transition-colors"
              >
                ← Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] border border-[color:var(--color-grey-300)] hover:border-[color:var(--color-ink)] hover:text-[color:var(--color-ink)] disabled:opacity-40 transition-colors"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[color:var(--color-grey-400)] mt-4 text-center">
        Los Face IDs son identificadores de Amazon Rekognition — no se almacenan imágenes de rostros.
      </p>
    </div>
  );
}
