export type GeocodedPoint = { lat: number; lon: number };

export const MAP_DEFAULT_CENTER: readonly [number, number] = [56.5, 37.5];
export const MAP_DEFAULT_ZOOM = 4;
export const FALLBACK_COUNTRY_SUFFIX = ', Россия';

export const MAP_LINE_STYLE: { color: string; weight: number; opacity: number } = {
  color: '#2563eb',
  weight: 3,
  opacity: 0.85,
};

export const MARKER_GROUPING: {
  coordPrecision: number;
  columnsPerRow: number;
  lonStep: number;
  latStep: number;
} = {
  coordPrecision: 4,
  columnsPerRow: 3,
  lonStep: 0.06,
  latStep: 0.04,
};
