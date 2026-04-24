"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
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
import { api } from "~/trpc/react";
import { CollectionActions } from "~/app/_components/admin/CollectionActions";

type Col = {
  id: string;
  title: string;
  slug: string;
  coverUrl: string | null;
  isPublished: boolean;
  order: number;
  _count: { photos: number };
};

function Row({ col }: { col: Col }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: col.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
      className="flex items-center justify-between px-5 py-4 bg-[color:var(--color-paper)] hover:bg-[color:var(--color-grey-100)] transition-colors border-b border-[color:var(--color-grey-300)] last:border-b-0"
    >
      {/* Drag handle */}
      <button
        {...listeners}
        {...attributes}
        className="mr-3 shrink-0 flex items-center justify-center w-6 h-8 text-[color:var(--color-grey-400)] hover:text-[color:var(--color-grey-600)] cursor-grab active:cursor-grabbing touch-none"
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

      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className="w-10 h-10 shrink-0 overflow-hidden bg-[color:var(--color-grey-300)]">
          {col.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
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
              style={
                col.isPublished
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
  );
}

export function SortableCollectionList({ initialCollections }: { initialCollections: Col[] }) {
  const [items, setItems] = useState(initialCollections);
  const [saving, setSaving] = useState(false);

  const reorder = api.collection.reorder.useMutation({
    onSettled: () => setSaving(false),
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
        setSaving(true);
        reorder.mutate(next.map((item, idx) => ({ id: item.id, order: idx })));
        return next;
      });
    },
    [reorder],
  );

  return (
    <div>
      {saving && (
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[color:var(--color-grey-500)] mb-3 animate-pulse">
          Guardando orden…
        </p>
      )}
      <div className="border border-[color:var(--color-grey-300)]">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            {items.map((col) => (
              <Row key={col.id} col={col} />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
