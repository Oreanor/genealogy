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
  const [selectedIdx, setSelectedIdx] = useState<number | null>(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('');
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onHistoryChange?.(entries);
  }, [entries, onHistoryChange]);

  useEffect(() => {
    if (selectedIdx === null || selectedIdx < entries.length) return;
    const id = setTimeout(
      () => setSelectedIdx(entries.length > 0 ? entries.length - 1 : null),
      0
    );
    return () => clearTimeout(id);
  }, [entries.length, selectedIdx]);

  const updateEntry = useCallback((idx: number, field: keyof HistoryEntry, value: unknown) => {
    setEntries((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx]!, [field]: value };
      return next;
    });
  }, []);

  const addEntry = useCallback(() => {
    setEntries((prev) => [...prev, { ...emptyEntry }]);
    setSelectedIdx(entries.length);
  }, [entries.length]);

  const removeEntry = useCallback((idx: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== idx));
    if (selectedIdx === idx) setSelectedIdx(null);
    else if (selectedIdx !== null && selectedIdx > idx) setSelectedIdx(selectedIdx - 1);
  }, [selectedIdx]);

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
    if (!pickerOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [pickerOpen]);

  const selectedEntry = selectedIdx !== null ? entries[selectedIdx] ?? null : null;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] p-3 text-sm text-[var(--ink)]">
        <p className="font-medium">{t('adminHowItWorks')}</p>
        <p className="mt-1 text-[var(--ink-muted)]">{t('adminHistoryHowItWorks')}</p>
        <p className="mt-1 text-[var(--ink-muted)]">{t('adminSaveReminder')}</p>
      </div>
      <div className="flex h-[70vh] min-h-[400px] gap-4">
      {/* Left: list of titles + add button */}
      <div className="flex w-[20%] min-w-[180px] flex-col gap-2 border-r border-[var(--border-subtle)] pr-4">
        <button
          type="button"
          onClick={addEntry}
          className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--ink)] hover:bg-[var(--paper-light)]"
        >
          + {t('adminAddEntry')}
        </button>
        <ul className="min-h-0 flex-1 overflow-y-auto space-y-1">
          {entries.map((entry, idx) => (
            <li key={idx}>
              <button
                type="button"
                onClick={() => setSelectedIdx(idx)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  selectedIdx === idx
                    ? 'bg-[var(--accent)] text-[var(--nav-btn-ink)]'
                    : 'text-[var(--ink)] hover:bg-[var(--paper-light)]'
                }`}
              >
                {entry.title || t('adminHistoryTitle')}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Right: ~80% — title, rich text, persons */}
      <div className="min-w-0 flex-1 flex flex-col gap-4 overflow-hidden">
        {selectedEntry !== null && selectedIdx !== null ? (
          <>
            <div className="flex shrink-0 items-center gap-2">
              <input
                type="text"
                value={selectedEntry.title}
                onChange={(e) => updateEntry(selectedIdx, 'title', e.target.value)}
                placeholder={t('adminHistoryTitle')}
                className="min-w-0 flex-1 rounded border border-[var(--border-subtle)] bg-[var(--paper)] px-3 py-2 text-[var(--ink)]"
              />
              <button
                type="button"
                onClick={() => removeEntry(selectedIdx)}
                className="shrink-0 rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--ink-muted)] hover:text-red-600"
              >
                ✕ {t('adminDeleteEntry')}
              </button>
            </div>

            <div className="min-h-0 flex-1 flex flex-col gap-2 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--paper)] p-4">
              <RichTextEditor
                value={selectedEntry.richText}
                onChange={(html) => updateEntry(selectedIdx, 'richText', html)}
              />
            </div>

            <div className="shrink-0 flex flex-col gap-1">
              <span className="text-sm font-medium text-[var(--ink)]">
                {t('adminHistoryPersons')}
              </span>
              <div className="flex flex-wrap gap-2">
                {selectedEntry.personIds.map((id) => {
                  const person = persons.find((p) => p.id === id);
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 rounded-md border border-[var(--border-subtle)] bg-[var(--surface)] px-2 py-1 text-sm text-[var(--ink)]"
                    >
                      {getFullName(person) || id}
                      <button
                        type="button"
                        onClick={() => removePersonFromEntry(selectedIdx, id)}
                        className="text-[var(--ink-muted)] hover:text-red-600"
                      >
                        ✕
                      </button>
                    </span>
                  );
                })}
              </div>
              <div className="relative" ref={pickerRef}>
                <button
                  type="button"
                  onClick={() => { setPickerOpen((v) => !v); setPickerQuery(''); }}
                  className="rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--ink)] hover:bg-[var(--paper-light)]"
                >
                  + {t('adminAddPerson')}
                </button>
                {pickerOpen && (
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
                        .filter((p) => !selectedEntry.personIds.includes(p.id))
                        .map((p) => (
                          <li key={p.id}>
                            <button
                              type="button"
                              onClick={() => {
                                addPersonToEntry(selectedIdx, p.id);
                                setPickerOpen(false);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-[var(--ink)] hover:bg-[var(--surface)]"
                            >
                              {getFullName(p) || p.id}
                            </button>
                          </li>
                        ))}
                      {filteredPersons.filter((p) => !selectedEntry.personIds.includes(p.id)).length === 0 && (
                        <li className="px-3 py-2 text-sm text-[var(--ink-muted)]">
                          {t('adminNoPersonsMatch')}
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--paper-light)] text-[var(--ink-muted)]">
            {entries.length === 0 ? t('adminNoEntries') : t('adminSelectEntry')}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
