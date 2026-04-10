'use client';

import { useMemo, useRef, useState } from 'react';
import { BOOK_SPREAD_SHADOW_MD } from '@/lib/constants/theme';
import { BookPage } from './BookPage';
import { useLocaleRoutes } from '@/lib/i18n/context';
import type { Locale } from '@/lib/i18n/config';
import {
  INDEXED_EVENTS,
  buildIndexedMapMarkers,
  getIndexedEventYearBounds,
} from '@/lib/data/indexedEventsMap';
import { useIndexedEventsMap } from './useIndexedEventsMap';
import { YearArchiveRangeSlider } from './YearArchiveRangeSlider';

export function IndexedEventsMapSection() {
  const { t, locale } = useLocaleRoutes();
  return <IndexedEventsMapSectionInner key={locale} locale={locale} t={t} />;
}

function IndexedEventsMapSectionInner({
  locale,
  t,
}: {
  locale: Locale;
  t: ReturnType<typeof useLocaleRoutes>['t'];
}) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const bounds = useMemo(() => getIndexedEventYearBounds(), []);
  const [yearFrom, setYearFrom] = useState(bounds.min);
  const [yearTo, setYearTo] = useState(bounds.max);

  const clampedFrom = Math.min(Math.max(yearFrom, bounds.min), bounds.max);
  const clampedTo = Math.min(Math.max(yearTo, bounds.min), bounds.max);
  const lo = Math.min(clampedFrom, clampedTo);
  const hi = Math.max(clampedFrom, clampedTo);

  const filteredEvents = useMemo(
    () => INDEXED_EVENTS.filter((e) => e.year >= lo && e.year <= hi),
    [lo, hi],
  );

  const markers = useMemo(
    () => buildIndexedMapMarkers(filteredEvents, t),
    [filteredEvents, t],
  );

  useIndexedEventsMap({ containerRef: mapRef, locale, markers });

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden min-h-[calc(100vh-10rem)] md:min-h-0 md:flex-none">
      <div
        className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:max-h-[calc(100vh-4rem)] md:max-w-[calc((100vh-6rem)*296/210)] md:aspect-[296/210] md:min-h-[320px] md:flex-initial md:rounded-lg ${BOOK_SPREAD_SHADOW_MD}`}
      >
        <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
          <BookPage className="relative flex h-full min-h-0 min-w-0 flex-col p-2 sm:p-3 md:p-4">
            <h1 className="book-serif mb-1 hidden border-b border-(--ink-muted)/35 pb-0 text-center text-lg font-semibold text-(--ink) md:block md:text-2xl lg:text-3xl">
              {t('chapters_map2')}
            </h1>
            <div className="mb-1.5 shrink-0">
              <YearArchiveRangeSlider
                minBound={bounds.min}
                maxBound={bounds.max}
                low={lo}
                high={hi}
                eventCount={filteredEvents.length}
                onChange={({ low: nextLo, high: nextHi }) => {
                  setYearFrom(nextLo);
                  setYearTo(nextHi);
                }}
              />
            </div>
            <div className="relative z-0 min-h-0 flex-1 overflow-hidden rounded-md border border-(--ink-muted)/25">
              <div ref={mapRef} className="h-full w-full" aria-label={t('chapters_map2')} />
            </div>
          </BookPage>
        </div>
      </div>
    </div>
  );
}
