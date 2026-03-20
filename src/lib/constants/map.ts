export type GeocodedPoint = { lat: number; lon: number };

export const MAP_DEFAULT_CENTER = [56.5, 37.5] as const;
export const MAP_DEFAULT_ZOOM = 4;
export const GEOCODE_REQUEST_DELAY_MS = 120;
export const FALLBACK_COUNTRY_SUFFIX = ', Россия';

export const MAP_LINE_STYLE = {
  color: '#2563eb',
  weight: 3,
  opacity: 0.85,
} as const;

export const MARKER_GROUPING = {
  coordPrecision: 4,
  columnsPerRow: 3,
  lonStep: 0.06,
  latStep: 0.04,
} as const;

export const AVATAR_MARKER = {
  width: 40,
  height: 52,
  borderRadiusPercent: 50,
  borderWidth: 2,
  borderColor: '#6b7280',
  shadow: '0 2px 6px rgba(0,0,0,.25)',
  bg: '#f3f4f6',
  fallbackBg: '#e5e7eb',
  fallbackTextColor: '#374151',
  fallbackFontSize: 12,
  fallbackFontWeight: 700,
  iconAnchorX: 20,
  iconAnchorY: 50,
  popupAnchorX: 0,
  popupAnchorY: -44,
} as const;
