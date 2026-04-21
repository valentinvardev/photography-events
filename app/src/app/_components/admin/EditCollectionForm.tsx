"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { CoverUploader } from "./CoverUploader";

type Collection = {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  isPublished: boolean;
  coverUrl: string | null;
};

export function EditCollectionForm({ collection }: { collection: Collection }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: collection.title,
    description: collection.description ?? "",
    slug: collection.slug,
    isPublished: collection.isPublished,
  });

  const update = api.collection.update.useMutation({
    onSuccess: () => router.refresh(),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    update.mutate({
      id: collection.id,
      title: form.title,
      description: form.description || undefined,
      slug: form.slug,
      isPublished: form.isPublished,
    });
  };

  return (
    <div className="max-w-lg flex flex-col gap-6">
      {/* Cover image */}
      <CoverUploader collectionId={collection.id} currentUrl={collection.coverUrl} />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs mb-1.5" style={{ color: "#64748b" }}>Título *</label>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs mb-1.5" style={{ color: "#64748b" }}>Descripción</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={3}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs mb-1.5" style={{ color: "#64748b" }}>Slug</label>
          <input
            value={form.slug}
            onChange={(e) =>
              setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))
            }
            className={inputClass}
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isPublished}
            onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
          />
          <span className="text-sm" style={{ color: "#94a3b8" }}>Publicada</span>
        </label>

        {update.isSuccess && (
          <p className="text-xs" style={{ color: "#34d399" }}>Guardado correctamente.</p>
        )}
        {update.isError && (
          <p className="text-xs" style={{ color: "#f87171" }}>Error al guardar.</p>
        )}

        <button
          type="submit"
          disabled={update.isPending}
          className="self-start disabled:opacity-50 font-semibold text-black text-sm px-6 py-2.5 rounded-xl transition-all hover:scale-[1.02]"
          style={{ background: "linear-gradient(135deg, #f59e0b, #fbbf24)" }}
        >
          {update.isPending ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none transition-colors"
  + " bg-[#0f0f1a] border border-[#1e1e35] focus:border-[#f59e0b40]";
