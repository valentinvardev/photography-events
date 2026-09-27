import "server-only";

import { env } from "~/env";
import type { db as dbInstance } from "~/server/db";

/**
 * MercadoPago access tokens.
 *
 * Two sources: the OAuth token saved by /api/mercadopago/connect (Setting
 * "mp_access_token") and MERCADOPAGO_ACCESS_TOKEN from the environment. OAuth
 * tokens expire — 180 days per MP's docs — and nothing renews them, so the
 * admin has to reconnect before that date or every checkout fails. When to
 * warn about that lives in ./mp-warning.
 */

/**
 * Tokens to try, OAuth first. Checkout and the payment webhook both go through
 * this, so they always read payments from the same account.
 */
export async function mpTokenCandidates(db: typeof dbInstance): Promise<string[]> {
  const setting = await db.setting.findUnique({ where: { key: "mp_access_token" } });
  const tokens = [setting?.value, env.MERCADOPAGO_ACCESS_TOKEN].filter(
    (t): t is string => !!t,
  );
  return [...new Set(tokens)];
}

const CHECK_TTL_MS = 10 * 60_000;
const checks = new Map<string, { valid: boolean | null; at: number }>();

/**
 * Asks MP whether a token still works: true = it does, false = MP rejected it
 * (expired or revoked), null = couldn't tell (MP down, timeout). The expiry date
 * is only an estimate for tokens saved before it was recorded; this is the
 * ground truth. Cached so each admin page view doesn't hit MP.
 */
export async function checkMpToken(token: string): Promise<boolean | null> {
  const hit = checks.get(token);
  if (hit && Date.now() - hit.at < CHECK_TTL_MS) return hit.valid;

  let valid: boolean | null = null;
  try {
    const res = await fetch("https://api.mercadopago.com/users/me", {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(4000),
      cache: "no-store",
    });
    if (res.ok) valid = true;
    else if (res.status === 401 || res.status === 403) valid = false;
  } catch {
    valid = null;
  }
  checks.set(token, { valid, at: Date.now() });
  return valid;
}
