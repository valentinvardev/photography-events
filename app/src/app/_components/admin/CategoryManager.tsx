"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  coverUrl: string | null;
  buttonText: string | null;
  buttonHref: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  _count: { collections: number };
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  coverUrl: "",
  buttonText: "",
  buttonHref: "",
  order: 0,
};

function CategoryForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial: typeof emptyForm;
  onSave: (data: typeof emptyForm) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState(initial);

  const set = (k: keyof typeof emptyForm, v: string | number) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="border border-[color:var(--color-grey-300)] bg-[color:var(--color-paper)] p-6 flex flex-col gap-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)]">
            Nombre *
          </label>
          <input
            value={form.name}
            onChange={(e) => {
              set("name", e.target.value);
              if (!initial.slug) set("slug", slugify(e.target.value));
            }}
            className="border border-[color:var(--color-grey-300)] px-3 py-2 font-mono text-[12px] text-[color:var(--color-ink)] bg-transparent focus:outline-none focus:border-[color:var(--color-ink)]"
            placeholder="Maratones"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)]">
            Slug *
          </label>
          <input
            value={form.slug}
            onChange={(e) => set("slug", e.target.value)}
            className="border border-[color:var(--color-grey-300)] px-3 py-2 font-mono text-[12px] text-[color:var(--color-ink)] bg-transparent focus:outline-none focus:border-[color:var(--color-ink)]"
            placeholder="maratones"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)]">
          Descripción
        </label>
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={2}
          className="border border-[color:var(--color-grey-300)] px-3 py-2 font-mono text-[12px] text-[color:var(--color-ink)] bg-transparent focus:outline-none focus:border-[color:var(--color-ink)] resize-none"
          placeholder="Fotos de todas las carreras y maratones…"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)]">
          URL de portada
        </label>
        <input
          value={form.coverUrl}
          onChange={(e) => set("coverUrl", e.target.value)}
          className="border border-[color:var(--color-grey-300)] px-3 py-2 font-mono text-[12px] text-[color:var(--color-ink)] bg-transparent focus:outline-none focus:border-[color:var(--color-ink)]"
          placeholder="https://..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)]">
            Texto del botón CTA
          </label>
          <input
            value={form.buttonText}
            onChange={(e) => set("buttonText", e.target.value)}
            className="border border-[color:var(--color-grey-300)] px-3 py-2 font-mono text-[12px] text-[color:var(--color-ink)] bg-transparent focus:outline-none focus:border-[color:var(--color-ink)]"
            placeholder="Ver eventos"
          />
        </div>
        <div className="flex flex-col gap-1.5 md:col-span-1">
          <label className="font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)]">
            Destino del botón
          </label>
          <input
            value={form.buttonHref}
            onChange={(e) => set("buttonHref", e.target.value)}
            className="border border-[color:var(--color-grey-300)] px-3 py-2 font-mono text-[12px] text-[color:var(--color-ink)] bg-transparent focus:outline-none focus:border-[color:var(--color-ink)]"
            placeholder="#eventos"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)]">
            Orden
          </label>
          <input
            type="number"
            value={form.order}
            onChange={(e) => set("order", parseInt(e.target.value, 10) || 0)}
            className="border border-[color:var(--color-grey-300)] px-3 py-2 font-mono text-[12px] text-[color:var(--color-ink)] bg-transparent focus:outline-none focus:border-[color:var(--color-ink)]"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={() => onSave(form)}
          disabled={saving || !form.name || !form.slug}
          className="px-5 py-2 bg-[color:var(--color-ink)] text-[color:var(--color-paper)] font-mono text-[10px] uppercase tracking-[0.18em] disabled:opacity-40 hover:opacity-80 transition-opacity"
        >
          {saving ? "Guardando…" : "Guardar"}
        </button>
        <button
          onClick={onCancel}
          className="px-5 py-2 border border-[color:var(--color-grey-300)] font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-grey-600)] hover:border-[color:var(--color-ink)] hover:text-[color:var(--color-ink)] transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

