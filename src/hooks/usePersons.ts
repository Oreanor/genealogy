'use client';

import { useSyncExternalStore } from 'react';
import { useLocale } from '@/lib/i18n/context';
import {
  getPersons,
  getPersonsOverlayVersion,
  subscribePersonsOverlay,
} from '@/lib/data/persons';
import type { Person } from '@/lib/types/person';

/**
 * Persons for display, re-rendering when the in-memory overlay (admin session,
 * locale template) changes. `getPersons()` is memoized, so the returned array
 * is referentially stable between changes.
 */
export function usePersons(): Person[] {
  useSyncExternalStore(subscribePersonsOverlay, getPersonsOverlayVersion, getPersonsOverlayVersion);
  // Template names depend on the locale; subscribe to it so we re-render on switch.
  useLocale();
  return getPersons();
}
