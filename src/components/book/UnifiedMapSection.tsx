'use client';

import { useMemo, useRef, useState } from 'react';
import { BOOK_SPREAD_SHADOW_MD } from '@/lib/constants/theme';
import { BookPage } from './BookPage';
import { useLocaleRoutes } from '@/lib/i18n/context';
import { getPersons } from '@/lib/data/persons';
import { getPlaceFallbacks } from '@/lib/data/mapFallbacks';
import { usePersonsOverlayRevision } from '@/hooks/usePersonsOverlayRevision';
import { getBookMapLayerOptions, resolveBookMapIndexedLayer } from '@/lib/data/bookMapLayerRegistry';
import { ArchiveIndexedMapBody } from './IndexedEventsMapSection';
import { PodvigNarodaMapSection } from './PodvigNarodaMapSection';
import { FamilyMapBody } from './MapSection';

/** Значение селекта — `id` из `bookMapLayers.json`. */
export type MapDataLayerId = string;

/**
 * Вкладка «Карты»: слои и порядок — в `bookMapLayers.json`, загрузка indexed-бандлов — в `bookMapLayerRegistry.ts`.
 */
export function UnifiedMapSection() {
  const { t, locale } = useLocaleRoutes();
  const layerOptions = useMemo(() => getBookMapLayerOptions(), []);
  const [layer, setLayer] = useState<MapDataLayerId>(() => layerOptions[0]?.id ?? 'family');
  const placeFallbacks = useMemo(() => getPlaceFallbacks(), []);
  const activeIndexed = useMemo(
    () => resolveBookMapIndexedLayer(layer, placeFallbacks),
    [layer, placeFallbacks],
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
            <select
              id="book-map-data-layer"
              value={layer}
              onChange={(e) => setLayer(e.target.value)}
              className="mb-2 shrink-0 w-full max-w-md rounded-md border border-(--ink-muted)/45 bg-(--paper) px-2 py-1.5 text-sm text-(--ink) outline-none focus:border-(--accent) md:mx-0"
              aria-label={t('mapLayerSelectAria')}
            >
              {layerOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {t(opt.labelKey)}
                </option>
              ))}
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
              {activeIndexed && (
                <ArchiveIndexedMapBody
                  key={`${locale}-${activeIndexed.id}`}
                  locale={locale}
                  t={t}
                  events={activeIndexed.events}
                  placeFallbacksForGeo={activeIndexed.placeFallbacksForGeo}
                  indexedGeoOptions={activeIndexed.indexedGeoOptions}
                  mapAriaLabelKey={activeIndexed.labelKey}
                />
              )}
              {layer === 'podvig-naroda' && (
                <PodvigNarodaMapSection
                  key={`${locale}-podvig`}
                  locale={locale}
                  t={t}
                  placeFallbacks={placeFallbacks}
                />
              )}
            </div>
          </BookPage>
        </div>
      </div>
    </div>
  );
}
