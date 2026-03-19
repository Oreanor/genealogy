'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from '@/lib/i18n/context';
import type { Person } from '@/lib/types/person';
import { getFullName } from '@/lib/utils/person';
import {
  getAvatarForPerson,
  getAvatarOptionsForPersonFromList,
  getAvatarCropStyles,
  type AvatarSource,
} from '@/lib/data/photos';
import type { PhotoEntry } from '@/lib/types/photo';
import { Dialog } from '@/components/ui/molecules/Dialog';
import { Button, Input } from '@/components/ui/atoms';
import { ImageIcon } from 'lucide-react';

function FaceThumbnail({ source, size = 40 }: { source: AvatarSource; size?: number }) {
  const { src, faceRect } = source;
  const wrapperStyle = { width: size, height: size };
  if (faceRect) {
    return (
      <span
        className="inline-block overflow-hidden rounded-full bg-(--paper-light)"
        style={wrapperStyle}
      >
        <span
          className="block h-full w-full"
          style={getAvatarCropStyles(faceRect, src)}
          aria-hidden
        />
      </span>
    );
  }
  return (
    <span
      className="inline-block overflow-hidden rounded-full bg-(--paper-light)"
      style={wrapperStyle}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="h-full w-full object-cover" />
    </span>
  );
}

const PERSON_ID_PAD = 3;

/** Numeric part of id (e.g. p001, p002) for sorting; NaN otherwise */
function personIdNum(id: string): number {
  const m = /^p(\d+)$/.exec(id);
  return m ? Number.parseInt(m[1]!, 10) : Number.NaN;
}

function isEmptyPersonRow(person: Person): boolean {
  const last = (person.lastName ?? '').trim();
  const first = (person.firstName ?? '').trim();
  const patr = (person.patronymic ?? '').trim();
  return last === '' && first === '' && patr === '';
}

/** Empty/new rows first, then by surname alphabetically. */
function sortPersonsDefault(ps: Person[]): Person[] {
  return [...ps].sort((a, b) => {
    const aLast = (a.lastName ?? '').trim();
    const bLast = (b.lastName ?? '').trim();
    const aFirst = (a.firstName ?? '').trim();
    const bFirst = (b.firstName ?? '').trim();
    const aPatr = (a.patronymic ?? '').trim();
    const bPatr = (b.patronymic ?? '').trim();

    const aEmpty = aLast === '' && aFirst === '' && aPatr === '';
    const bEmpty = bLast === '' && bFirst === '' && bPatr === '';
    if (aEmpty !== bEmpty) return aEmpty ? -1 : 1;

    if (aLast !== bLast) return aLast.localeCompare(bLast, 'ru', { sensitivity: 'base' });
    if (aFirst !== bFirst) return aFirst.localeCompare(bFirst, 'ru', { sensitivity: 'base' });
    if (aPatr !== bPatr) return aPatr.localeCompare(bPatr, 'ru', { sensitivity: 'base' });

    const na = personIdNum(a.id);
    const nb = personIdNum(b.id);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
    return a.id.localeCompare(b.id, 'ru', { sensitivity: 'base' });
  });
}

type SortDirection = 'asc' | 'desc';
type SortKey = keyof Person;

function compareValues(a: string, b: string): number {
  return a.localeCompare(b, 'ru', { sensitivity: 'base', numeric: true });
}

function sortPersonsByColumn(
  ps: Person[],
  sortBy: SortKey,
  direction: SortDirection
): Person[] {
  const factor = direction === 'asc' ? 1 : -1;
  return [...ps].sort((a, b) => {
    const av = String(a[sortBy] ?? '').trim();
    const bv = String(b[sortBy] ?? '').trim();
    const cmp = compareValues(av, bv);
    if (cmp !== 0) return cmp * factor;

    // Stable tie-breaker: default persons ordering.
    return sortPersonsDefault([a, b])[0] === a ? -1 : 1;
  });
}

/** Table columns (no id, no #); Father/Mother rendered separately. */
const COLUMNS: (keyof Person)[] = [
  'lastName',
  'firstName',
  'patronymic',
  'birthDate',
  'deathDate',
  'birthPlace',
  'residenceCity',
  'occupation',
  'comment',
  'gender',
];

