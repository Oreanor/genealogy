'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from '@/lib/i18n/context';
import type { Person } from '@/lib/types/person';
import { Dialog } from '@/components/ui/molecules/Dialog';
import { Button, Input, Select } from '@/components/ui/atoms';

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

const COLUMNS: (keyof Person)[] = [
  'id',
  'firstName',
  'patronymic',
  'lastName',
  'birthDate',
  'deathDate',
  'birthPlace',
  'occupation',
  'photoUrl',
  'parentIds',
  'gender',
];

const COLUMN_LABELS: Partial<Record<keyof Person, string>> = {
  firstName: 'adminFirstName',
  patronymic: 'adminPatronymic',
  lastName: 'adminLastName',
  birthDate: 'adminBirthDate',
  deathDate: 'adminDeathDate',
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
  onDataChange?: (persons: Person[]) => void;
  onRootChange?: (personId: string) => void;
}

export function AdminPersonsTable({
  rootPersonId,
  initialPersons,
  onDataChange,
  onRootChange,
}: AdminPersonsTableProps) {
  const t = useTranslations();
  const [persons, setPersons] = useState<Person[]>(
    () => sortPersonsForEdit(JSON.parse(JSON.stringify(initialPersons)), rootPersonId)
  );
  const [confirmRootOpen, setConfirmRootOpen] = useState(false);
  const [pendingRootId, setPendingRootId] = useState<string | null>(null);

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
      if (field === 'parentIds') {
        const v = value as string | string[];
        p.parentIds = Array.isArray(v) ? v : (typeof v === 'string' ? v.split(/[,\s]+/).filter(Boolean) : []);
      } else {
        (p as Record<string, unknown>)[field] = value;
      }
      next[index] = p;
      return next;
    });
  }, []);

  const addRow = useCallback(() => {
    setPersons((prev) => [
      ...prev,
      {
        id: nextPersonId(prev),
        firstName: '',
        birthPlace: '',
        occupation: '',
        parentIds: [],
        gender: 'm',
      },
    ]);
  }, []);

  const removeRow = useCallback((index: number) => {
    setPersons((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] p-3 text-sm text-[var(--ink)]">
        <p className="font-medium">{t('adminHowItWorks')}</p>
        <p className="mt-1 text-[var(--ink-muted)]">
          {t('adminPersonsHint', { id: rootPersonId })}
        </p>
        <p className="mt-1 text-[var(--ink-muted)]">{t('adminSaveReminder')}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={addRow}>
          {t('adminAddRow')}
        </Button>
      </div>
      <div className="overflow-auto rounded-xl border border-[var(--border)] bg-[var(--paper)] max-h-[60vh]">
        <table className="w-full min-w-[800px] border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-[var(--surface)] shadow-[0_1px_0_0_var(--border-subtle)]">
            <tr className="border-b border-[var(--border)]">
              <th className="w-10 p-2 text-left font-medium text-[var(--ink)]">#</th>
              <th className="w-12 border-l border-[var(--border-subtle)] p-2 text-center font-medium text-[var(--ink)]" title={t('adminRootColumn')}>
                {t('adminRootColumn')}
              </th>
              {COLUMNS.map((col) => (
                <th
                  key={col}
                  className="border-l border-[var(--border-subtle)] p-2 text-left font-medium text-[var(--ink)]"
                >
                  {COLUMN_LABELS[col] ? t(COLUMN_LABELS[col]!) : col}
                </th>
              ))}
              <th className="w-14 p-2" />
            </tr>
          </thead>
          <tbody>
            {sortedPersons.map((person, displayIdx) => {
              const actualIdx = persons.findIndex((p) => p.id === person.id);
              const isRoot = person.id === rootPersonId;
              return (
              <tr
                key={person.id + displayIdx}
                className="border-b border-[var(--border-subtle)] hover:bg-[var(--paper-light)]/50"
              >
                <td className="p-2 text-[var(--ink-muted)]">{displayIdx + 1}</td>
                <td className="border-l border-[var(--border-subtle)] p-1 text-center">
                  {isRoot ? (
                    <span className="text-[var(--accent)]" title={t('adminRootColumn')}>★</span>
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
                    className="border-l border-[var(--border-subtle)] p-1"
                  >
                    {col === 'parentIds' ? (
                      <Input
                        type="text"
                        value={(person.parentIds ?? []).join(', ')}
                        onChange={(e) =>
                          updatePerson(
                            actualIdx,
                            'parentIds',
                            e.target.value.split(/[,\s]+/).filter(Boolean)
                          )
                        }
                        className="min-w-[100px]"
                      />
                    ) : col === 'gender' ? (
                      <Select
                        value={String(person.gender ?? '')}
                        onChange={(e) =>
                          updatePerson(actualIdx, 'gender', (e.target.value || undefined) as 'm' | 'f' | undefined)
                        }
                        className="min-w-[60px]"
                      >
                        <option value="">—</option>
                        <option value="m">m</option>
                        <option value="f">f</option>
                      </Select>
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
                <td className="p-1">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => removeRow(actualIdx)}
                    className="rounded p-1.5"
                    aria-label={t('adminDeleteRow')}
                    title={t('adminDeleteRow')}
                  >
                    ✕
                  </Button>
                </td>
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
    </div>
  );
}
