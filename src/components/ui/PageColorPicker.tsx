'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useClickOutside } from '@/hooks/useClickOutside';
import { STORAGE_KEYS } from '@/lib/constants/storage';
import {
  contrastColor,
  darkenColor,
  hexToRgba,
  lightenColor,
} from '@/lib/utils/color';

const PALETTE = [
  '#ffffff', '#e5e7eb', '#9ca3af', '#374151', // белый, серый, тёмно-серый
  '#fef9c3', '#fbbf24', '#f97316', '#ef4444', // крем, жёлтый, оранжевый, красный
  '#ecfdf5', '#22c55e', '#0ea5e9', '#3b82f6', // мятный, зелёный, голубой, синий
  '#f5f3ff', '#8b5cf6', '#a16207', '#1f2937', // лаванда, фиолетовый, коричневый, почти чёрный
];

const DEFAULT_PAPER = '#fef9c3';
const STORAGE_UPDATE_EVENT = 'genealogy-paper-storage-update';

function getStoredPaper(): string {
  if (typeof window === 'undefined') return DEFAULT_PAPER;
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.paperColor);
    if (stored && PALETTE.includes(stored)) return stored;
  } catch {
    // ignore
  }
  return DEFAULT_PAPER;
}

function subscribeToStorage(onStoreChange: () => void) {
  const handler = () => onStoreChange();
  globalThis.addEventListener(STORAGE_UPDATE_EVENT, handler);
  globalThis.addEventListener('storage', handler);
  return () => {
    globalThis.removeEventListener(STORAGE_UPDATE_EVENT, handler);
    globalThis.removeEventListener('storage', handler);
  };
}

export function PageColorPicker() {
  const paper = useSyncExternalStore(
    subscribeToStorage,
    getStoredPaper,
    () => DEFAULT_PAPER
  );
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ink = contrastColor(paper);
    const paperLight = lightenColor(paper, 0.35);
    const bookBg = darkenColor(paper, 0.25);
    const accent = darkenColor(paper, 0.5);
    const accentHover = darkenColor(paper, 0.6);
    const isDark = ink === '#ffffff';
    const theme: Record<string, string> = {
      paper,
      'paper-light': paperLight,
      ink,
      link: ink,
      'link-hover': isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.75)',
      'book-bg': bookBg,
      accent,
      'accent-hover': accentHover,
      'nav-btn-ink': contrastColor(accent),
      'tree-plaque-fill': paperLight,
      border: hexToRgba(accentHover, 0.4),
      'border-subtle': hexToRgba(accent, 0.2),
      surface: paperLight,
      'ink-muted': isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.75)',
      'hotspot-stroke': hexToRgba(accent, 0.5),
      'hotspot-fill': hexToRgba(accent, 0.15),
      'hotspot-fill-hover': hexToRgba(accent, 0.3),
    };
    const root = document.documentElement.style;
    Object.entries(theme).forEach(([key, value]) =>
      root.setProperty(`--${key}`, value)
    );
  }, [paper]);

  const setPaper = (color: string) => {
    localStorage.setItem(STORAGE_KEYS.paperColor, color);
    globalThis.dispatchEvent(new CustomEvent(STORAGE_UPDATE_EVENT));
  };

  useClickOutside(ref, () => setOpen(false), open);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-9 cursor-pointer flex-shrink-0 items-center justify-center rounded-lg border-2 border-[var(--border)] bg-[var(--paper)] shadow-md transition-shadow hover:shadow-lg md:h-11 md:w-11"
        aria-label="Цвет страниц"
        aria-expanded={open}
      >
        <span
          className="h-4 w-4 rounded border border-[var(--border-subtle)] md:h-5 md:w-5"
          style={{ backgroundColor: paper }}
        />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 grid w-[220px] grid-cols-4 gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xl">
          {PALETTE.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => {
                setPaper(color);
                setOpen(false);
              }}
              className="h-11 w-11 shrink-0 cursor-pointer rounded-lg border-2 transition-transform hover:scale-105"
              style={{
                backgroundColor: color,
                borderColor: color === paper ? 'var(--accent)' : 'rgba(0,0,0,0.1)',
              }}
              aria-label={`Цвет ${color}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