export function CategoryManager({ initialCategories }: { initialCategories: Category[] }) {
  const utils = api.useUtils();
  const { data: categories = initialCategories } = api.category.adminList.useQuery(undefined, {
    initialData: initialCategories,
  });

  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const create = api.category.create.useMutation({
    onSuccess: () => { void utils.category.adminList.invalidate(); setCreating(false); },
  });
  const update = api.category.update.useMutation({
    onSuccess: () => { void utils.category.adminList.invalidate(); setEditingId(null); },
  });
  const del = api.category.delete.useMutation({
    onSuccess: () => void utils.category.adminList.invalidate(),
  });

  return (
    <div>
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-[color:var(--color-grey-500)] mb-1">
            Admin
          </p>
          <h1 className="font-display italic font-light text-[36px] leading-none tracking-[-0.02em] text-[color:var(--color-ink)]">
            Categorías
          </h1>
        </div>
        {!creating && (
          <button
            onClick={() => setCreating(true)}
            className="px-5 py-2.5 bg-[color:var(--color-ink)] text-[color:var(--color-paper)] font-mono text-[10px] uppercase tracking-[0.18em] hover:opacity-80 transition-opacity"
          >
            + Nueva categoría
          </button>
        )}
      </div>

      {creating && (
        <div className="mb-6">
          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mb-3">
            Nueva categoría
          </p>
          <CategoryForm
            initial={emptyForm}
            onSave={(data) =>
              create.mutate({
                ...data,
                description: data.description || null,
                coverUrl: data.coverUrl || null,
                buttonText: data.buttonText || null,
                buttonHref: data.buttonHref || null,
              })
            }
            onCancel={() => setCreating(false)}
            saving={create.isPending}
          />
        </div>
      )}

      {categories.length === 0 && !creating ? (
        <div className="border border-dashed border-[color:var(--color-grey-300)] py-24 text-center">
          <p className="font-display italic text-[28px] text-[color:var(--color-grey-500)]">
            Sin categorías
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-grey-400)] mt-3">
            Creá la primera para organizar los eventos
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-px border border-[color:var(--color-grey-300)] bg-[color:var(--color-grey-300)]">
          {categories.map((cat) => (
            <div key={cat.id}>
              {editingId === cat.id ? (
                <div className="bg-[color:var(--color-paper)] p-4">
                  <CategoryForm
                    initial={{
                      name: cat.name,
                      slug: cat.slug,
                      description: cat.description ?? "",
                      coverUrl: cat.coverUrl ?? "",
                      buttonText: cat.buttonText ?? "",
                      buttonHref: cat.buttonHref ?? "",
                      order: cat.order,
                    }}
                    onSave={(data) =>
                      update.mutate({
                        id: cat.id,
                        data: {
                          ...data,
                          description: data.description || null,
                          coverUrl: data.coverUrl || null,
                          buttonText: data.buttonText || null,
                          buttonHref: data.buttonHref || null,
                        },
                      })
                    }
                    onCancel={() => setEditingId(null)}
                    saving={update.isPending}
                  />
                </div>
              ) : (
                <div className="bg-[color:var(--color-paper)] px-5 py-4 flex items-center gap-4">
                  {cat.coverUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cat.coverUrl}
                      alt={cat.name}
                      className="w-12 h-12 object-cover shrink-0 border border-[color:var(--color-grey-200)]"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-display italic text-[20px] leading-tight text-[color:var(--color-ink)]">
                      {cat.name}
                    </p>
                    <div className="flex items-center gap-4 mt-0.5">
                      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[color:var(--color-grey-500)]">
                        /{cat.slug}
                      </span>
                      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[color:var(--color-grey-400)]">
                        {cat._count.collections} evento{cat._count.collections !== 1 ? "s" : ""}
                      </span>
                    </div>
                    {cat.description && (
                      <p className="font-mono text-[10px] text-[color:var(--color-grey-600)] mt-1 truncate">
                        {cat.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setEditingId(cat.id)}
                      className="px-3 py-1.5 border border-[color:var(--color-grey-300)] font-mono text-[9px] uppercase tracking-[0.14em] text-[color:var(--color-grey-600)] hover:border-[color:var(--color-ink)] hover:text-[color:var(--color-ink)] transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar "${cat.name}"?`)) del.mutate({ id: cat.id });
                      }}
                      className="px-3 py-1.5 border border-[color:var(--color-grey-300)] font-mono text-[9px] uppercase tracking-[0.14em] text-[color:var(--color-grey-500)] hover:border-red-400 hover:text-red-600 transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
