"use client";

import { useState } from "react";

type Plan = {
  total: number;
  alreadyIndexed: number;
  willProcess: number;
  estimatedCostUsd: number;
};

/**
 * Two steps on purpose. Every photo indexed costs money and adds a face that is
 * billed monthly forever, so the admin sees the count and the price before
 * anything is spent — this button used to just fire.
 */
export function FaceReindexButton({ collectionId }: { collectionId: string; totalPhotos?: number }) {
  const [status, setStatus] = useState<"idle" | "checking" | "confirm" | "running" | "done" | "error">("idle");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [force, setForce] = useState(false);
  const [queued, setQueued] = useState(0);

  const check = async (withForce: boolean) => {
    setStatus("checking");
    setForce(withForce);
    try {
      const res = await fetch(
        `/api/face-reindex?collectionId=${encodeURIComponent(collectionId)}&force=${withForce}`,
      );
      if (!res.ok) throw new Error();
      setPlan((await res.json()) as Plan);
      setStatus("confirm");
    } catch {
      setStatus("error");
    }
  };

  const run = async () => {
    setStatus("running");
    try {
      const res = await fetch("/api/face-reindex", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collectionId, force }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as Plan & { queued: number };
      setQueued(data.queued);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  const btn =
    "inline-flex items-center gap-2 px-3 py-1.5 border font-mono text-[10px] uppercase tracking-[0.14em] transition-colors disabled:opacity-40";

  if (status === "confirm" && plan) {
    return (
      <div className="flex items-center gap-3 flex-wrap">
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[color:var(--color-grey-700)]">
          {plan.willProcess} de {plan.total} fotos ·{" "}
          <span className={plan.estimatedCostUsd > 1 ? "text-[#92400e]" : "text-[color:var(--color-grey-500)]"}>
            ~USD {plan.estimatedCostUsd.toFixed(3)}
          </span>
          {plan.willProcess === 0 && " · nada para hacer"}
        </span>
        {plan.willProcess > 0 && (
          <button
            onClick={run}
            className={`${btn} border-[color:var(--color-ink)] bg-[color:var(--color-ink)] text-[color:var(--color-paper)] hover:bg-transparent hover:text-[color:var(--color-ink)]`}
          >
            Confirmar
          </button>
        )}
        <button
          onClick={() => { setStatus("idle"); setPlan(null); }}
          className="font-mono text-[9px] uppercase tracking-[0.14em] text-[color:var(--color-grey-500)] hover:text-[color:var(--color-ink)] transition-colors"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <button
        onClick={() => check(false)}
        disabled={status === "checking" || status === "running"}
        className={`${btn} ${
          status === "done"
            ? "border-[#16a34a] text-[#16a34a]"
            : status === "error"
            ? "border-[color:var(--color-safelight)] text-[color:var(--color-safelight)]"
            : "border-[color:var(--color-grey-300)] text-[color:var(--color-grey-700)] hover:border-[color:var(--color-ink)] hover:text-[color:var(--color-ink)]"
        }`}
      >
        {status === "checking" ? (
          <>
            <div className="w-3 h-3 border border-[color:var(--color-grey-300)] border-t-[color:var(--color-ink)] rounded-full animate-spin" />
            Calculando…
          </>
        ) : status === "running" ? (
          <>
            <div className="w-3 h-3 border border-[color:var(--color-grey-300)] border-t-[color:var(--color-ink)] rounded-full animate-spin" />
            Enviando…
          </>
        ) : status === "done" ? (
          <>✓ {queued} fotos en cola</>
        ) : status === "error" ? (
          <>✗ Error · reintentar</>
        ) : (
          <>Indexar fotos faltantes</>
        )}
      </button>

      {status === "idle" && (
        <>
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[color:var(--color-grey-400)]">
            Solo las que no tienen caras indexadas
          </span>
          <button
            onClick={() => check(true)}
            className="font-mono text-[9px] uppercase tracking-[0.14em] text-[color:var(--color-grey-400)] hover:text-[color:var(--color-safelight)] transition-colors underline underline-offset-2"
          >
            Re-indexar todo
          </button>
        </>
      )}
      {status === "done" && (
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[color:var(--color-grey-400)]">
          Corre en segundo plano · recargá en unos minutos
        </span>
      )}
    </div>
  );
}
