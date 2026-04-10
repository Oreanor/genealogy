'use client';

import { useMemo, useRef, useState } from 'react';
import { BOOK_SPREAD_SHADOW_MD } from '@/lib/constants/theme';
import { BookPage } from './BookPage';
import { useLocaleRoutes } from '@/lib/i18n/context';
import type { Locale } from '@/lib/i18n/config';
import type { TranslationFn } from '@/lib/i18n/types';
import { getPersons } from '@/lib/data/persons';
import { getPlaceFallbacks } from '@/lib/data/mapFallbacks';
import { getPrizyvMapPoints } from '@/lib/data/prizyvMap';
import { usePersonsOverlayRevision } from '@/hooks/usePersonsOverlayRevision';
import kanivetsIndexedBundle from '@/lib/data/kanivetsIndexedEvents.json';
import { mergeKanivetsMapPlaceGeo } from '@/lib/data/kanivetsMapPlaceGeo';
import type { IndexedEvent } from '@/lib/data/indexedEventsMap';
import { ArchiveIndexedMapBody } from './IndexedEventsMapSection';
import { FamilyMapBody } from './MapSection';
import { usePrizyvPointsMap } from './usePrizyvPointsMap';

const KANIVETS_INDEXED_EVENTS = kanivetsIndexedBundle.events as IndexedEvent[];

export type MapDataLayerId = 'family' | 'archives' | 'archivesKanivets' | 'prizyv';

function PrizyvMapBody({ locale, t }: { locale: Locale; t: TranslationFn }) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const points = useMemo(() => getPrizyvMapPoints(), []);
  usePrizyvPointsMap({ containerRef: mapRef, locale, t, points });

  return (
    <div className="relative z-0 min-h-0 flex-1 overflow-hidden rounded-md border border-(--ink-muted)/25">
      <div ref={mapRef} className="h-full w-full" aria-label={t('mapLayerPrizyv')} />
    </div>
  );
}

/**
 * Одна вкладка «Карта»: выбор источника данных (семья / FamilySearch / призывные пункты).
 */
export function UnifiedMapSection() {
  const { t, locale } = useLocaleRoutes();
  const [layer, setLayer] = useState<MapDataLayerId>('family');
  const placeFallbacks = useMemo(() => getPlaceFallbacks(), []);
  const kanivetsPlaceFallbacksForGeo = useMemo(() => mergeKanivetsMapPlaceGeo(placeFallbacks), [placeFallbacks]);
  const kanivetsIndexedGeoOptions = useMemo(
    () => (placeFallbacks.sumy ? { defaultWhenUnresolved: placeFallbacks.sumy } : undefined),
    [placeFallbacks.sumy],
  );
  const personsOverlayRev = usePersonsOverlayRevision();
  const persons = useMemo(() => getPersons(), [personsOverlayRev]);

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden min-h-[calc(100vh-10rem)] md:min-h-0 md:flex-none">
      <div
        className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:max-h-[calc(100vh-4rem)] md:max-w-[calc((100vh-6rem)*296/210)] md:aspect-[296/210] md:min-h-[320px] md:flex-initial md:rounded-lg ${BOOK_SPREAD_SHADOW_MD}`}
      >
        <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
          <BookPage className="relative flex h-full min-h-0 min-w-0 flex-col p-2 sm:p-4 md:p-5">
            <h1 className="book-serif mb-2 hidden border-b border-(--ink-muted)/35 pb-0 text-center text-lg font-semibold text-(--ink) md:block md:text-2xl lg:text-3xl">
              {t('chapters_map')}
            </h1>
            <select
              id="book-map-data-layer"
              value={layer}
              onChange={(e) => setLayer(e.target.value as MapDataLayerId)}
              className="mb-2 shrink-0 w-full max-w-md rounded-md border border-(--ink-muted)/45 bg-(--paper) px-2 py-1.5 text-sm text-(--ink) outline-none focus:border-(--accent) md:mx-0"
              aria-label={t('mapLayerSelectAria')}
            >
              <option value="family">{t('mapLayerFamily')}</option>
              <option value="archives">{t('mapLayerArchives')}</option>
              <option value="archivesKanivets">{t('mapLayerArchivesKanivets')}</option>
              <option value="prizyv">{t('mapLayerPrizyv')}</option>
            </select>
            <div className="flex min-h-0 flex-1 flex-col">
              {layer === 'family' && (
                <FamilyMapBody
                  key={locale}
                  locale={locale}
                  t={t}
                  placeFallbacks={placeFallbacks}
                  persons={persons}
                />
              )}
              {layer === 'archives' && <ArchiveIndexedMapBody key={locale} locale={locale} t={t} />}
              {layer === 'archivesKanivets' && (
                <ArchiveIndexedMapBody
                  key={`${locale}-kanivets`}
                  locale={locale}
                  t={t}
                  events={KANIVETS_INDEXED_EVENTS}
                  placeFallbacksForGeo={kanivetsPlaceFallbacksForGeo}
                  indexedGeoOptions={kanivetsIndexedGeoOptions}
                  mapAriaLabelKey="mapLayerArchivesKanivets"
                />
              )}
              {layer === 'prizyv' && <PrizyvMapBody key={locale} locale={locale} t={t} />}
            </div>
          </BookPage>
        </div>
      </div>
    </div>
  );
}
