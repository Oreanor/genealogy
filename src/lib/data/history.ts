import type { HistoryEntry } from '@/lib/types/history';
import appData from '@/data/data.json';

const entries = (appData as { history: HistoryEntry[] }).history;
const visible = entries.filter((e) => !e.hidden);

export function getHistoryEntries({ includeHidden = false } = {}): HistoryEntry[] {
  return includeHidden ? entries : visible;
}

/** Entries where this person is in personIds, with index for linking (section=history&entry=index). */
export function getHistoryEntriesByPerson(personId: string): { entry: HistoryEntry; index: number }[] {
  return visible
    .map((entry, index) => (entry.personIds.includes(personId) ? { entry, index } : null))
    .filter((x): x is { entry: HistoryEntry; index: number } => x !== null);
}
