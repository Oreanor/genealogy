'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from '@/lib/i18n/context';
import type { HistoryEntry } from '@/lib/types/history';
import type { Person } from '@/lib/types/person';
import { getFullName } from '@/lib/utils/person';
import { RichTextEditor } from './RichTextEditor';

interface AdminTextsTabProps {
  initialHistory: HistoryEntry[];
  persons: Person[];
  onHistoryChange?: (entries: HistoryEntry[]) => void;
}

const emptyEntry: HistoryEntry = {
  title: '',
  richText: '',
  personIds: [],
};

export function AdminTextsTab({
  initialHistory,
  persons,
  onHistoryChange,
}: AdminTextsTabProps) {
  const t = useTranslations();
  const [entries, setEntries] = useState<HistoryEntry[]>(() =>
    JSON.parse(JSON.stringify(initialHistory.length > 0 ? initialHistory : [emptyEntry]))
  );
  const [pickerForEntry, setPickerForEntry] = useState<number | null>(null);
  const [pickerQuery, setPickerQuery] = useState('');
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onHistoryChange?.(entries);
  }, [entries, onHistoryChange]);

  const updateEntry = useCallback((idx: number, field: keyof HistoryEntry, value: unknown) => {
    setEntries((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx]!, [field]: value };
      return next;
    });
  }, []);

  const addEntry = useCallback(() => {
    setEntries((prev) => [...prev, { ...emptyEntry }]);
  }, []);

  const removeEntry = useCallback((idx: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== idx));
    if (pickerForEntry === idx) setPickerForEntry(null);
    else if (pickerForEntry !== null && pickerForEntry > idx) setPickerForEntry(pickerForEntry - 1);
  }, [pickerForEntry]);

  const addPersonToEntry = useCallback((entryIdx: number, personId: string) => {
    setEntries((prev) => {
      const next = [...prev];
      const entry = next[entryIdx]!;
      if (entry.personIds.includes(personId)) return prev;
      next[entryIdx] = { ...entry, personIds: [...entry.personIds, personId] };
      return next;
    });
  }, []);

  const removePersonFromEntry = useCallback((entryIdx: number, personId: string) => {
    setEntries((prev) => {
      const next = [...prev];
      const entry = next[entryIdx]!;
      next[entryIdx] = { ...entry, personIds: entry.personIds.filter((id) => id !== personId) };
      return next;
    });
  }, []);

  const filteredPersons = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    if (!q) return persons;
    return persons.filter((p) => {
      const name = (getFullName(p) || p.id).toLowerCase();
      return name.includes(q) || p.id.toLowerCase().includes(q);
    });
  }, [persons, pickerQuery]);

  useEffect(() => {
    if (pickerForEntry === null) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerForEntry(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [pickerForEntry]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-[var(--ink)]">{t('chapters_history')}</h3>
        <button
          type="button"
          onClick={addEntry}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--ink)] hover:bg-[var(--paper-light)]"
        >
          + {t('adminAddEntry')}
        </button>
      </div>

      {entries.map((entry, idx) => (
        <div
          key={idx}
          className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--paper)] p-4"
        >
          <div className="flex items-center justify-between gap-2">
            <input
              type="text"
              value={entry.title}
              onChange={(e) => updateEntry(idx, 'title', e.target.value)}
              placeholder={t('adminHistoryTitle')}
              className="min-w-0 flex-1 rounded border border-[var(--border-subtle)] bg-transparent px-3 py-2 text-[var(--ink)]"
            />
            <button
              type="button"
              onClick={() => removeEntry(idx)}
              className="shrink-0 text-[var(--ink-muted)] hover:text-red-600"
            >
              ✕
            </button>
          </div>

          <RichTextEditor
            value={entry.richText}
            onChange={(html) => updateEntry(idx, 'richText', html)}
          />

          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-[var(--ink)]">
              {t('adminHistoryPersons')}
            </span>
            <div className="flex flex-wrap gap-2">
              {entry.personIds.map((id) => {
                const person = persons.find((p) => p.id === id);
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 rounded-md border border-[var(--border-subtle)] bg-[var(--surface)] px-2 py-1 text-sm text-[var(--ink)]"
                  >
                    {getFullName(person) || id}
                    <button
                      type="button"
                      onClick={() => removePersonFromEntry(idx, id)}
                      className="text-[var(--ink-muted)] hover:text-red-600"
                    >
                      ✕
                    </button>
                  </span>
                );
              })}
            </div>
            <div className="relative" ref={pickerForEntry === idx ? pickerRef : null}>
              <button
                type="button"
                onClick={() => {
                  if (pickerForEntry === idx) setPickerForEntry(null);
                  else {
                    setPickerQuery('');
                    setPickerForEntry(idx);
                  }
                }}
                className="rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--ink)] hover:bg-[var(--paper-light)]"
              >
                + {t('adminAddPerson')}
              </button>
              {pickerForEntry === idx && (
                <div className="absolute left-0 top-full z-10 mt-1 min-w-[16rem] rounded-lg border border-[var(--border)] bg-[var(--paper)] shadow-lg">
                  <input
                    type="text"
                    value={pickerQuery}
                    onChange={(e) => setPickerQuery(e.target.value)}
                    placeholder={t('adminSearchPersons')}
                    className="w-full rounded-t-lg border-b border-[var(--border-subtle)] bg-transparent px-3 py-2 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none"
                    autoFocus
                  />
                  <ul className="max-h-48 overflow-y-auto py-1">
                    {filteredPersons
                      .filter((p) => !entry.personIds.includes(p.id))
                      .map((p) => (
                        <li key={p.id}>
                          <button
                            type="button"
                            onClick={() => addPersonToEntry(idx, p.id)}
                            className="w-full px-3 py-2 text-left text-sm text-[var(--ink)] hover:bg-[var(--surface)]"
                          >
                            {getFullName(p) || p.id}
                          </button>
                        </li>
                      ))}
                    {filteredPersons.filter((p) => !entry.personIds.includes(p.id)).length === 0 && (
                      <li className="px-3 py-2 text-sm text-[var(--ink-muted)]">
                        {t('adminNoPersonsMatch')}
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
