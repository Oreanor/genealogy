/**
 * Path prefix when the app is served under a sub-path (e.g. `/genealogy` on a shared host).
 * Set at build time through `NEXT_PUBLIC_BASE_PATH`; empty when served from the domain root.
 *
 * Next.js prefixes `<Link>`, router calls and `/_next/*` itself, but not plain URL strings:
 * public files (`/photos/…`, `/fonts/…`), image `src` values and URLs inside HTML strings.
 */
export const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/+$/, '');

/** Prefix a root-relative URL (`/photos/a.jpg`) with the base path. Other URLs are returned unchanged. */
export function withBasePath(url: string): string {
  if (!BASE_PATH || !url.startsWith('/') || url.startsWith('//')) return url;
  if (url === BASE_PATH || url.startsWith(`${BASE_PATH}/`)) return url;
  return `${BASE_PATH}${url}`;
}

/** Prefix root-relative `src`/`href` attributes inside an HTML string. */
export function withBasePathInHtml(html: string): string {
  if (!BASE_PATH) return html;
  return html.replace(/\b(src|href)=(["'])(\/[^/"'][^"']*|\/)\2/g, (_m, attr: string, q: string, url: string) => `${attr}=${q}${withBasePath(url)}${q}`);
}

/** `window.location.pathname` without the base path. */
export function stripBasePath(pathname: string): string {
  if (!BASE_PATH) return pathname;
  if (pathname === BASE_PATH) return '/';
  return pathname.startsWith(`${BASE_PATH}/`) ? pathname.slice(BASE_PATH.length) : pathname;
}
