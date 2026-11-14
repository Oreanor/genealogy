/**
 * Points for the Draft map: `prizyvPoints.json` (summary of `src/data/prizyv.csv`).
 * Regenerate the JSON when the CSV changes.
 */
import prizyvBundle from '@/lib/data/prizyvPoints.json';

export type PrizyvMapPoint = {
  name: string;
  lat: number;
  lon: number;
  count: number;
  percent: number;
};

const bundle = prizyvBundle as { points: PrizyvMapPoint[] };

export function getPrizyvMapPoints(): readonly PrizyvMapPoint[] {
  return bundle.points;
}
