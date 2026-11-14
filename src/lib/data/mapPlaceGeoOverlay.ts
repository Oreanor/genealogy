import type { GeocodedPoint } from '@/lib/constants/map';
import raw from '@/lib/data/mapPlaceGeoOverlays.json';

type OverlayDef = {
  points: Record<string, GeocodedPoint>;
  mapSumyToKeys?: string[];
};

type OverlayFile = {
  overlays: Record<string, OverlayDef>;
};

const file = raw as OverlayFile;

/**
 * Mixes in points from `mapPlaceGeoOverlays.json` under `overlayId`; `base` (family fallbacks) wins on conflicts.
 * Keys listed in `mapSumyToKeys` resolve to `base.sumy` when present (e.g. "Kharkov" → Sumy).
 */
export function mergeMapPlaceGeoOverlay(
  base: Record<string, GeocodedPoint>,
  overlayId: string,
): Record<string, GeocodedPoint> {
  const cfg = file.overlays[overlayId];
  if (!cfg) return { ...base };
  const out: Record<string, GeocodedPoint> = { ...cfg.points, ...base };
  const sumy = base.sumy;
  if (sumy && cfg.mapSumyToKeys?.length) {
    for (const k of cfg.mapSumyToKeys) {
      out[k] = sumy;
    }
  }
  return out;
}
