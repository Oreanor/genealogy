import appData from '@/data/data.json';
import { getPersons } from './persons';

type AppData = { rootPersonId?: string; persons?: { id: string }[] };

/** Root person ID (tree anchor, book title surname source). From data.json or first person. */
export function getRootPersonId(): string {
  const d = appData as AppData;
  if (d.rootPersonId?.trim()) return d.rootPersonId.trim();
  const first = getPersons()[0];
  return first?.id ?? 'p001';
}
