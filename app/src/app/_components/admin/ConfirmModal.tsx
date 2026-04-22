"use client";

type Props = {
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: "danger" | "success";
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({ title, message, confirmLabel = "Eliminar", variant = "danger", onConfirm, onCancel }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm border border-[color:var(--color-grey-300)] bg-[color:var(--color-paper)] p-6 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] mb-2">
            Confirmar acción
          </p>
          <h3 className="font-display italic font-light text-[22px] leading-tight text-[color:var(--color-ink)]">
            {title}
          </h3>
          <p className="font-mono text-[10px] tracking-[0.06em] mt-2 text-[color:var(--color-grey-600)] leading-relaxed">
            {message}
          </p>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-[color:var(--color-grey-300)] font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-grey-600)] hover:border-[color:var(--color-ink)] hover:text-[color:var(--color-ink)] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors ${
              variant === "success"
                ? "border border-[#16a34a] text-[#16a34a] hover:bg-[#16a34a] hover:text-white"
                : "border border-[color:var(--color-safelight)] text-[color:var(--color-safelight)] hover:bg-[color:var(--color-safelight)] hover:text-white"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
