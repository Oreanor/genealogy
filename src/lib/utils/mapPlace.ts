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

