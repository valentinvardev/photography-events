"use client";

import { useRef, useState, useCallback } from "react";
import { api } from "~/trpc/react";
import { ImageUpload } from "~/app/_components/admin/ImageUpload";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
  storageKey,
  onSave,
  onCancel,
  saving,
}: {
  initial: typeof emptyForm;
  storageKey: string;
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

      <ImageUpload
        label="Foto de portada"
        value={form.coverUrl || null}
        storagePath={`category-covers/${storageKey}`}
        onChange={(path) => set("coverUrl", path)}
      />

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
        <div className="flex flex-col gap-1.5">
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

function useNewKey() {
  const ref = useRef(`new-${Date.now()}`);
  return ref.current;
}

function CategoryRow({
  cat,
  onEdit,
  onDelete,
  editingId,
  update,
  del,
}: {
  cat: Category;
  onEdit: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  editingId: string | null;
  update: ReturnType<typeof api.category.update.useMutation>;
  del: ReturnType<typeof api.category.delete.useMutation>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: cat.id,
    disabled: editingId !== null,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      {editingId === cat.id ? (
        <div className="bg-[color:var(--color-paper)] p-4 border-b border-[color:var(--color-grey-300)]">
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
            storageKey={cat.id}
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
            onCancel={() => onEdit("")}
            saving={update.isPending}
          />
        </div>
      ) : (
        <div className="bg-[color:var(--color-paper)] px-5 py-4 flex items-center gap-3 border-b border-[color:var(--color-grey-300)] last:border-b-0">
          {/* Drag handle */}
          <button
            {...listeners}
            {...attributes}
            className="shrink-0 flex items-center justify-center w-6 h-8 text-[color:var(--color-grey-400)] hover:text-[color:var(--color-grey-600)] cursor-grab active:cursor-grabbing touch-none"
            aria-label="Arrastrar para reordenar"
            tabIndex={-1}
            type="button"
          >
            <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
              <circle cx="2.5" cy="2" r="1.5" />
              <circle cx="7.5" cy="2" r="1.5" />
              <circle cx="2.5" cy="7" r="1.5" />
              <circle cx="7.5" cy="7" r="1.5" />
              <circle cx="2.5" cy="12" r="1.5" />
              <circle cx="7.5" cy="12" r="1.5" />
            </svg>
          </button>

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
              onClick={() => onEdit(cat.id)}
              className="px-3 py-1.5 border border-[color:var(--color-grey-300)] font-mono text-[9px] uppercase tracking-[0.14em] text-[color:var(--color-grey-600)] hover:border-[color:var(--color-ink)] hover:text-[color:var(--color-ink)] transition-colors"
            >
              Editar
            </button>
            <button
              onClick={() => onDelete(cat.id, cat.name)}
              className="px-3 py-1.5 border border-[color:var(--color-grey-300)] font-mono text-[9px] uppercase tracking-[0.14em] text-[color:var(--color-grey-500)] hover:border-red-400 hover:text-red-600 transition-colors"
            >
              Eliminar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function CategoryManager({ initialCategories }: { initialCategories: Category[] }) {
  const utils = api.useUtils();
  const { data: serverCategories = initialCategories } = api.category.adminList.useQuery(
    undefined,
    { initialData: initialCategories },
  );

  const [items, setItems] = useState(serverCategories);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const newKey = useNewKey();

  const create = api.category.create.useMutation({
    onSuccess: (newCat) => {
      void utils.category.adminList.invalidate();
      setItems((prev) => [...prev, { ...newCat, _count: { collections: 0 } }]);
      setCreating(false);
    },
  });
  const update = api.category.update.useMutation({
    onSuccess: () => { void utils.category.adminList.invalidate(); setEditingId(null); },
  });
  const del = api.category.delete.useMutation({
    onSuccess: (_, vars) => {
      void utils.category.adminList.invalidate();
      setItems((prev) => prev.filter((c) => c.id !== vars.id));
    },
  });
  const reorder = api.category.reorder.useMutation({
    onSettled: () => setSavingOrder(false),
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      setItems((prev) => {
        const oldIndex = prev.findIndex((i) => i.id === active.id);
        const newIndex = prev.findIndex((i) => i.id === over.id);
        const next = arrayMove(prev, oldIndex, newIndex);
        setSavingOrder(true);
        reorder.mutate(next.map((item, idx) => ({ id: item.id, order: idx })));
        return next;
      });
    },
    [reorder],
  );

  const handleEdit = (id: string) => setEditingId(id || null);
  const handleDelete = (id: string, name: string) => {
    if (confirm(`¿Eliminar "${name}"?`)) del.mutate({ id });
  };

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
        <div className="flex items-center gap-4">
          {savingOrder && (
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[color:var(--color-grey-500)] animate-pulse">
              Guardando…
            </span>
          )}
          {!creating && (
            <button
              onClick={() => setCreating(true)}
              className="px-5 py-2.5 bg-[color:var(--color-ink)] text-[color:var(--color-paper)] font-mono text-[10px] uppercase tracking-[0.18em] hover:opacity-80 transition-opacity"
            >
              + Nueva categoría
            </button>
          )}
        </div>
      </div>

      {creating && (
        <div className="mb-6">
          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mb-3">
            Nueva categoría
          </p>
          <CategoryForm
            initial={emptyForm}
            storageKey={newKey}
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

      {items.length === 0 && !creating ? (
        <div className="border border-dashed border-[color:var(--color-grey-300)] py-24 text-center">
          <p className="font-display italic text-[28px] text-[color:var(--color-grey-500)]">
            Sin categorías
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-grey-400)] mt-3">
            Creá la primera para organizar los eventos
          </p>
        </div>
      ) : (
        <div className="border border-[color:var(--color-grey-300)]">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              {items.map((cat) => (
                <CategoryRow
                  key={cat.id}
                  cat={cat}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  editingId={editingId}
                  update={update}
                  del={del}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}
