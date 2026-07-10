/**
 * Embed mode — when the LMS is rendered inside the SM Web Systems marketing
 * site (reverse-proxied under /learn). In embed mode the app hides its own
 * chrome (nav rail + header) so it reads as part of the host site, and routes
 * visitors straight to the course view.
 *
 * Triggered by either:
 *  - being served under a non-root base path (VITE_BASE_PATH=/learn/), or
 *  - an explicit ?embed=1 query param (sticky for the session; ?embed=0 clears).
 */
const EMBED_KEY = 'lms_embed';

export function isEmbedded(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const params = new URLSearchParams(window.location.search);
    const flag = params.get('embed');
    if (flag === '1') window.sessionStorage.setItem(EMBED_KEY, '1');
    else if (flag === '0') window.sessionStorage.removeItem(EMBED_KEY);
    if (window.sessionStorage.getItem(EMBED_KEY) === '1') return true;
  } catch {
    // sessionStorage unavailable (private mode / sandboxed) — fall through
  }

  return import.meta.env.BASE_URL !== '/';
}

/** Router basename derived from the Vite base path (no trailing slash). */
export function routerBasename(): string {
  return import.meta.env.BASE_URL.replace(/\/+$/, '') || '/';
}

/** Prefix a root-relative app path with the current base path (for Clerk, etc.). */
export function withBase(pathname: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/+$/, '');
  const clean = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${base}${clean}` || '/';
}

/** Resolve a /public asset against the base path (e.g. /learn/logo.png). */
export function assetUrl(file: string): string {
  const clean = file.replace(/^\/+/, '');
  return `${import.meta.env.BASE_URL}${clean}`;
}
