'use client';

import type { ReactNode } from 'react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useLocaleRoutes } from '@/lib/i18n/context';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { BookPage } from './BookPage';
import { BOOK_SPREAD_SHADOW_MD } from '@/lib/constants/theme';
import { getFamilySearchPersonDatasets } from '@/lib/data/familySearchPersonDatasets';
import type { FamilySearchPersonEntry } from '@/lib/types/familysearchPersons';
import { SearchField } from '@/components/ui/molecules/SearchField';
import { FAMILYSEARCH_PUBLIC_ORIGIN } from '@/lib/data/indexedEventsMap';

const SEARCH_DEBOUNCE_MS = 280;
/** Колонки виртуальной сетки: персона | рождение | смерть | место | отец | мать. */
const GRID_COLS =
  'minmax(120px,1.1fr) minmax(4.75rem,auto) minmax(4.75rem,auto) minmax(88px,0.85fr) minmax(104px,1fr) minmax(104px,1fr)';

type FamilySearchPersonsSortKey = 'name' | 'birth' | 'death' | 'place' | 'father' | 'mother';

function yearFromLooseDate(s: string | undefined): number {
  if (!s?.trim()) return 99999;
  const m = s.match(/\b(1[0-9]{3}|20[0-9]{2})\b/);
  if (m) return Number.parseInt(m[0], 10);
  const m2 = s.match(/^(\d{3,4})\b/);
  if (m2) return Number.parseInt(m2[1], 10);
  return 99999;
}

function compareBirth(a: FamilySearchPersonEntry, b: FamilySearchPersonEntry): number {
  return yearFromLooseDate(a.birthDate) - yearFromLooseDate(b.birthDate);
}

function compareDeath(a: FamilySearchPersonEntry, b: FamilySearchPersonEntry): number {
  return yearFromLooseDate(a.deathDate) - yearFromLooseDate(b.deathDate);
}

function displayName(p: FamilySearchPersonEntry): string {
  return [p.firstName, p.patronymic, p.lastName].filter(Boolean).join(' ') || p.firstName;
}

/** Место для отображения: уже слито в JSON (precisePlace при сборке). */
function placeForDisplay(p: FamilySearchPersonEntry): string {
  return (p.precisePlace ?? p.birthPlace ?? '').trim();
}

function parentSortBlob(
  parentId: string | undefined,
  byId: Map<string, FamilySearchPersonEntry>,
): string {
  const pr = parentId ? byId.get(parentId) : undefined;
  if (!pr) return '';
  return `${displayName(pr)} ${placeForDisplay(pr)}`.trim().toLowerCase();
}

function compareRows(
  a: FamilySearchPersonEntry,
  b: FamilySearchPersonEntry,
  key: FamilySearchPersonsSortKey,
  dir: 'asc' | 'desc',
  loc: string,
  byId: Map<string, FamilySearchPersonEntry>,
): number {
  let cmp = 0;
  switch (key) {
    case 'name':
      cmp = displayName(a).localeCompare(displayName(b), loc, { sensitivity: 'base', numeric: true });
      break;
    case 'birth':
      cmp = compareBirth(a, b);
      break;
    case 'death':
      cmp = compareDeath(a, b);
      break;
    case 'place':
      cmp = placeForDisplay(a).localeCompare(placeForDisplay(b), loc, { sensitivity: 'base', numeric: true });
      break;
    case 'father':
      cmp = parentSortBlob(a.fatherId, byId).localeCompare(parentSortBlob(b.fatherId, byId), loc, {
        sensitivity: 'base',
        numeric: true,
      });
      break;
    case 'mother':
      cmp = parentSortBlob(a.motherId, byId).localeCompare(parentSortBlob(b.motherId, byId), loc, {
        sensitivity: 'base',
        numeric: true,
      });
      break;
    default:
      cmp = 0;
  }
  return dir === 'asc' ? cmp : -cmp;
}

