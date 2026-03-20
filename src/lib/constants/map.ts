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

export const PLACE_FALLBACKS: Record<string, GeocodedPoint> = {
  bryansk: { lat: 53.2423258, lon: 34.3668288 },
  yelets: { lat: 52.6247023, lon: 38.5016984 },
  livny: { lat: 52.4253443, lon: 37.6097277 },
  vorkuta: { lat: 67.49741, lon: 64.06101 },
  atkarsk: { lat: 51.8728579, lon: 45.0011046 },
  bryukhovetskaya: { lat: 45.8063024, lon: 38.9957933 },
  buynaksk: { lat: 42.820182, lon: 47.1163672 },
  sumy: { lat: 50.9077005, lon: 34.7980972 },
  kaluga: { lat: 54.5135904, lon: 36.2612152 },
  lvov: { lat: 49.841952, lon: 24.0315921 },
};
