'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { TranslationFn } from '@/lib/i18n/types';

/** Minimum query length before suggestions are shown. */
export const ARCHIVE_SEARCH_MIN_QUERY = 3;

export type ArchiveSearchOption = {
  key: string;
  primary: string;
  secondary: string;
  ariaLabel: string;
};

type Props<T> = {
  /** Unique id prefix (listbox and option ids are derived from it). */
  id: string;
  t: TranslationFn;
  query: string;
  onQueryChange: (query: string) => void;
  suggestions: readonly T[];
  toOption: (item: T, index: number) => ArchiveSearchOption;
  onPick: (item: T) => void;
};

/**
 * Name search over an archive map, following the WAI-ARIA combobox pattern:
 * focus stays in the input, ↑/↓ move the active option, Enter picks it,
 * Escape or a click outside closes the list.
 */
export function ArchiveNameSearch<T>({
  id,
  t,
  query,
  onQueryChange,
  suggestions,
  toOption,
  onPick,
}: Props<T>) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const listId = `${id}-suggestions`;
  const queryLongEnough = query.trim().length >= ARCHIVE_SEARCH_MIN_QUERY;
  const expanded = open && queryLongEnough;
  const active = activeIndex < suggestions.length ? activeIndex : -1;
  const optionId = (index: number) => `${id}-option-${index}`;

  useEffect(() => {
    if (!expanded) return;
    const onDocPointerDown = (ev: PointerEvent) => {
      const root = wrapRef.current;
      if (root && ev.target instanceof Node && root.contains(ev.target)) return;
      setOpen(false);
    };
    document.addEventListener('pointerdown', onDocPointerDown, true);
    return () => document.removeEventListener('pointerdown', onDocPointerDown, true);
  }, [expanded]);

  const pick = (item: T) => {
    setOpen(false);
    setActiveIndex(-1);
    onPick(item);
  };

  const onKeyDown = (ev: KeyboardEvent<HTMLInputElement>) => {
    switch (ev.key) {
      case 'Escape':
        if (!expanded) return;
        ev.preventDefault();
        setOpen(false);
        return;
      case 'ArrowDown':
      case 'ArrowUp': {
        if (!queryLongEnough || suggestions.length === 0) return;
        ev.preventDefault();
        setOpen(true);
        const step = ev.key === 'ArrowDown' ? 1 : -1;
        const n = suggestions.length;
        setActiveIndex(active < 0 ? (step > 0 ? 0 : n - 1) : (active + step + n) % n);
        return;
      }
      case 'Enter': {
        const item = expanded && active >= 0 ? suggestions[active] : undefined;
        if (item === undefined) return;
        ev.preventDefault();
        pick(item);
        return;
      }
    }
  };

  return (
    <div ref={wrapRef} className="pointer-events-auto relative w-[min(20rem,70vw)]">
      <input
        type="search"
        role="combobox"
        value={query}
        onChange={(ev) => {
          onQueryChange(ev.target.value);
          setActiveIndex(-1);
          setOpen(ev.target.value.trim().length >= ARCHIVE_SEARCH_MIN_QUERY);
        }}
        onFocus={() => {
          if (queryLongEnough) setOpen(true);
        }}
        onKeyDown={onKeyDown}
        placeholder={t('mapArchiveSearchPlaceholder')}
        className="h-8 w-full rounded-md border border-(--ink-muted)/45 bg-(--paper)/95 px-2 text-sm text-(--ink) shadow-sm backdrop-blur-[1px] outline-none placeholder:text-(--ink-muted)/80 focus:border-(--accent)"
        aria-label={t('mapArchiveSearchAria')}
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-activedescendant={expanded && active >= 0 ? optionId(active) : undefined}
        autoComplete="off"
      />
      {expanded ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={t('mapArchiveSearchListAria')}
          className="absolute left-0 right-0 top-full z-[460] mt-1 max-h-[min(16rem,40vh)] overflow-y-auto rounded-md border border-(--ink-muted)/40 bg-(--paper) py-1 text-sm text-(--ink) shadow-lg"
        >
          {suggestions.length === 0 ? (
            <li className="px-2 py-2 text-xs text-(--ink-muted)" role="presentation">
              {t('mapArchiveSearchNoResults')}
            </li>
          ) : (
            suggestions.map((item, index) => {
              const option = toOption(item, index);
              const isActive = index === active;
              return (
                <li
                  key={option.key}
                  id={optionId(index)}
                  role="option"
                  aria-selected={isActive}
                  aria-label={option.ariaLabel}
                  className={`flex w-full cursor-pointer flex-col gap-0.5 px-2 py-1.5 text-left hover:bg-(--ink-muted)/12 ${
                    isActive ? 'bg-(--ink-muted)/12' : ''
                  }`}
                  onPointerDown={(ev) => {
                    // Keep focus in the input and pick before it blurs.
                    ev.preventDefault();
                    pick(item);
                  }}
                >
                  <span className="font-medium leading-tight">{option.primary}</span>
                  <span className="text-xs text-(--ink-muted)">{option.secondary}</span>
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}