function personHaystack(p: FamilySearchPersonEntry): string {
  return [p.firstName, p.patronymic, p.lastName, p.birthPlace, p.precisePlace]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function recordHref(personId: string): string | null {
  const key = personId.replace(/^fs-/i, '').trim();
  if (!key) return null;
  return `${FAMILYSEARCH_PUBLIC_ORIGIN}/ark:/61903/1:1:${key}`;
}

function buildById(persons: FamilySearchPersonEntry[]): Map<string, FamilySearchPersonEntry> {
  const m = new Map<string, FamilySearchPersonEntry>();
  for (const p of persons) {
    m.set(p.id, p);
  }
  return m;
}

function ParentCell({
  id,
  byId,
}: {
  id: string | undefined;
  byId: Map<string, FamilySearchPersonEntry>;
}) {
  const pr = id ? byId.get(id) : undefined;
  if (!pr) {
    return <span className="text-(--ink-muted)">—</span>;
  }
  const href = recordHref(pr.id);
  const name = displayName(pr) || pr.firstName;
  const place = placeForDisplay(pr);
  const nameNode: ReactNode =
    href != null ? (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-(--ink) underline decoration-(--ink-muted)/45 underline-offset-2 hover:decoration-(--ink)"
      >
        {name}
      </a>
    ) : (
      name
    );
  return (
    <div className="min-w-0 truncate whitespace-nowrap text-[10px] leading-tight">
      {place ? (
        <>
          {nameNode}
          <span className="text-(--ink-muted)"> — {place}</span>
        </>
      ) : (
        nameNode
      )}
    </div>
  );
}

type RowProps = {
  person: FamilySearchPersonEntry;
  byId: Map<string, FamilySearchPersonEntry>;
};

const FamilySearchPersonRow = memo(function FamilySearchPersonRow({ person: p, byId }: RowProps) {
  const href = recordHref(p.id);
  const name = displayName(p) || p.firstName;
  const birthPlaceCol = placeForDisplay(p);

  const nameEl =
    href != null ? (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium leading-tight text-(--ink) underline decoration-(--ink-muted)/45 underline-offset-2 hover:decoration-(--ink)"
      >
        {name}
      </a>
    ) : (
      <span className="font-medium leading-tight">{name}</span>
    );

  return (
    <div
      className="grid gap-x-1 border-t border-(--ink-muted)/12 px-1.5 py-0.5 text-[11px] leading-tight text-(--ink) hover:bg-(--ink-muted)/5"
      style={{ gridTemplateColumns: GRID_COLS }}
    >
      <div className="min-w-0">{nameEl}</div>
      <div className="min-w-0 whitespace-nowrap tabular-nums">{p.birthDate ?? '—'}</div>
      <div className="min-w-0 whitespace-nowrap tabular-nums">{p.deathDate ?? '—'}</div>
      <div className="min-w-0 truncate whitespace-nowrap text-[10px] leading-tight text-(--ink-muted)">
        {birthPlaceCol || '—'}
      </div>
      <div className="min-w-0">
        <ParentCell id={p.fatherId} byId={byId} />
      </div>
      <div className="min-w-0">
        <ParentCell id={p.motherId} byId={byId} />
      </div>
    </div>
  );
});

const FAMILY_SEARCH_PERSON_DATASETS = getFamilySearchPersonDatasets();

export function FamilySearchPersonsSection() {
  const { t, locale } = useLocaleRoutes();
  const [datasetId, setDatasetId] = useState(() => FAMILY_SEARCH_PERSON_DATASETS[0]!.id);
  const bundle = useMemo(() => {
    const row = FAMILY_SEARCH_PERSON_DATASETS.find((d) => d.id === datasetId);
    return (row ?? FAMILY_SEARCH_PERSON_DATASETS[0]!).getBundle();
  }, [datasetId]);
  const all = bundle.persons;

  const onDatasetChange = useCallback((next: string) => {
    setDatasetId(next);
    setQuery('');
  }, []);

  const byId = useMemo(() => buildById(all), [all]);

  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<FamilySearchPersonsSortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);

  const onSortHeaderClick = useCallback(
    (key: FamilySearchPersonsSortKey) => {
      if (key === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      else {
        setSortKey(key);
        setSortDir('asc');
      }
    },
    [sortKey],
  );

  const baseList = useMemo(() => all.filter((p) => p.kind !== 'parentOnly'), [all]);

  const prepared = useMemo(
    () => baseList.map((p) => ({ person: p, hay: personHaystack(p) })),
    [baseList],
  );

  const sortedFiltered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    const list = q ? prepared.filter((x) => x.hay.includes(q)).map((x) => x.person) : prepared.map((x) => x.person);
    list.sort((a, b) => compareRows(a, b, sortKey, sortDir, locale, byId));
    return list;
  }, [prepared, debouncedQuery, locale, sortKey, sortDir, byId]);

  const scrollParentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: sortedFiltered.length,
    getScrollElement: () => scrollParentRef.current,
    estimateSize: () => 30,
    overscan: 14,
    getItemKey: (index) => sortedFiltered[index]?.id ?? index,
  });

  useEffect(() => {
    scrollParentRef.current?.scrollTo({ top: 0 });
  }, [debouncedQuery, sortKey, sortDir, datasetId]);

  const isSearchPending = query.trim() !== debouncedQuery.trim();

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden min-h-[calc(100vh-10rem)] md:min-h-0 md:flex-none">
      <div
        className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:max-h-[calc(100vh-4rem)] md:max-w-[calc((100vh-6rem)*296/210)] md:aspect-[296/210] md:min-h-[320px] md:flex-initial md:rounded-lg ${BOOK_SPREAD_SHADOW_MD}`}
      >
        <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
          <BookPage className="flex min-h-0 flex-col gap-2 overflow-y-auto p-2 sm:p-4 md:p-5">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <select
                value={datasetId}
                onChange={(e) => onDatasetChange(e.target.value)}
                className="box-border h-8 min-w-[8.5rem] max-w-[12rem] shrink-0 rounded border border-(--ink-muted)/30 bg-(--paper) px-2 text-xs leading-tight text-(--ink) outline-none focus:border-(--accent)"
                aria-label={t('familySearchDatasetSelectAria')}
              >
                {FAMILY_SEARCH_PERSON_DATASETS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {t(d.i18nLabelKey)}
                  </option>
                ))}
              </select>
              <div className="min-h-8 min-w-0 flex-1 basis-[min(100%,10rem)]">
                <SearchField
                  wrapperClassName="h-8"
                  placeholder={t('familySearchSearchPlaceholder')}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label={t('familySearchSearchPlaceholder')}
                />
              </div>
            </div>
            <p className="text-[11px] leading-tight text-(--ink-muted)">
              {isSearchPending ? t('familySearchSearchPending') : t('familySearchRowCount', { total: sortedFiltered.length })}
            </p>
            <div
              ref={scrollParentRef}
              className="min-h-0 flex-1 overflow-auto rounded-md border border-(--ink-muted)/25"
            >
              <div className="min-w-[800px]">
                <div
                  role="row"
                  className="sticky top-0 z-10 grid gap-x-1 border-b border-(--ink-muted)/20 bg-(--paper) px-1.5 py-1 text-left text-[10px] font-semibold uppercase tracking-wide shadow-[0_1px_0_var(--ink-muted)]"
                  style={{ gridTemplateColumns: GRID_COLS }}
                >
                  {(
                    [
                      ['name', t('familySearchColPerson')],
                      ['birth', t('familySearchColBirth')],
                      ['death', t('familySearchColDeath')],
                      ['place', t('familySearchColBirthPlace')],
                      ['father', t('familySearchParentFather')],
                      ['mother', t('familySearchParentMother')],
                    ] as const
                  ).map(([key, label]) => {
                    const active = sortKey === key;
                    const ariaSort = active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none';
                    return (
                      <div key={key} role="columnheader" aria-sort={ariaSort} className="min-w-0">
                        <button
                          type="button"
                          title={t('familySearchSortColumnHint')}
                          className={`flex w-full min-w-0 items-center gap-0.5 rounded-sm text-left uppercase tracking-wide transition-colors hover:bg-(--ink-muted)/10 hover:text-(--ink) ${active ? 'text-(--ink)' : 'text-(--ink-muted)'}`}
                          onClick={() => onSortHeaderClick(key)}
                        >
                          <span className="min-w-0 flex-1 leading-tight">{label}</span>
                          {active ? (
                            <span className="shrink-0 text-[9px] leading-none" aria-hidden>
                              {sortDir === 'asc' ? '▲' : '▼'}
                            </span>
                          ) : null}
                        </button>
                      </div>
                    );
                  })}
                </div>
                {sortedFiltered.length === 0 ? (
                  <div className="px-2 py-4 text-center text-[11px] text-(--ink-muted)">{t('nothingFound')}</div>
                ) : (
                  <div
                    className="relative w-full"
                    style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
                  >
                    {rowVirtualizer.getVirtualItems().map((vRow) => {
                      const p = sortedFiltered[vRow.index];
                      return (
                        <div
                          key={vRow.key}
                          ref={rowVirtualizer.measureElement}
                          data-index={vRow.index}
                          className="absolute left-0 top-0 w-full"
                          style={{ transform: `translateY(${vRow.start}px)` }}
                        >
                          <FamilySearchPersonRow person={p} byId={byId} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </BookPage>
        </div>
      </div>
    </div>
  );
}
