const ELLIPSIS = '…';

/** Truncates with an ellipsis when longer than `maxLen` (counts the ellipsis in the limit). */
export function truncateWithEllipsis(text: string, maxLen: number): string {
  return text.length > maxLen ? `${text.slice(0, maxLen - 1)}${ELLIPSIS}` : text;
}

/** Russian-aware string sort with numeric segments (table columns). */
export function compareStringsRuNumeric(a: string, b: string): number {
  return a.localeCompare(b, 'ru', { sensitivity: 'base', numeric: true });
}

/** Deterministic non-crypto hash → `0 .. modulo-1` (e.g. stable copy variants). */
export function stableModuloHash(seed: string, modulo: number): number {
  if (modulo <= 0) return 0;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return hash % modulo;
}

/** Only relative paths and http(s) — blocks javascript:, data:, etc. */
export function isSafeRichTextHref(href: string): boolean {
  const trimmed = href.trim().toLowerCase();
  if (trimmed.startsWith('/')) return true;
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) return true;
  return false;
}
