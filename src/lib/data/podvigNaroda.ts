import type { PodvigNarodaFile, PodvigNarodaRecord } from '@/lib/types/podvigNaroda';
import bundle from '@/lib/data/podvigNaroda.json';

const file = bundle as PodvigNarodaFile;

export function getPodvigNarodaFile(): PodvigNarodaFile {
  return file;
}

export function getPodvigNarodaRecords(): readonly PodvigNarodaRecord[] {
  return file.records;
}
