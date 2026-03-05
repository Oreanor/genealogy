'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ROOT_PERSON_ID } from '@/lib/constants/chapters';
import { useTranslations } from '@/lib/i18n/context';
import type { Person } from '@/lib/types/person';

/** Root person first, then others by id */
function sortPersonsForEdit(ps: Person[]): Person[] {
  return [...ps].sort((a, b) => {
    if (a.id === ROOT_PERSON_ID) return -1;
    if (b.id === ROOT_PERSON_ID) return 1;
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
    .map((p) => {
      const m = p.id.match(/^person-(\d+)$/);
      return m ? parseInt(m[1]!, 10) : 0;
    })
    .filter((n) => !Number.isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return `person-${max + 1}`;
}

interface AdminPersonsTableProps {
  initialPersons: Person[];
  onDataChange?: (persons: Person[]) => void;
}

export function AdminPersonsTable({ initialPersons, onDataChange }: AdminPersonsTableProps) {
  const t = useTranslations();
  const [persons, setPersons] = useState<Person[]>(
    () => sortPersonsForEdit(JSON.parse(JSON.stringify(initialPersons)))
  );

  useEffect(() => {
    onDataChange?.(persons);
  }, [persons, onDataChange]);

  const sortedPersons = useMemo(
    () => sortPersonsForEdit(persons),
    [persons]
  );

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
          {t('adminPersonsHint', { id: ROOT_PERSON_ID })}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={addRow}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--ink)] hover:bg-[var(--paper-light)]"
        >
          {t('adminAddRow')}
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--paper)]">
        <table className="w-full min-w-[800px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface)]">
              <th className="w-10 p-2 text-left font-medium text-[var(--ink)]">#</th>
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
              return (
              <tr
                key={person.id + displayIdx}
                className="border-b border-[var(--border-subtle)] hover:bg-[var(--paper-light)]/50"
              >
                <td className="p-2 text-[var(--ink-muted)]">{displayIdx + 1}</td>
                {COLUMNS.map((col) => (
                  <td
                    key={col}
                    className="border-l border-[var(--border-subtle)] p-1"
                  >
                    {col === 'parentIds' ? (
                      <input
                        type="text"
                        value={(person.parentIds ?? []).join(', ')}
                        onChange={(e) =>
                          updatePerson(
                            actualIdx,
                            'parentIds',
                            e.target.value.split(/[,\s]+/).filter(Boolean)
                          )
                        }
                        className="w-full min-w-[100px] rounded border border-[var(--border-subtle)] bg-transparent px-2 py-1 text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none"
                      />
                    ) : col === 'gender' ? (
                      <select
                        value={String(person.gender ?? '')}
                        onChange={(e) =>
                          updatePerson(actualIdx, 'gender', (e.target.value || undefined) as 'm' | 'f' | undefined)
                        }
                        className="w-full min-w-[60px] rounded border border-[var(--border-subtle)] bg-transparent px-2 py-1 text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none"
                      >
                        <option value="">—</option>
                        <option value="m">m</option>
                        <option value="f">f</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={String((person as unknown as Record<string, unknown>)[col] ?? '')}
                        onChange={(e) =>
                          updatePerson(actualIdx, col, e.target.value)
                        }
                        className="w-full min-w-[80px] rounded border border-[var(--border-subtle)] bg-transparent px-2 py-1 text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none"
                      />
                    )}
                  </td>
                ))}
                <td className="p-1">
                  <button
                    type="button"
                    onClick={() => removeRow(actualIdx)}
                    className="rounded p-1.5 text-[var(--ink-muted)] transition-colors hover:bg-red-500/20 hover:text-red-600"
                    aria-label={t('adminDeleteRow')}
                    title={t('adminDeleteRow')}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
