import type { Person } from '@/lib/types/person';
import type { Locale } from '@/lib/i18n/config';
import appData from '@/data/data.json';
import { DEFAULT_LOCALE, isLocale } from '@/lib/i18n/config';
import { mergePersonsForDisplay } from '@/lib/utils/personMerge';
import { STORAGE_KEYS } from '@/lib/constants/storage';

const bundledPersons = (appData as { persons: Person[] }).persons;

let adminWorkingPersons: Person[] | null = null;

const overlayListeners = new Set<() => void>();

export function subscribePersonsOverlay(listener: () => void): () => void {
  overlayListeners.add(listener);
  return () => overlayListeners.delete(listener);
}

function notifyPersonsOverlay(): void {
  overlayListeners.forEach((l) => l());
}

/** Admin session list (in-memory edits). Cleared on full reload or data reload after import. */
export function setAdminWorkingPersons(persons: Person[] | null): void {
  adminWorkingPersons = persons;
  notifyPersonsOverlay();
}

export function bumpPersonsOverlayRevision(): void {
  notifyPersonsOverlay();
}

/** Raw persons from bundled JSON (no locale template, no admin overlay). */
export function getBundledPersons(): Person[] {
  return bundledPersons;
}

function getClientLocaleForPersons(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  const seg = window.location.pathname.split('/').filter(Boolean)[0];
  if (isLocale(seg)) return seg;
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.locale);
    if (stored && isLocale(stored)) return stored;
  } catch {
    /* ignore */
  }
  return DEFAULT_LOCALE;
}

/**
 * Persons for UI: template names for empty bundled rows (until locked), admin working copy when set.
 */
export function getPersons(): Person[] {
  const locale = getClientLocaleForPersons();
  return mergePersonsForDisplay(bundledPersons, adminWorkingPersons, locale);
}

export function getPersonById(id: string): Person | null {
  return getPersons().find((p) => p.id === id) ?? null;
}
