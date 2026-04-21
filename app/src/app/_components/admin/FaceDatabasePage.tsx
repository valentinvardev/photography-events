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
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Base de datos facial</h1>
      <p className="text-gray-500 text-sm mb-8">
        Rostros indexados por Amazon Rekognition, vinculados a fotos y compras.
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        {[
          { label: "Rostros indexados", value: stats?.totalFaces ?? "—" },
          { label: "Eventos con índice", value: stats?.totalCollections ?? "—" },
          { label: "Registros en esta vista", value: data?.total ?? "—" },
        ].map((c, i) => (
          <div key={i} className="rounded-2xl border border-gray-100 bg-white shadow-sm px-4 py-4">
            <p className="text-xs text-gray-500 mb-2">{c.label}</p>
            <p className="text-2xl font-bold text-gray-900">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-center">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filtrar por evento</span>
        <button
          onClick={() => handleCollectionChange(undefined)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={{
            background: !collectionId ? "#1d4ed8" : "#f3f4f6",
            color: !collectionId ? "white" : "#374151",
          }}
        >
          Todos
        </button>
        {collections.map((c) => (
          <button
            key={c.id}
            onClick={() => handleCollectionChange(c.id)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: collectionId === c.id ? "#1d4ed8" : "#f3f4f6",
              color: collectionId === c.id ? "white" : "#374151",
            }}
          >
            {c.title}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-gray-400 text-sm">Cargando registros...</div>
        ) : !data?.items.length ? (
          <div className="p-10 text-center">
            <p className="text-gray-400 text-sm">No hay rostros indexados todavía.</p>
            <p className="text-xs text-gray-300 mt-1">
              Se generan automáticamente al subir fotos o al usar "Re-indexar" en un evento.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Face ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Dorsal</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Evento</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Confianza</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Compra</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Indexado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.items.map((row: FaceRow) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    {/* Face ID */}
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                        {row.rekFaceId.slice(-10)}
                      </span>
                    </td>

                    {/* Dorsal */}
                    <td className="px-4 py-3">
                      {row.photo.bibNumber ? (
                        <span className="font-bold text-gray-900">#{row.photo.bibNumber}</span>
                      ) : (
                        <span className="text-gray-300 text-xs">sin dorsal</span>
                      )}
                    </td>

                    {/* Evento */}
                    <td className="px-4 py-3">
                      <a
                        href={`/admin/colecciones/${row.collection.id}`}
                        className="text-blue-600 hover:underline text-xs font-medium"
                      >
                        {row.collection.title}
                      </a>
                    </td>

                    {/* Confianza */}
                    <td className="px-4 py-3">
                      {row.confidence != null ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${row.confidence}%`,
                                background: row.confidence > 90 ? "#16a34a" : row.confidence > 70 ? "#f59e0b" : "#dc2626",
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{row.confidence.toFixed(0)}%</span>
                        </div>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>

                    {/* Compra */}
                    <td className="px-4 py-3">
                      {row.purchase ? (
                        <div>
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                            ✓ Comprado
                          </span>
                          <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[140px]">
                            {row.purchase.buyerEmail}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300">Sin compra</span>
                      )}
                    </td>

                    {/* Fecha */}
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(row.createdAt).toLocaleDateString("es-AR", {
                        day: "2-digit", month: "2-digit", year: "2-digit",
                      })}
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          if (confirm("¿Eliminar este registro facial?")) {
                            deleteMut.mutate({ id: row.id });
                          }
                        }}
                        disabled={deleteMut.isPending}
                        className="text-xs text-gray-300 hover:text-red-400 transition-colors px-2 py-1 rounded"
                        title="Eliminar registro"
                      >
                        ✕
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
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Mostrando {(page - 1) * 60 + 1}–{Math.min(page * 60, data?.total ?? 0)} de {data?.total ?? 0}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-40 hover:border-blue-300 transition-colors"
              >
                ← Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-40 hover:border-blue-300 transition-colors"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-300 mt-4 text-center">
        Los Face IDs son identificadores de Amazon Rekognition — no se almacenan imágenes de rostros.
      </p>
    </div>
  );
}
