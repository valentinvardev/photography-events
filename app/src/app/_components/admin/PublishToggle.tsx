"use client";

type Props = {
  isPublished: boolean;
  isPending?: boolean;
  onToggle: () => void;
  labelOn?: string;
  labelOff?: string;
};

export function PublishToggle({
  isPublished,
  isPending = false,
  onToggle,
  labelOn = "Publicada",
  labelOff = "Borrador",
}: Props) {
  return (
    <button
      onClick={onToggle}
      disabled={isPending}
      title={isPublished ? "Clic para ocultar" : "Clic para publicar"}
      className={`inline-flex items-center gap-2 px-3 py-1.5 border font-mono text-[10px] uppercase tracking-[0.14em] transition-colors disabled:opacity-40 select-none ${
        isPublished
          ? "border-[#16a34a] text-[#16a34a] hover:bg-[#16a34a] hover:text-white"
          : "border-[color:var(--color-grey-300)] text-[color:var(--color-grey-600)] hover:border-[color:var(--color-ink)] hover:text-[color:var(--color-ink)]"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isPublished ? "bg-[#16a34a]" : "bg-[color:var(--color-grey-400)]"}`} />
      {isPending ? "…" : isPublished ? labelOn : labelOff}
    </button>
  );
}