const COLUMN_LABELS: Partial<Record<keyof Person, string>> = {
  firstName: 'adminFirstName',
  patronymic: 'adminPatronymic',
  lastName: 'adminLastName',
  birthDate: 'adminBirthDate',
  deathDate: 'adminDeathDate',
  birthPlace: 'adminBirthPlace',
  residenceCity: 'adminResidenceCity',
  occupation: 'adminOccupation',
  comment: 'adminComment',
  gender: 'adminGender',
};

const INITIAL_COLUMN_WIDTHS: Record<string, number> = {
  lastName: 120,
  firstName: 120,
  patronymic: 120,
  birthDate: 92,
  deathDate: 92,
  birthPlace: 110,
  residenceCity: 110,
  occupation: 120,
  comment: 140,
  gender: 56,
  avatar: 52,
  father: 180,
  mother: 180,
};

function minWidthForColumn(id: string): number {
  if (id === 'gender') return 48;
  if (id === 'avatar') return 44;
  if (id === 'birthDate' || id === 'deathDate') return 82;
  if (id === 'father' || id === 'mother') return 120;
  return 90;
}

function nextPersonId(persons: Person[]): string {
  const nums = persons
    .map((p) => personIdNum(p.id))
    .filter((n) => !Number.isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return `p${String(max + 1).padStart(PERSON_ID_PAD, '0')}`;
}

interface AdminPersonsTableProps {
  rootPersonId: string;
  initialPersons: Person[];
  photos: PhotoEntry[];
  onDataChange?: (persons: Person[]) => void;
  onRootChange?: (personId: string) => void;
  onAddRowActionChange?: (action: (() => void) | null) => void;
}

export function AdminPersonsTable({
  rootPersonId,
  initialPersons,
  photos,
  onDataChange,
  onRootChange,
  onAddRowActionChange,
}: AdminPersonsTableProps) {
  const t = useTranslations();
  const [persons, setPersons] = useState<Person[]>(
    () => sortPersonsDefault(JSON.parse(JSON.stringify(initialPersons)))
  );
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>(null);
  const [confirmRootOpen, setConfirmRootOpen] = useState(false);
  const [pendingRootId, setPendingRootId] = useState<string | null>(null);
  const [confirmDeleteIdx, setConfirmDeleteIdx] = useState<number | null>(null);
  const [parentPicker, setParentPicker] = useState<{ rowIdx: number; type: 'father' | 'mother' } | null>(null);
  const [parentPickerQuery, setParentPickerQuery] = useState('');
  const parentPickerRef = useRef<HTMLDivElement>(null);
  const [avatarPickerRowIdx, setAvatarPickerRowIdx] = useState<number | null>(null);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(INITIAL_COLUMN_WIDTHS);
  const resizingRef = useRef<{ id: string; startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    onDataChange?.(persons);
  }, [persons, onDataChange]);

  const sortedPersons = useMemo(() => {
    const emptyRows = persons.filter(isEmptyPersonRow);
    const filledRows = persons.filter((p) => !isEmptyPersonRow(p));
    const sortedFilled = sortConfig
      ? sortPersonsByColumn(filledRows, sortConfig.key, sortConfig.direction)
      : sortPersonsDefault(filledRows);
    return [...emptyRows, ...sortedFilled];
  }, [persons, sortConfig]);

  const handleSetRootClick = useCallback(
    (personId: string) => {
      if (personId === rootPersonId) return;
      setPendingRootId(personId);
      setConfirmRootOpen(true);
    },
    [rootPersonId]
  );

  const handleConfirmRoot = useCallback(() => {
    if (pendingRootId) {
      onRootChange?.(pendingRootId);
      setPendingRootId(null);
    }
  }, [pendingRootId, onRootChange]);

  const updatePerson = useCallback((index: number, field: keyof Person, value: Person[keyof Person]) => {
    setPersons((prev) => {
      const next = [...prev];
      const p = { ...next[index]! };
      (p as Record<string, unknown>)[field] = value;
      next[index] = p;
      return next;
    });
  }, []);

  const setParent = useCallback((index: number, type: 'father' | 'mother', personId: string) => {
    setPersons((prev) => {
      const next = [...prev];
      const p = { ...next[index]! };
      if (type === 'father') p.fatherId = personId || undefined;
      else p.motherId = personId || undefined;
      next[index] = p;
      return next;
    });
  }, []);

  const getParentId = useCallback((person: Person, type: 'father' | 'mother') => {
    return type === 'father' ? (person.fatherId ?? '') : (person.motherId ?? '');
  }, []);

  const filteredPickerPersons = useMemo(() => {
    if (!parentPickerQuery.trim()) return persons;
    const q = parentPickerQuery.trim().toLowerCase();
    return persons.filter((p) => {
      const name = (getFullName(p) || p.id).toLowerCase();
      return name.includes(q) || p.id.toLowerCase().includes(q);
    });
  }, [persons, parentPickerQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (parentPickerRef.current && !parentPickerRef.current.contains(e.target as Node)) {
        setParentPicker(null);
      }
    };
    if (parentPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [parentPicker]);

  const addRow = useCallback(() => {
    setPersons((prev) => [
      ...prev,
      {
        id: nextPersonId(prev),
        firstName: '',
        birthPlace: '',
        residenceCity: '',
        occupation: '',
        comment: '',
        gender: 'm',
      },
    ]);
  }, []);

  const removeRow = useCallback((index: number) => {
    setPersons((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const cycleSort = useCallback((key: SortKey) => {
    setSortConfig((prev) => {
      if (!prev || prev.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      return null;
    });
  }, []);

  useEffect(() => {
    onAddRowActionChange?.(addRow);
    return () => onAddRowActionChange?.(null);
  }, [addRow, onAddRowActionChange]);

  const startResize = useCallback((id: string, clientX: number) => {
    const startWidth = columnWidths[id] ?? INITIAL_COLUMN_WIDTHS[id] ?? minWidthForColumn(id);
    resizingRef.current = { id, startX: clientX, startWidth };

    const onMove = (e: MouseEvent) => {
      const st = resizingRef.current;
      if (!st) return;
      const nextWidth = Math.max(
        minWidthForColumn(st.id),
        st.startWidth + (e.clientX - st.startX)
      );
      setColumnWidths((prev) => ({ ...prev, [st.id]: nextWidth }));
    };
    const onUp = () => {
      resizingRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [columnWidths]);

  const handleResizeMouseDown = useCallback(
    (id: string) => (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      startResize(id, e.clientX);
    },
    [startResize]
  );

  const renderResizeHandle = (id: string) => (
    <div
      className="absolute -right-1 top-0 z-20 h-full w-4 cursor-col-resize select-none"
      onMouseDown={handleResizeMouseDown(id)}
      title=""
    >
      <span className="pointer-events-none absolute inset-y-1 left-1/2 w-px -translate-x-1/2 bg-(--border-subtle) opacity-0" />
    </div>
  );

  return (
    <div className="space-y-2">
      <div className="md:hidden">
        <Button variant="secondary" onClick={addRow}>
          {t('adminAddRow')}
        </Button>
      </div>
      <div className="overflow-auto border border-(--border) bg-(--paper) max-h-[calc(100vh-170px)]">
        <table className="w-full min-w-[800px] border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-(--surface) shadow-[0_1px_0_0_var(--border-subtle)]">
            <tr className="border-b border-(--border)">
              <th className="w-14 p-2" title={t('adminRemove')} />
              <th className="w-12 border-l border-(--border-subtle) p-2 text-center font-medium text-(--ink)" title={t('adminRootColumn')}>
                {t('adminRootColumn')}
              </th>
              {COLUMNS.map((col) => (
                <th
                  key={col}
                  style={{ width: columnWidths[col], minWidth: columnWidths[col] }}
                  className="group relative cursor-pointer select-none border-l border-(--border-subtle) p-2 pr-3 text-left font-medium text-(--ink)"
                  onClick={() => cycleSort(col)}
                >
                  <span className="inline-flex items-center gap-1">
                    {COLUMN_LABELS[col] ? t(COLUMN_LABELS[col]!) : col}
                    <span className="text-[10px] font-normal leading-none opacity-70">
                      {sortConfig?.key === col
                        ? sortConfig.direction === 'asc'
                          ? '▲'
                          : '▼'
                        : ''}
                    </span>
                  </span>
                  {renderResizeHandle(col)}
                </th>
              ))}
              <th
                style={{ width: columnWidths.avatar, minWidth: columnWidths.avatar }}
                className="group relative border-l border-(--border-subtle) p-1 pr-3 text-center font-medium text-(--ink)"
              >
                {t('adminPortraitColumn')}
                {renderResizeHandle('avatar')}
              </th>
              <th
                style={{ width: columnWidths.father, minWidth: columnWidths.father }}
                className="group relative border-l border-(--border-subtle) p-2 pr-3 text-left font-medium text-(--ink)"
              >
                {t('adminFatherColumn')}
                {renderResizeHandle('father')}
              </th>
              <th
                style={{ width: columnWidths.mother, minWidth: columnWidths.mother }}
                className="group relative border-l border-(--border-subtle) p-2 text-left font-medium text-(--ink)"
              >
                {t('adminMotherColumn')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedPersons.map((person, displayIdx) => {
              const actualIdx = persons.findIndex((p) => p.id === person.id);
              const isRoot = person.id === rootPersonId;
              return (
              <tr
                key={person.id + displayIdx}
                className="border-b border-(--border-subtle) hover:bg-(--paper-light)/50"
              >
                <td className="p-1">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setConfirmDeleteIdx(actualIdx)}
                    className="rounded p-1.5"
                    aria-label={t('adminRemove')}
                    title={t('adminRemove')}
                  >
                    ✕
                  </Button>
                </td>
                <td className="border-l border-(--border-subtle) p-1 text-center">
                  {isRoot ? (
                    <span className="text-(--accent)" title={t('adminRootColumn')}>★</span>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetRootClick(person.id)}
                      className="w-full rounded py-1"
                      title={t('adminRootColumn')}
                      aria-label={t('adminRootChangeConfirm')}
                    >
                      —
                    </Button>
                  )}
                </td>
                {COLUMNS.map((col) => (
                  <td
                    key={col}
                    style={{ width: columnWidths[col], minWidth: columnWidths[col] }}
                    className="border-l border-(--border-subtle) p-1"
                  >
                    {col === 'gender' ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          updatePerson(actualIdx, 'gender', (person.gender === 'f' ? 'm' : 'f') as 'm' | 'f')
                        }
                        className="min-w-[2rem] font-medium"
                        title={t('adminGender')}
                      >
                        {(person.gender ?? 'm') === 'f' ? t('adminGenderF') : t('adminGenderM')}
                      </Button>
                    ) : (
                      <Input
                        value={String((person as unknown as Record<string, unknown>)[col] ?? '')}
                        onChange={(e) =>
                          updatePerson(actualIdx, col, e.target.value)
                        }
                        className="min-w-[80px]"
                      />
                    )}
                  </td>
                ))}
                <td
                  style={{ width: columnWidths.avatar, minWidth: columnWidths.avatar }}
                  className="border-l border-(--border-subtle) p-0.5 align-middle text-center"
                >
                  {(() => {
                    const avatar = getAvatarForPerson(person.id, person.avatarPhotoSrc);
                    return (
                      <button
                        type="button"
                        onClick={() => setAvatarPickerRowIdx(actualIdx)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-(--border-subtle) bg-(--paper-light) hover:border-(--accent) focus:outline-none"
                        title={t('adminSelectAvatar')}
                        aria-label={t('adminSelectAvatar')}
                      >
                        {avatar ? (
                          <FaceThumbnail source={avatar} size={28} />
                        ) : (
                          <ImageIcon className="size-3.5 text-(--ink-muted)" aria-hidden />
                        )}
                      </button>
                    );
                  })()}
                </td>
                {(['father', 'mother'] as const).map((type) => {
                  const parentId = getParentId(person, type);
                  const parent = parentId ? persons.find((p) => p.id === parentId) : null;
                  const isOpen = parentPicker?.rowIdx === actualIdx && parentPicker?.type === type;
                  return (
                    <td
                      key={type}
                      style={{ width: columnWidths[type], minWidth: columnWidths[type] }}
                      className="relative border-l border-(--border-subtle) p-1"
                    >
                      <div className="relative min-w-0" ref={isOpen ? parentPickerRef : undefined}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setParentPicker({ rowIdx: actualIdx, type });
                            setParentPickerQuery('');
                          }}
                          className="w-full justify-start truncate font-normal"
                          title={type === 'father' ? t('adminFatherColumn') : t('adminMotherColumn')}
                        >
                          {parent ? getFullName(parent) || parent.id : '—'}
                        </Button>
                        {isOpen && (
                          <div className="absolute left-0 top-full z-20 mt-1 min-w-[200px] rounded-lg border border-(--border) bg-(--paper) p-2 shadow-lg">
                            <Input
                              type="text"
                              value={parentPickerQuery}
                              onChange={(e) => setParentPickerQuery(e.target.value)}
                              placeholder={t('adminSearchPersons')}
                              className="mb-2"
                              autoFocus
                            />
                            <ul className="max-h-40 overflow-y-auto">
                              <li>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setParent(actualIdx, type, '');
                                    setParentPicker(null);
                                  }}
                                  className="w-full justify-start"
                                >
                                  —
                                </Button>
                              </li>
                              {filteredPickerPersons
                                .filter((p) => p.id !== person.id)
                                .map((p) => (
                                  <li key={p.id}>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setParent(actualIdx, type, p.id);
                                        setParentPicker(null);
                                      }}
                                      className="w-full justify-start truncate font-normal"
                                    >
                                      {getFullName(p) || p.id}
                                    </Button>
                                  </li>
                                ))}
                              {filteredPickerPersons.filter((p) => p.id !== person.id).length === 0 && parentPickerQuery.trim() && (
                                <li className="px-2 py-1 text-sm text-(--ink-muted)">
                                  {t('adminNoPersonsMatch')}
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>
      <Dialog
        open={confirmRootOpen}
        onClose={() => { setConfirmRootOpen(false); setPendingRootId(null); }}
        title={t('adminRootColumn')}
        variant="confirm"
        confirmLabel={t('dialogConfirm')}
        cancelLabel={t('adminCancel')}
        onConfirm={handleConfirmRoot}
      >
        {t('adminRootChangeConfirm')}
      </Dialog>

      <Dialog
        open={confirmDeleteIdx !== null}
        onClose={() => setConfirmDeleteIdx(null)}
        title={t('adminRemove')}
        variant="confirm"
        confirmLabel={t('dialogConfirm')}
        cancelLabel={t('adminCancel')}
        onConfirm={() => {
          if (confirmDeleteIdx !== null) {
            removeRow(confirmDeleteIdx);
            setConfirmDeleteIdx(null);
          }
        }}
      >
        {t('adminDeletePersonConfirm')}
      </Dialog>

      {avatarPickerRowIdx !== null && (() => {
        const person = persons[avatarPickerRowIdx]!;
        const optionsRaw = getAvatarOptionsForPersonFromList(photos, person.id);
        const categoryBySrc = new Map(photos.map((p) => [p.src, p.category] as const));
        const options = [
          ...optionsRaw.filter((opt) => categoryBySrc.get(opt.src) === 'personal'),
          ...optionsRaw.filter((opt) => categoryBySrc.get(opt.src) === 'group'),
        ];
        return (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
            role="dialog"
            aria-modal
            aria-label={t('adminChoosePortrait')}
          >
            <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl border-2 border-(--border) bg-(--surface) p-4 shadow-xl">
              <h2 className="mb-3 text-center text-lg font-semibold text-(--ink)">
                {t('adminChoosePortrait')}
              </h2>
              <div className="min-h-0 flex-1 overflow-y-auto">
                {options.length === 0 ? (
                  <p className="text-center text-(--ink-muted)">{t('noPhotosYet')}</p>
                ) : (
                  <div className="flex justify-center">
                    <div className="flex w-full max-w-3xl flex-wrap justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          updatePerson(avatarPickerRowIdx, 'avatarPhotoSrc', undefined);
                          setAvatarPickerRowIdx(null);
                        }}
                        className="flex h-[88px] w-[88px] flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-(--border-subtle) p-2 text-(--ink-muted) hover:border-(--accent) hover:bg-(--paper-light)"
                      >
                        <span className="text-2xl">—</span>
                        <span className="text-xs">{t('adminAvatarDefault')}</span>
                      </button>
                      {options.map((opt, i) => (
                        <button
                          key={`${opt.src}-${i}`}
                          type="button"
                          onClick={() => {
                            updatePerson(avatarPickerRowIdx, 'avatarPhotoSrc', opt.src);
                            setAvatarPickerRowIdx(null);
                          }}
                          className={`flex h-[88px] w-[88px] flex-col items-center justify-center gap-1 rounded-lg border-2 p-2 focus:outline-none ${
                            person.avatarPhotoSrc === opt.src
                              ? 'border-(--accent) bg-(--paper-light)'
                              : 'border-(--border-subtle) hover:border-(--accent)'
                          }`}
                        >
                          <FaceThumbnail source={opt} size={56} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-3 flex justify-center">
                <Button variant="secondary" onClick={() => setAvatarPickerRowIdx(null)}>
                  {t('adminCancel')}
                </Button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
