import appData from '@/data/data.json';
import type { GeocodedPoint } from '@/lib/constants/map';

type MapFallbacksData = {
  placeFallbacks?: Record<string, GeocodedPoint>;
};

const bundledPlaceFallbacks = (appData as MapFallbacksData).placeFallbacks ?? {};
let adminWorkingPlaceFallbacks: Record<string, GeocodedPoint> | null = null;

export function getPlaceFallbacks(): Record<string, GeocodedPoint> {
  return adminWorkingPlaceFallbacks ?? bundledPlaceFallbacks;
}

/** Admin session overrides for place fallbacks (in-memory only). */
export function setAdminWorkingPlaceFallbacks(
  value: Record<string, GeocodedPoint> | null
): void {
  adminWorkingPlaceFallbacks = value;
}
