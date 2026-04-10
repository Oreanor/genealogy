'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Person } from '@/lib/types/person';
import { addPersonNameLock } from '@/lib/utils/personNameLocks';
import { mergeOnePerson } from '@/lib/utils/personMerge';
import type { Locale } from '@/lib/i18n/config';
import {
  isEmptyPersonRow,
  nextPersonId,
  sortPersonsByColumn,
  sortPersonsDefault,
  type SortDirection,
  type SortKey,
} from './adminPersonsTableUtils';

type Params = {
  initialPersons: Person[];
  locale: Locale;
  onDataChange?: (persons: Person[]) => void;
};

export function useAdminPersonsTableState({
  initialPersons,
  locale,
  onDataChange,
}: Params) {
  const [persons, setPersons] = useState<Person[]>(() =>
    sortPersonsDefault(
      JSON.parse(JSON.stringify(initialPersons)).map((w: Person) => {
        const bDisk =
          initialPersons.find((b) => b.id === w.id) ??
          ({
            ...w,
            firstName: '',
            lastName: '',
            patronymic: '',
          } as Person);
        return mergeOnePerson(bDisk, w, locale, true);
      })
    )
  );
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>(
    null
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const personsRef = useRef<Person[]>(persons);
  const prevLocaleRef = useRef(locale);
  const [sessionOrderIds, setSessionOrderIds] = useState<string[]>(() => {
    const merged = sortPersonsDefault(
      JSON.parse(JSON.stringify(initialPersons)).map((w: Person) => {
        const bDisk =
          initialPersons.find((b) => b.id === w.id) ??
          ({
            ...w,
            firstName: '',
            lastName: '',
            patronymic: '',
          } as Person);
        return mergeOnePerson(bDisk, w, locale, true);
      })
    );
    return merged.map((p) => p.id);
  });

  useEffect(() => {
    personsRef.current = persons;
  }, [persons]);

  useEffect(() => {
    onDataChange?.(persons);
  }, [persons, onDataChange]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setPersons((prev) =>
        sortPersonsDefault(
          prev.map((w) => {
            const bDisk =
              initialPersons.find((b) => b.id === w.id) ??
              ({
                ...w,
                firstName: '',
                lastName: '',
                patronymic: '',
              } as Person);
            return mergeOnePerson(bDisk, w, locale, true);
          })
        )
      );
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [locale, initialPersons]);

  useLayoutEffect(() => {
    const localeChanged = prevLocaleRef.current !== locale;
    prevLocaleRef.current = locale;
    if (!localeChanged) return;
    const timeoutId = window.setTimeout(() => {
      setSessionOrderIds(() => {
        const nextPersons = persons;
        const emptyRows = nextPersons.filter(isEmptyPersonRow);
        const filledRows = nextPersons.filter((p) => !isEmptyPersonRow(p));
        const sortedFilled = sortPersonsDefault(filledRows);
        return [...emptyRows, ...sortedFilled].map((p) => p.id);
      });
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [persons, locale]);

  useEffect(() => {
    // Reorder only on explicit sort change (not on every cell edit).
    setSessionOrderIds(() => {
      const nextPersons = personsRef.current;
      const emptyRows = nextPersons.filter(isEmptyPersonRow);
      const filledRows = nextPersons.filter((p) => !isEmptyPersonRow(p));
      const sortedFilled = sortConfig
        ? sortPersonsByColumn(filledRows, sortConfig.key, sortConfig.direction)
        : sortPersonsDefault(filledRows);
      return [...emptyRows, ...sortedFilled].map((p) => p.id);
    });
  }, [sortConfig]);

  useEffect(() => {
    // Keep current visual order during edits; only reconcile add/remove rows.
    const timeoutId = window.setTimeout(() => {
      setSessionOrderIds((prev) => {
        const currentIds = persons.map((p) => p.id);
        const currentSet = new Set(currentIds);
        const kept = prev.filter((id) => currentSet.has(id));
        const keptSet = new Set(kept);
        const added = currentIds.filter((id) => !keptSet.has(id));
        if (added.length === 0 && kept.length === prev.length) return prev;
        return [...kept, ...added];
      });
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [persons]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSelectedIds((prev) => {
        const ids = new Set(persons.map((p) => p.id));
        const next = new Set<string>();
        prev.forEach((id) => {
          if (ids.has(id)) next.add(id);
        });
        return next;
      });
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [persons]);

  const sortedPersons = useMemo(() => {
    const byId = new Map(persons.map((p): [string, Person] => [p.id, p]));
    const ordered = sessionOrderIds
      .map((id) => byId.get(id))
      .filter((p): p is Person => Boolean(p));
    if (ordered.length === persons.length) return ordered;
    const seen = new Set(ordered.map((p) => p.id));
    const tail = persons.filter((p) => !seen.has(p.id));
    return [...ordered, ...tail];
  }, [persons, sessionOrderIds]);

  const personIndexById = useMemo(
    () => new Map(persons.map((p, idx): [string, number] => [p.id, idx])),
    [persons]
  );

  const updatePerson = useCallback((index: number, field: keyof Person, value: Person[keyof Person]) => {
    setPersons((prev) => {
      const id = prev[index]?.id;
      if (
        id &&
        (field === 'firstName' || field === 'lastName' || field === 'patronymic')
      ) {
        addPersonNameLock(id);
      }
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

  const addRow = useCallback(() => {
    setPersons((prev) => {
      const newPerson: Person = {
        id: nextPersonId(prev),
        firstName: '',
        birthPlace: '',
        residenceCity: '',
        occupation: '',
        comment: '',
        gender: 'm',
      };
      // New empty row should appear at the top immediately.
      setSessionOrderIds((order) => [newPerson.id, ...order.filter((id) => id !== newPerson.id)]);
      return [newPerson, ...prev];
    });
  }, []);

  const removeSelectedRows = useCallback(() => {
    setPersons((prev) => prev.filter((p) => !selectedIds.has(p.id)));
    setSelectedIds(new Set());
  }, [selectedIds]);

  const cycleSort = useCallback((key: SortKey) => {
    setSortConfig((prev) => {
      if (!prev || prev.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      return null;
    });
  }, []);

  return {
    persons,
    setPersons,
    sortedPersons,
    personIndexById,
    selectedIds,
    setSelectedIds,
    sortConfig,
    cycleSort,
    addRow,
    removeSelectedRows,
    updatePerson,
    setParent,
  };
}
