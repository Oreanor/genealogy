import type { GeocodedPoint } from '@/lib/constants/map';

/**
 * Ключи — как `toPlaceFallbackKey(сегмент)` для латиницы FamilySearch.
 * Приближённые центры (область / город), без претензии на точность хутора.
 */
const KANIVETS_EXTRA: Record<string, GeocodedPoint> = {
  kiev: { lat: 50.4501, lon: 30.5234 },
  kyiv: { lat: 50.4501, lon: 30.5234 },
  cherkasy: { lat: 49.4444, lon: 32.0597 },
  crimea: { lat: 44.952, lon: 34.102 },
  donetsk: { lat: 48.0159, lon: 37.8029 },
  ukraine: { lat: 48.3794, lon: 31.1656 },
  'soviet-union': { lat: 48.3794, lon: 31.1656 },
  'russian-empire': { lat: 50.45, lon: 30.52 },
  chernigov: { lat: 51.4982, lon: 31.2893 },
  chernihiv: { lat: 51.4982, lon: 31.2893 },
  poltava: { lat: 49.5883, lon: 34.5514 },
  tavrida: { lat: 44.952, lon: 34.102 },
  lubny: { lat: 50.0182, lon: 33.0035 },
  gadyach: { lat: 50.358, lon: 33.988 },
  hadyach: { lat: 50.358, lon: 33.988 },
  gadiach: { lat: 50.358, lon: 33.988 },
  mykolaiv: { lat: 46.975, lon: 31.995 },
  nikolaev: { lat: 46.975, lon: 31.995 },
  zolotonosha: { lat: 49.668, lon: 32.0404 },
  zenkov: { lat: 50.042, lon: 34.994 },
  zenkiv: { lat: 50.042, lon: 34.994 },
  zinkiv: { lat: 50.042, lon: 34.994 },
  bucha: { lat: 50.553, lon: 30.217 },
  kremenchug: { lat: 49.065, lon: 33.42 },
  kremenchuk: { lat: 49.065, lon: 33.42 },
  dnipropetrovsk: { lat: 48.4647, lon: 35.0462 },
  odesa: { lat: 46.4825, lon: 30.7233 },
  odessa: { lat: 46.4825, lon: 30.7233 },
  romny: { lat: 50.751, lon: 33.475 },
  lokhvitsa: { lat: 50.367, lon: 33.269 },
  lokhvytsia: { lat: 50.367, lon: 33.269 },
  pyriatyn: { lat: 49.535, lon: 32.503 },
  piryatin: { lat: 49.535, lon: 32.503 },
  chyhyryn: { lat: 49.083, lon: 32.658 },
  pereiaslav: { lat: 49.483, lon: 31.895 },
  kharkiv: { lat: 49.9935, lon: 36.2304 },
  poland: { lat: 52.1, lon: 19.4 },
  viceroyalty: { lat: 50.45, lon: 30.52 },
  uyezd: { lat: 49.59, lon: 34.55 },
};

/**
 * Подмешивает приближённые точки для слоя «Канивец» к `placeFallbacks` из data.json.
 * «Kharkov» (губерния в индексе FS) — в Сумы, если в данных есть `sumy`.
 */
export function mergeKanivetsMapPlaceGeo(
  base: Record<string, GeocodedPoint>,
): Record<string, GeocodedPoint> {
  const out: Record<string, GeocodedPoint> = { ...KANIVETS_EXTRA, ...base };
  const sumy = base.sumy;
  if (sumy) {
    out.kharkov = sumy;
  }
  return out;
}
