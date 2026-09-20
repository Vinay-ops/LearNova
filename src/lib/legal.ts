/**
 * Legal document links.
 *
 * Configurable so the published documents can live on a marketing domain
 * without hardcoding that domain throughout the codebase. Defaults point at the
 * in-app routes so the links always resolve to something real.
 *
 * NOTE: document *versions* are deliberately NOT duplicated here. The backend
 * is the single source of truth (app/core/legal.py) and returns the current
 * revision in every auth response, so the frontend can never ask a user to
 * accept a version the server is not serving.
 */

const env: Record<string, unknown> = (import.meta.env ?? {}) as Record<
  string,
  unknown
>;

function readUrl(value: unknown, fallback: string): string {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw || /^(null|undefined)$/i.test(raw)) return fallback;
  return raw;
}

/** External Terms & Conditions URL, else the in-app /terms route. */
export const TERMS_URL = readUrl(env.VITE_TERMS_URL, "/terms");

/** External Privacy Policy URL, else the in-app /privacy route. */
export const PRIVACY_URL = readUrl(env.VITE_PRIVACY_URL, "/privacy");

/** True when the term is an absolute URL (needs a plain anchor, not a route). */
export function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}
