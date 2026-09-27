/**
 * When to ask the admin to reconnect MercadoPago, and how loudly. Pure and
 * dependency-free so the thresholds can be tested on their own.
 */

/** MP's documented lifetime for OAuth access tokens. */
export const MP_OAUTH_TOKEN_DAYS = 180;
/** How far ahead the admin starts being warned. */
export const MP_WARN_DAYS = 30;
/** From here on the warning can only be put off until the next session. */
export const MP_URGENT_DAYS = 7;

/** "broken" = checkout is failing right now; the rest count down to expiry. */
export type MpWarning = "broken" | "urgent" | "soon" | null;

export function mpWarning(s: {
  /** An OAuth token is saved. */
  connected: boolean;
  /** MERCADOPAGO_ACCESS_TOKEN is set. */
  envFallback: boolean;
  /**
   * Live check of the token checkout uses (OAuth when connected, else env):
   * true works, false MP rejected it, null couldn't tell.
   */
  valid: boolean | null;
  daysLeft: number | null;
}): MpWarning {
  // The live check beats the date: MP rejecting the token means checkout is
  // failing now, whatever the estimate says. That includes an env-only setup
  // whose credentials were regenerated or revoked.
  if (s.valid === false) return "broken";
  // Without OAuth, checkout runs on the env token, which has no expiry date to
  // count down to; with neither, nothing sells.
  if (!s.connected) return s.envFallback ? null : "broken";
  if (s.daysLeft === null) return null;
  if (s.daysLeft <= MP_URGENT_DAYS) return "urgent";
  if (s.daysLeft <= MP_WARN_DAYS) return "soon";
  return null;
}

/** Dates are read and shown in Argentina's time, wherever the admin is. */
export const MP_TIME_ZONE = "America/Argentina/Buenos_Aires";

const dayKey = new Intl.DateTimeFormat("en-CA", {
  timeZone: MP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * Calendar days from today to `date` in Argentina: 0 = today, 1 = tomorrow.
 * Not a ceil of the millisecond difference: that calls anything within the
 * next 24 h "tomorrow", even an expiry at 20:00 today.
 */
export function calendarDaysUntil(date: Date, now = new Date()): number {
  // en-CA formats as YYYY-MM-DD, which Date.parse reads as UTC midnight.
  const day = (d: Date) => Date.parse(dayKey.format(d));
  return Math.round((day(date) - day(now)) / 86_400_000);
}

/** "vence hoy", "vence mañana", "vence en 12 días", or past the date. */
export function expiryPhrase(expiresAt: Date, valid: boolean | null, now = new Date()): string {
  if (expiresAt.getTime() <= now.getTime()) {
    // Past an estimated date while MP still accepts the token: the estimate
    // was early, but it can stop at any moment.
    return valid === true ? "puede cortarse en cualquier momento" : "ya venció";
  }
  const days = calendarDaysUntil(expiresAt, now);
  if (days <= 0) return "vence hoy";
  if (days === 1) return "vence mañana";
  return `vence en ${days} días`;
}
