/**
 * Точки для карты «Призыв»: данные в `prizyvPoints.json` (сводка по `src/data/prizyv.csv`).
 * При обновлении CSV пересоберите JSON вручную или скриптом.
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
