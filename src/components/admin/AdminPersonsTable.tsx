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

/** Root person first, then others by numeric id (p001, p002, …) */
function sortPersonsForEdit(ps: Person[], rootId: string): Person[] {
  return [...ps].sort((a, b) => {
    if (a.id === rootId) return -1;
    if (b.id === rootId) return 1;
    const na = personIdNum(a.id);
    const nb = personIdNum(b.id);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
    return a.id.localeCompare(b.id);
  });
}

/** Table columns (no id, no #); Father/Mother rendered separately. */
const COLUMNS: (keyof Person)[] = [
  'firstName',
  'patronymic',
  'lastName',
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
}

export function AdminPersonsTable({
  rootPersonId,
  initialPersons,
  photos,
  onDataChange,
  onRootChange,
}: AdminPersonsTableProps) {
  const t = useTranslations();
  const [persons, setPersons] = useState<Person[]>(
    () => sortPersonsForEdit(JSON.parse(JSON.stringify(initialPersons)), rootPersonId)
  );
  const [confirmRootOpen, setConfirmRootOpen] = useState(false);
  const [pendingRootId, setPendingRootId] = useState<string | null>(null);
  const [confirmDeleteIdx, setConfirmDeleteIdx] = useState<number | null>(null);
  const [parentPicker, setParentPicker] = useState<{ rowIdx: number; type: 'father' | 'mother' } | null>(null);
  const [parentPickerQuery, setParentPickerQuery] = useState('');
  const parentPickerRef = useRef<HTMLDivElement>(null);
  const [avatarPickerRowIdx, setAvatarPickerRowIdx] = useState<number | null>(null);

  useEffect(() => {
    onDataChange?.(persons);
  }, [persons, onDataChange]);

  const sortedPersons = useMemo(
    () => sortPersonsForEdit(persons, rootPersonId),
    [persons, rootPersonId]
  );

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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={addRow}>
          {t('adminAddRow')}
        </Button>
      </div>
      <div className="overflow-auto border border-(--border) bg-(--paper) max-h-[calc(100vh-210px)]">
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
                  className="border-l border-(--border-subtle) p-2 text-left font-medium text-(--ink)"
                >
                  {COLUMN_LABELS[col] ? t(COLUMN_LABELS[col]!) : col}
                </th>
              ))}
              <th className="w-24 border-l border-(--border-subtle) p-2 text-left font-medium text-(--ink)">
                {t('adminAvatarColumn')}
              </th>
              <th className="min-w-[120px] border-l border-(--border-subtle) p-2 text-left font-medium text-(--ink)">
                {t('adminFatherColumn')}
              </th>
              <th className="min-w-[120px] border-l border-(--border-subtle) p-2 text-left font-medium text-(--ink)">
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
                <td className="border-l border-(--border-subtle) p-1 align-middle">
                  <div className="flex items-center gap-1">
                    {(() => {
                      const avatar = getAvatarForPerson(person.id, person.avatarPhotoSrc);
                      if (avatar) {
                        return <FaceThumbnail source={avatar} size={32} />;
                      }
                      return null;
                    })()}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAvatarPickerRowIdx(actualIdx)}
                      className="shrink-0"
                    >
                      {t('adminSelectAvatar')}
                    </Button>
                  </div>
                </td>
                {(['father', 'mother'] as const).map((type) => {
                  const parentId = getParentId(person, type);
                  const parent = parentId ? persons.find((p) => p.id === parentId) : null;
                  const isOpen = parentPicker?.rowIdx === actualIdx && parentPicker?.type === type;
                  return (
                    <td key={type} className="relative border-l border-(--border-subtle) p-1">
                      <div className="relative min-w-[100px]" ref={isOpen ? parentPickerRef : undefined}>
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
        const options = getAvatarOptionsForPersonFromList(photos, person.id);
        return (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
            role="dialog"
            aria-modal
            aria-label={t('adminAvatarColumn')}
          >
            <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl border-2 border-(--border) bg-(--surface) p-4 shadow-xl">
              <h2 className="mb-3 text-center text-lg font-semibold text-(--ink)">
                {t('adminAvatarColumn')}
              </h2>
              <p className="mb-3 text-center text-sm text-(--ink-muted)">
                {getFullName(person) || person.id}
              </p>
              <div className="min-h-0 flex-1 overflow-y-auto">
                {options.length === 0 ? (
                  <p className="text-center text-(--ink-muted)">{t('adminNoEntries')}</p>
                ) : (
                  <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-6">
                    <button
                      type="button"
                      onClick={() => {
                        updatePerson(avatarPickerRowIdx, 'avatarPhotoSrc', undefined);
                        setAvatarPickerRowIdx(null);
                      }}
                      className="flex flex-col items-center gap-1 rounded-lg border-2 border-dashed border-(--border-subtle) p-2 text-(--ink-muted) hover:border-(--accent) hover:bg-(--paper-light)"
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
                        className={`flex flex-col items-center gap-1 rounded-lg border-2 p-2 focus:outline-none ${
                          person.avatarPhotoSrc === opt.src
                            ? 'border-(--accent) bg-(--paper-light)'
                            : 'border-(--border-subtle) hover:border-(--accent)'
                        }`}
                      >
                        <FaceThumbnail source={opt} size={56} />
                      </button>
                    ))}
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
