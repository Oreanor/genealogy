import type { Locale } from '@/lib/i18n/config';
import { isLatinScriptLocale } from '@/lib/utils/person';
import { transliterateCyrillicToLatin } from '@/lib/utils/transliteration';

export function normalizePlace(raw: string): string {
  return raw
    .trim()
    .replace(/^[гс]\.\s*/i, '')
    .replace(/^ст\.\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function toPlaceFallbackKey(raw: string): string {
  return transliterateCyrillicToLatin(normalizePlace(raw))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function splitPlaceList(raw?: string): string[] {
  return (raw ?? '')
    .split(',')
    .map((s) => normalizePlace(s))
    .filter(Boolean);
}

export function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** Для латинских локалей — транслитерация кириллицы в подписях карт; иначе исходная строка. */
export function formatPlaceLabelForLocale(raw: string, locale: Locale): string {
  const n = normalizePlace(raw);
  if (!n) return '';
  if (!isLatinScriptLocale(locale)) return n;
  return transliterateCyrillicToLatin(n);
}

