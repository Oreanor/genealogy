'use client';

import { useEffect, useRef } from 'react';
import {
  AVATAR_MARKER,
  FALLBACK_COUNTRY_SUFFIX,
  GEOCODE_REQUEST_DELAY_MS,
  MAP_DEFAULT_CENTER,
  MAP_DEFAULT_ZOOM,
  MAP_LINE_STYLE,
  MARKER_GROUPING,
  PLACE_FALLBACKS,
  type GeocodedPoint,
} from '@/lib/constants/map';
import { BOOK_SPREAD_SHADOW_MD } from '@/lib/constants/theme';
import { BookPage } from './BookPage';
import { useLocaleRoutes } from '@/lib/i18n/context';
import { getPersons } from '@/lib/data/persons';
import { getAvatarForPerson } from '@/lib/data/photos';
import { getFullName } from '@/lib/utils/person';

function normalizePlace(raw: string): string {
  return raw
    .trim()
    .replace(/^[гс]\.\s*/i, '')
    .replace(/^ст\.\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function toPlaceFallbackKey(raw: string): string {
  return normalizePlace(raw)
    .toLowerCase()
    .replace(/[а-яёіїєґ]/g, (char) => {
      switch (char) {
        case 'а':
          return 'a';
        case 'б':
          return 'b';
        case 'в':
          return 'v';
        case 'г':
          return 'g';
        case 'ґ':
          return 'g';
        case 'д':
          return 'd';
        case 'е':
          return 'e';
        case 'ё':
          return 'yo';
        case 'є':
          return 'ye';
        case 'ж':
          return 'zh';
        case 'з':
          return 'z';
        case 'и':
          return 'i';
        case 'і':
          return 'i';
        case 'ї':
          return 'yi';
        case 'й':
          return 'y';
        case 'к':
          return 'k';
        case 'л':
          return 'l';
        case 'м':
          return 'm';
        case 'н':
          return 'n';
        case 'о':
          return 'o';
        case 'п':
          return 'p';
        case 'р':
          return 'r';
        case 'с':
          return 's';
        case 'т':
          return 't';
        case 'у':
          return 'u';
        case 'ф':
          return 'f';
        case 'х':
          return 'kh';
        case 'ц':
          return 'ts';
        case 'ч':
          return 'ch';
        case 'ш':
          return 'sh';
        case 'щ':
          return 'shch';
        case 'ъ':
          return '';
        case 'ы':
          return 'y';
        case 'ь':
          return '';
        case 'э':
          return 'e';
        case 'ю':
          return 'yu';
        case 'я':
          return 'ya';
        default:
          return '';
      }
    })
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function MapSection() {
  const { t } = useLocaleRoutes();
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    let map: import('leaflet').Map | null = null;

    const geocodePlace = async (place: string): Promise<GeocodedPoint | null> => {
      const url = `/api/map/geocode?q=${encodeURIComponent(place)}`;
      try {
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!res.ok) return null;
        const data = (await res.json()) as { point: GeocodedPoint | null };
        if (!data.point) return null;
        const lat = Number(data.point.lat);
        const lon = Number(data.point.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
        return { lat, lon };
      } catch {
        return null;
      }
    };

    const init = async () => {
      const L = await import('leaflet');
      if (!isMounted || !mapRef.current) return;

      map = L.map(mapRef.current, {
        zoomControl: true,
        attributionControl: true,
      }).setView([MAP_DEFAULT_CENTER[0], MAP_DEFAULT_CENTER[1]], MAP_DEFAULT_ZOOM);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      const persons = getPersons();
      const placeCache = new Map<string, GeocodedPoint | null>();
      const placeQueue = new Set<string>();

      for (const p of persons) {
        const birth = (p.birthPlace ?? '').trim();
        const residence = (p.residenceCity ?? '').trim();
        if (birth) placeQueue.add(birth);
        if (residence) placeQueue.add(residence);
      }

      for (const place of placeQueue) {
        // Small delay to avoid hammering Nominatim in a burst.
        const normalized = normalizePlace(place);
        let point = await geocodePlace(place);
        if (!point && normalized !== place) {
          point = await geocodePlace(normalized);
        }
        if (!point) {
          point = await geocodePlace(`${normalized}${FALLBACK_COUNTRY_SUFFIX}`);
        }
        if (!point) {
          point = PLACE_FALLBACKS[toPlaceFallbackKey(normalized)] ?? null;
        }
        placeCache.set(place, point);
        await new Promise((r) => setTimeout(r, GEOCODE_REQUEST_DELAY_MS));
      }

      const markerEntries: Array<{
        personName: string;
        kindLabel: string;
        place: string;
        point: GeocodedPoint;
        avatarSrc: string | null;
      }> = [];
      const lineEntries: Array<{
        personName: string;
        from: GeocodedPoint;
        to: GeocodedPoint;
      }> = [];

      for (const p of persons) {
        const personName = getFullName(p) || p.id;
        const avatar = getAvatarForPerson(p.id, p.avatarPhotoSrc);
        const avatarSrc = avatar?.src ?? null;
        const birth = (p.birthPlace ?? '').trim();
        const residence = (p.residenceCity ?? '').trim();

        if (birth) {
          const point = placeCache.get(birth);
          if (point) {
            markerEntries.push({
              personName,
              kindLabel: t('birthPlace'),
              place: birth,
              point,
              avatarSrc,
            });
          }
        }
        if (residence) {
          const point = placeCache.get(residence);
          if (point) {
            markerEntries.push({
              personName,
              kindLabel: t('residenceCity'),
              place: residence,
              point,
              avatarSrc,
            });
          }
        }

        const birthPoint = birth ? placeCache.get(birth) ?? null : null;
        const residencePoint = residence ? placeCache.get(residence) ?? null : null;
        if (birthPoint && residencePoint) {
          lineEntries.push({
            personName,
            from: birthPoint,
            to: residencePoint,
          });
        }
      }

      for (const line of lineEntries) {
        L.polyline(
          [
            [line.from.lat, line.from.lon],
            [line.to.lat, line.to.lon],
          ],
          MAP_LINE_STYLE
        )
          .addTo(map)
          .bindTooltip(escapeHtml(line.personName), { sticky: true });
      }

      const byCoord = new Map<string, number>();
      for (const item of markerEntries) {
        const coordKey = `${item.point.lat.toFixed(MARKER_GROUPING.coordPrecision)},${item.point.lon.toFixed(MARKER_GROUPING.coordPrecision)}`;
        const offsetIdx = byCoord.get(coordKey) ?? 0;
        byCoord.set(coordKey, offsetIdx + 1);
        const dx = (offsetIdx % MARKER_GROUPING.columnsPerRow) * MARKER_GROUPING.lonStep;
        const dy = Math.floor(offsetIdx / MARKER_GROUPING.columnsPerRow) * MARKER_GROUPING.latStep;

        const html = item.avatarSrc
          ? `<div style="width:${AVATAR_MARKER.width}px;height:${AVATAR_MARKER.height}px;border-radius:${AVATAR_MARKER.borderRadiusPercent}%;overflow:hidden;border:${AVATAR_MARKER.borderWidth}px solid ${AVATAR_MARKER.borderColor};box-shadow:${AVATAR_MARKER.shadow};background:${AVATAR_MARKER.bg};">
               <img src="${escapeHtml(item.avatarSrc)}" alt="" style="width:100%;height:100%;object-fit:cover;object-position:top;" />
             </div>`
          : `<div style="width:${AVATAR_MARKER.width}px;height:${AVATAR_MARKER.height}px;border-radius:${AVATAR_MARKER.borderRadiusPercent}%;overflow:hidden;border:${AVATAR_MARKER.borderWidth}px solid ${AVATAR_MARKER.borderColor};display:flex;align-items:center;justify-content:center;background:${AVATAR_MARKER.fallbackBg};color:${AVATAR_MARKER.fallbackTextColor};font-size:${AVATAR_MARKER.fallbackFontSize}px;font-weight:${AVATAR_MARKER.fallbackFontWeight};">?</div>`;

        const icon = L.divIcon({
          className: 'person-place-avatar',
          html,
          iconSize: [AVATAR_MARKER.width, AVATAR_MARKER.height],
          iconAnchor: [AVATAR_MARKER.iconAnchorX, AVATAR_MARKER.iconAnchorY],
          popupAnchor: [AVATAR_MARKER.popupAnchorX, AVATAR_MARKER.popupAnchorY],
        });

        L.marker([item.point.lat + dy, item.point.lon + dx], { icon })
          .addTo(map)
          .bindPopup(
            `<div style="min-width:180px">
               <div style="font-weight:600;margin-bottom:4px">${escapeHtml(item.personName)}</div>
               <div style="font-size:12px;opacity:.9">${escapeHtml(item.kindLabel)}: ${escapeHtml(item.place)}</div>
             </div>`
          );
      }
    };

    void init();

    const cssId = 'leaflet-osm-styles';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }

    return () => {
      isMounted = false;
      if (map) map.remove();
    };
  }, []);

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden min-h-[calc(100vh-10rem)] md:min-h-0 md:flex-none">
      <div
        className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:max-h-[calc(100vh-4rem)] md:max-w-[calc((100vh-6rem)*296/210)] md:aspect-[296/210] md:min-h-[320px] md:flex-initial md:rounded-lg ${BOOK_SPREAD_SHADOW_MD}`}
      >
        <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
          <BookPage className="relative flex h-full min-h-0 min-w-0 flex-col p-2 sm:p-5 md:p-6">
            <h1 className="book-serif mb-2 hidden border-b border-(--ink-muted)/35 pb-0 text-center text-lg font-semibold text-(--ink) md:block md:text-2xl lg:text-3xl">
              {t('chapters_map')}
            </h1>
            <div className="relative z-0 min-h-0 flex-1 overflow-hidden rounded-md border border-(--ink-muted)/25">
              <div ref={mapRef} className="h-full w-full" aria-label={t('chapters_map')} />
            </div>
          </BookPage>
        </div>
      </div>
    </div>
  );
}
