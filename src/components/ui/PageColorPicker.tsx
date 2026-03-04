'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { contrastColor, darkenColor, lightenColor } from '@/lib/utils/color';

const PALETTE = [
  '#ffffff', '#e5e7eb', '#9ca3af', '#374151', // белый, серый, тёмно-серый
  '#fef9c3', '#fbbf24', '#f97316', '#ef4444', // крем, жёлтый, оранжевый, красный
  '#ecfdf5', '#22c55e', '#0ea5e9', '#3b82f6', // мятный, зелёный, голубой, синий
  '#f5f3ff', '#8b5cf6', '#a16207', '#1f2937', // лаванда, фиолетовый, коричневый, почти чёрный
];

const DEFAULT_PAPER = '#fef9c3';
const STORAGE_KEY = 'genealogy-paper-color';
const STORAGE_UPDATE_EVENT = 'genealogy-paper-storage-update';

function getStoredPaper(): string {
  if (typeof window === 'undefined') return DEFAULT_PAPER;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
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
    const bookBg = darkenColor(paper, 0.25);
    const navBtn = darkenColor(paper, 0.5);
    const navBtnHover = darkenColor(paper, 0.6);
    const navBtnInk = contrastColor(navBtn);
    const treePlaqueFill = lightenColor(paper, 0.35);
    document.documentElement.style.setProperty('--paper', paper);
    document.documentElement.style.setProperty('--ink', ink);
    document.documentElement.style.setProperty('--book-bg', bookBg);
    document.documentElement.style.setProperty('--nav-btn', navBtn);
    document.documentElement.style.setProperty('--nav-btn-hover', navBtnHover);
    document.documentElement.style.setProperty('--nav-btn-ink', navBtnInk);
    document.documentElement.style.setProperty('--tree-stroke', navBtn);
    document.documentElement.style.setProperty('--tree-plaque-fill', treePlaqueFill);
    document.documentElement.style.setProperty('--tree-plaque-stroke', navBtn);
    document.documentElement.style.setProperty('--accent', navBtn);
  }, [paper]);

  const setPaper = (color: string) => {
    localStorage.setItem(STORAGE_KEY, color);
    globalThis.dispatchEvent(new CustomEvent(STORAGE_UPDATE_EVENT));
  };

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [open]);

  return (
    <div className="absolute right-2 top-[2vh] z-20" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border-2 border-amber-800/40 bg-[var(--paper)] shadow-md transition-shadow hover:shadow-lg md:h-11 md:w-11"
        aria-label="Цвет страниц"
        aria-expanded={open}
      >
        <span
          className="h-4 w-4 rounded border border-amber-900/20 md:h-5 md:w-5"
          style={{ backgroundColor: paper }}
        />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 grid w-[220px] grid-cols-4 gap-3 rounded-xl border border-amber-800/30 bg-white p-4 shadow-xl">
          {PALETTE.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => {
                setPaper(color);
                setOpen(false);
              }}
              className="h-11 w-11 shrink-0 rounded-lg border-2 transition-transform hover:scale-105"
              style={{
                backgroundColor: color,
                borderColor: color === paper ? '#b45309' : 'rgba(0,0,0,0.1)',
              }}
              aria-label={`Цвет ${color}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
