"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "~/trpc/react";
import { MP_TIME_ZONE, expiryPhrase } from "~/lib/mp-warning";

/**
 * Warns the admin before the MercadoPago connection lapses. Nothing renews the
 * OAuth token, and once it's gone every checkout fails — so this shows on any
 * admin page a month ahead and gets harder to put off as the date gets close.
 *
 * Reconnecting goes straight through OAuth again. The callback overwrites the
 * token in place, so sales never stop in between; "Desconectar" first would
 * leave a gap where nobody can pay.
 */

type Level = "broken" | "urgent" | "soon";

const DAY_MS = 86_400_000;

// "soon" can be snoozed for a day; closer than that it only waits for the next
// session, so it keeps coming back until someone reconnects.
function isDismissed(key: string, level: Level): boolean {
  try {
    if (level === "soon") {
      const at = Number(localStorage.getItem(key));
      return !!at && Date.now() - at < DAY_MS;
    }
    return sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function dismiss(key: string, level: Level) {
  try {
    if (level === "soon") localStorage.setItem(key, String(Date.now()));
    else sessionStorage.setItem(key, "1");
  } catch {
    // Private mode or storage disabled: it just shows again next page.
  }
}

export function MercadoPagoExpiryModal() {
  const { data } = api.settings.getMpStatus.useQuery(undefined, {
    staleTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  });
  // Hidden until storage has been read, so it never flashes on and off.
  const [hidden, setHidden] = useState(true);
  const primaryRef = useRef<HTMLAnchorElement>(null);

  const level = (data?.warning ?? null) as Level | null;
  const expiresAt = data?.expiresAt ? new Date(data.expiresAt) : null;
  // Keyed to the expiry date: after a reconnect the old snooze doesn't carry over.
  const storageKey = level
    ? `mp-reconnect:${level}:${expiresAt ? expiresAt.toISOString().slice(0, 10) : "none"}`
    : null;

  useEffect(() => {
    if (level && storageKey) setHidden(isDismissed(storageKey, level));
  }, [level, storageKey]);

  const open = !!level && !!storageKey && !hidden;

  const close = () => {
    if (level && storageKey) dismiss(storageKey, level);
    setHidden(true);
  };
  // The Escape listener is bound once per opening; the ref keeps it calling the
  // current close instead of the one from the render that opened it.
  const closeRef = useRef(close);
  useEffect(() => {
    closeRef.current = close;
  });

  useEffect(() => {
    if (!open) return;
    primaryRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open || !data || !level) return null;

  const dateStr = expiresAt
    ? new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", timeZone: MP_TIME_ZONE }).format(
        expiresAt,
      )
    : null;
  const approx = data.expiryEstimated ? " (fecha aproximada)" : "";
  const past = !!expiresAt && expiresAt.getTime() <= Date.now();

  const title =
    level === "broken"
      ? "MercadoPago se desconectó."
      : expiresAt
        ? `La conexión con MercadoPago ${expiryPhrase(expiresAt, data.valid)}.`
        : "La conexión con MercadoPago está por vencer.";

  const body =
    level === "broken"
      ? "Ahora mismo nadie puede comprar fotos: el pago falla antes de llegar a MercadoPago. Reconectá la cuenta para volver a vender."
      : past && data.valid === true
        ? `La fecha estimada era el ${dateStr}${approx} y la conexión todavía funciona, pero puede cortarse en cualquier momento. Tarda un minuto y las ventas no se cortan mientras lo hacés.`
        : past
          ? // MP couldn't be asked just now, so this can't promise sales still work.
            `Venció el ${dateStr}${approx}. Si los pagos están fallando, es por esto: reconectá la cuenta para volver a vender.`
          : `${dateStr ? `El ${dateStr}${approx} ` : "Cuando venza, "}deja de funcionar y nadie va a poder comprar fotos hasta que la reconectes. Tarda un minuto y las ventas no se cortan mientras lo hacés.`;

  const danger = level !== "soon";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={close}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="mp-expiry-title"
        aria-describedby="mp-expiry-body"
        className={`w-full max-w-md border bg-[color:var(--color-paper)] p-6 flex flex-col gap-5 ${
          danger ? "border-[color:var(--color-safelight)]" : "border-[color:var(--color-grey-300)]"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <p
            className={`font-mono text-[9px] uppercase tracking-[0.22em] mb-2 flex items-center gap-2 ${
              danger ? "text-[color:var(--color-safelight)]" : "text-[color:var(--color-grey-500)]"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                danger ? "bg-[color:var(--color-safelight)]" : "bg-[#d97706]"
              }`}
            />
            {level === "broken" ? "Cobros detenidos" : "Acción necesaria"}
          </p>
          <h3
            id="mp-expiry-title"
            className="font-display italic font-light text-[24px] leading-tight text-[color:var(--color-ink)]"
          >
            {title}
          </h3>
          <p
            id="mp-expiry-body"
            className="font-mono text-[10px] tracking-[0.06em] mt-3 text-[color:var(--color-grey-700)] leading-relaxed"
          >
            {body}
          </p>
          <p className="font-mono text-[10px] tracking-[0.06em] mt-3 text-[color:var(--color-grey-700)] leading-relaxed border-l-2 border-[color:var(--color-grey-300)] pl-3">
            Entrá con la misma cuenta de MercadoPago donde cobrás
            {data.userId ? ` (usuario #${data.userId})` : ""}. Si usás otra, los pagos van a ir a esa
            cuenta.
          </p>
        </div>
        <div className="flex gap-3 justify-end flex-wrap">
          <button
            onClick={close}
            className="px-4 py-2 border border-[color:var(--color-grey-300)] font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-grey-600)] hover:border-[color:var(--color-ink)] hover:text-[color:var(--color-ink)] transition-colors"
          >
            {level === "soon" ? "Recordarme mañana" : "Más tarde"}
          </button>
          <a
            ref={primaryRef}
            href="/api/mercadopago/connect"
            className="px-4 py-2 border border-[color:var(--color-ink)] bg-[color:var(--color-ink)] text-[color:var(--color-paper)] font-mono text-[10px] uppercase tracking-[0.14em] hover:bg-transparent hover:text-[color:var(--color-ink)] transition-colors"
          >
            Reconectar ahora →
          </a>
        </div>
      </div>
    </div>
  );
}
