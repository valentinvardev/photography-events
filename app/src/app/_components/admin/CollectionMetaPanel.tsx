"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

export function CollectionMetaPanel({
  collectionId,
  initialTitle,
  initialDescription,
  initialSlug,
  initialEventDate,
}: {
  collectionId: string;
  initialTitle: string;
  initialDescription: string | null;
  initialSlug: string;
  initialEventDate: Date | null;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [slug, setSlug] = useState(initialSlug);
  const [eventDate, setEventDate] = useState(
    initialEventDate ? new Date(initialEventDate).toISOString().slice(0, 10) : "",
  );
  const [saved, setSaved] = useState(false);

  const update = api.collection.update.useMutation({
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    },
  });

  const handleSave = () => {
    update.mutate({
      id: collectionId,
      title,
      description,
      slug,
      eventDate: eventDate || null,
    });
  };

  const inputClass =
    "w-full border border-[color:var(--color-grey-300)] bg-[color:var(--color-paper)] px-3 py-2 font-mono text-[12px] text-[color:var(--color-ink)] focus:outline-none focus:border-[color:var(--color-ink)]";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mb-1.5">
          Título
        </label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
      </div>

      <div>
        <label className="block font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mb-1.5">
          Descripción
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className={`${inputClass} resize-none`}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mb-1.5">
            Slug
          </label>
          <input
            value={slug}
            onChange={(e) =>
              setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
            }
            className={inputClass}
          />
        </div>
        <div>
          <label className="block font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mb-1.5">
            Fecha
          </label>
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={update.isPending}
        className={`self-start inline-flex items-center justify-center gap-2 px-5 py-2.5 border font-mono text-[10px] uppercase tracking-[0.18em] transition-colors disabled:opacity-40 ${
          saved
            ? "border-[#16a34a] text-[#16a34a]"
            : "border-[color:var(--color-ink)] hover:bg-[color:var(--color-ink)] hover:text-[color:var(--color-paper)]"
        }`}
      >
        {update.isPending ? "Guardando…" : saved ? "✓ Guardado" : "Guardar cambios"}
      </button>
    </div>
  );
}
