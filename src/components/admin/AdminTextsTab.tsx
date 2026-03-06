'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from '@/lib/i18n/context';
import { Eye, EyeOff } from 'lucide-react';
import { Button, Input } from '@/components/ui/atoms';
import { Dialog } from '@/components/ui/molecules/Dialog';
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
  const [confirmDeleteIdx, setConfirmDeleteIdx] = useState<number | null>(null);
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
    <div className="flex flex-col" style={{ height: 'calc(100vh - 160px)' }}>
      <div className="flex min-h-0 flex-1 gap-4">
      {/* Left: list of titles + add button */}
      <div className="flex w-[20%] min-w-[180px] flex-col gap-2 border-r border-(--border-subtle) pr-4">
        <Button variant="secondary" onClick={addEntry} className="shrink-0 whitespace-nowrap">
          + {t('adminAddEntry')}
        </Button>
        <ul className="min-h-0 flex-1 overflow-y-auto">
          {entries.map((entry, idx) => (
            <li
              key={idx}
              className={`group flex cursor-pointer items-center gap-1 px-2 py-1.5 text-sm transition-colors ${
                selectedIdx === idx
                  ? 'bg-(--accent)/10 font-medium text-(--ink)'
                  : 'text-(--ink-muted) hover:text-(--ink)'
              }`}
              onClick={() => setSelectedIdx(idx)}
            >
              <span className={`min-w-0 flex-1 truncate ${entry.hidden ? 'opacity-40' : ''}`}>
                {entry.title || t('adminHistoryTitle')}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  updateEntry(idx, 'hidden', !entry.hidden);
                }}
                className={`shrink-0 p-0.5 transition-opacity ${entry.hidden ? 'text-(--ink-muted)' : 'text-(--ink-muted) opacity-0 group-hover:opacity-100'}`}
                aria-label={entry.hidden ? t('adminShow') : t('adminHide')}
                title={entry.hidden ? t('adminShow') : t('adminHide')}
              >
                {entry.hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDeleteIdx(idx);
                }}
                className="shrink-0 p-0.5 text-(--ink-muted) opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-600"
                aria-label={t('adminDeleteEntry')}
                title={t('adminDeleteEntry')}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Right: persons, title, rich text */}
      <div className="min-w-0 min-h-0 flex-1 flex flex-col gap-3 overflow-hidden">
        {selectedEntry !== null && selectedIdx !== null ? (
          <>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <span className="text-sm font-medium text-(--ink)">{t('adminHistoryPersons')}:</span>
              {selectedEntry.personIds.map((id) => {
                const person = persons.find((p) => p.id === id);
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 text-sm text-(--ink)"
                  >
                    {getFullName(person) || id}
                    <button
                      type="button"
                      onClick={() => removePersonFromEntry(selectedIdx, id)}
                      className="text-(--ink-muted) hover:text-red-600"
                    >
                      ✕
                    </button>
                  </span>
                );
              })}
              <div className="relative inline-block" ref={pickerRef}>
                <button
                  type="button"
                  onClick={() => { setPickerOpen((v) => !v); setPickerQuery(''); }}
                  className="text-sm text-(--accent) hover:underline"
                >
                  + {t('adminAddPerson')}
                </button>
                {pickerOpen && (
                  <div className="absolute left-0 top-full z-10 mt-1 min-w-[16rem] rounded-lg border border-(--border) bg-(--paper) shadow-lg">
                    <Input
                      type="text"
                      value={pickerQuery}
                      onChange={(e) => setPickerQuery(e.target.value)}
                      placeholder={t('adminSearchPersons')}
                      className="rounded-t-lg rounded-b-none border-b border-(--border-subtle) px-3 py-2 placeholder:text-(--ink-muted)"
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
                              className="w-full px-3 py-1.5 text-left text-sm text-(--ink) hover:bg-(--border-subtle)"
                            >
                              {getFullName(p) || p.id}
                            </button>
                          </li>
                        ))}
                      {filteredPersons.filter((p) => !selectedEntry.personIds.includes(p.id)).length === 0 && (
                        <li className="px-3 py-2 text-sm text-(--ink-muted)">
                          {t('adminNoPersonsMatch')}
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <Input
              type="text"
              value={selectedEntry.title}
              onChange={(e) => updateEntry(selectedIdx, 'title', e.target.value)}
              placeholder={t('adminHistoryTitle')}
              className="shrink-0 bg-(--paper) px-3 py-2"
            />

            <div className="min-h-0 flex-1 overflow-hidden">
              <RichTextEditor
                value={selectedEntry.richText}
                onChange={(html) => updateEntry(selectedIdx, 'richText', html)}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-(--ink-muted)">
            {entries.length === 0 ? t('adminNoEntries') : t('adminSelectEntry')}
          </div>
        )}
      </div>
      </div>

      <Dialog
        open={confirmDeleteIdx !== null}
        onClose={() => setConfirmDeleteIdx(null)}
        title={t('adminDeleteEntry')}
        variant="confirm"
        confirmLabel={t('dialogConfirm')}
        cancelLabel={t('adminCancel')}
        onConfirm={() => {
          if (confirmDeleteIdx !== null) {
            removeEntry(confirmDeleteIdx);
            setConfirmDeleteIdx(null);
          }
        }}
      >
        {t('adminDeleteTextConfirm')}
      </Dialog>
    </div>
  );
}
