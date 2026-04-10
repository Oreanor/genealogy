'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useLocaleRoutes } from '@/lib/i18n/context';
import { getPersons } from '@/lib/data/persons';
import { usePersonsOverlayRevision } from '@/hooks/usePersonsOverlayRevision';
import { getPlaceFallbacks } from '@/lib/data/mapFallbacks';
import type { Locale } from '@/lib/i18n/config';
import { buildMapEntries } from '@/lib/utils/mapSectionEntries';
import { useLeafletBookMap } from './useLeafletBookMap';

type FamilyMapBodyProps = {
  locale: Locale;
  t: ReturnType<typeof useLocaleRoutes>['t'];
  placeFallbacks: ReturnType<typeof getPlaceFallbacks>;
  persons: ReturnType<typeof getPersons>;
};

/** Только блок карты родственников (без обёртки BookPage) — для объединённой вкладки «Карты». */
export function FamilyMapBody({ locale, t, placeFallbacks, persons }: FamilyMapBodyProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleFilterChange = useCallback((id: string | null) => {
    setSelectedPersonId(id);
    setIsFilterOpen(false);
  }, []);

  const { markerEntries, lineEntries, personsOnMap } = useMemo(
    () =>
      buildMapEntries({
        persons,
        locale,
        t,
        placeFallbacks,
      }),
    [locale, persons, placeFallbacks, t]
  );

  const visibleSelectedPersonId =
    selectedPersonId && personsOnMap.some((p) => p.id === selectedPersonId)
      ? selectedPersonId
      : null;

  const { showPersonFilter } = useLeafletBookMap({
    containerRef: mapRef,
    locale,
    markerEntries,
    lineEntries,
    selectedPersonId: visibleSelectedPersonId,
  });

  const selectedPerson = personsOnMap.find((p) => p.id === visibleSelectedPersonId) ?? null;

  return (
    <div className="relative z-0 min-h-0 flex-1 overflow-hidden rounded-md border border-(--ink-muted)/25">
      <div ref={mapRef} className="h-full w-full" aria-label={t('chapters_map')} />
      {showPersonFilter && personsOnMap.length > 0 && (
        <div className="absolute top-2 right-2 z-[1000] flex items-start gap-1">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsFilterOpen((v) => !v)}
              className="flex min-w-[220px] items-center justify-between gap-2 rounded border border-(--ink-muted)/40 bg-(--book-bg)/95 px-2 py-1 text-xs text-(--ink) shadow-sm backdrop-blur-sm"
            >
              <span className="flex min-w-0 items-center gap-2">
                {selectedPerson ? (
                  <span
                    className="h-2.5 w-2.5 rounded-full border border-(--border-subtle) shadow-sm"
                    style={{ background: selectedPerson.color }}
                  />
                ) : (
                  <span className="h-2.5 w-2.5 rounded-full border border-(--ink-muted)/40 bg-(--ink-muted)/25" />
                )}
                <span className="truncate">
                  {selectedPerson?.name ?? t('mapFilterAll') ?? 'Все на карте'}
                </span>
              </span>
              <span className="text-[10px] opacity-70">{isFilterOpen ? '▲' : '▼'}</span>
            </button>
            {isFilterOpen && (
              <div className="absolute right-0 z-[1000] mt-1 max-h-64 w-[280px] overflow-auto rounded border border-(--ink-muted)/40 bg-(--book-bg)/98 p-1 text-xs text-(--ink) shadow-lg backdrop-blur-sm">
                <button
                  type="button"
                  onClick={() => handleFilterChange(null)}
                  className="flex w-full items-center gap-2 rounded px-2 py-1 text-left hover:bg-(--paper-light)/35"
                >
                  <span className="h-2.5 w-2.5 rounded-full border border-(--ink-muted)/40 bg-(--ink-muted)/25" />
                  <span className="truncate">{t('mapFilterAll') || 'Все на карте'}</span>
                </button>
                {personsOnMap.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleFilterChange(p.id)}
                    className="flex w-full items-center gap-2 rounded px-2 py-1 text-left hover:bg-(--paper-light)/35"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full border border-(--border-subtle) shadow-sm"
                      style={{ background: p.color }}
                    />
                    <span className="truncate">{p.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {visibleSelectedPersonId && (
            <button
              type="button"
              onClick={() => handleFilterChange(null)}
              title={t('mapFilterReset') || 'Показать всех'}
              className="flex h-6 w-6 items-center justify-center rounded border border-(--ink-muted)/40 bg-(--book-bg)/95 text-xs text-(--ink) shadow-sm backdrop-blur-sm hover:bg-(--paper-light)/40"
            >
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  );
}
