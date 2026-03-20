import { STORAGE_KEYS } from '@/lib/constants/storage';

export function readPersonNameLocks(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.personNameLocks);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    const arr = Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === 'string')
      : [];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

/** Call when the user edits firstName, lastName, or patronymic in admin. */
export function addPersonNameLock(personId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const next = readPersonNameLocks();
    if (next.has(personId)) return;
    next.add(personId);
    localStorage.setItem(STORAGE_KEYS.personNameLocks, JSON.stringify([...next]));
  } catch {
    /* ignore quota / private mode */
  }
}
