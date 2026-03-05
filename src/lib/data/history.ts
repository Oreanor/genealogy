import type { HistoryEntry } from '@/lib/types/history';
import appData from '@/data/data.json';

const entries = (appData as { history: HistoryEntry[] }).history;

export function getHistoryEntries(): HistoryEntry[] {
  return entries;
}
