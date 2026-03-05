'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useClickOutside } from '@/hooks/useClickOutside';
import { STORAGE_KEYS } from '@/lib/constants/storage';
import {
  contrastColor,
  darkenColor,
  hexToHsl,
  hexToRgba,
  hslToHex,
  lightenColor,
} from '@/lib/utils/color';

const DEFAULT_PAPER = '#fef9c3';
const STORAGE_UPDATE_EVENT = 'genealogy-paper-storage-update';
const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

function getStoredPaper(): string {
  if (typeof window === 'undefined') return DEFAULT_PAPER;
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.paperColor);
    if (stored && HEX_RE.test(stored)) return stored;
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
    /** Фон светлее базового — почти белый, лёгкий оттенок */
    const paperLight = lightenColor(paper, 0.7);
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

  const paperRef = useRef(paper);
  paperRef.current = paper;

  const setPaper = (color: string) => {
    localStorage.setItem(STORAGE_KEYS.paperColor, color);
    paperRef.current = color;
    globalThis.dispatchEvent(new CustomEvent(STORAGE_UPDATE_EVENT));
  };

  useClickOutside(ref, () => setOpen(false), open);

  const hsl = hexToHsl(paper);

  const handleSaturationLightness = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
      const { h } = hexToHsl(paperRef.current);
      setPaper(hslToHex(h, x, 1 - y));
    },
    []
  );

  const handleHue = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const { s, l } = hexToHsl(paperRef.current);
      setPaper(hslToHex(x * 360, s, l));
    },
    []
  );

  const startDrag = useCallback(
    (type: 'sl' | 'h') =>
      (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        const target = e.currentTarget as HTMLElement;
        if (type === 'sl') {
          const synth: React.TouchEvent<HTMLDivElement> = { ...e, currentTarget: target } as never;
          handleSaturationLightness(synth);
        } else {
          const synth: React.TouchEvent<HTMLDivElement> = { ...e, currentTarget: target } as never;
          handleHue(synth);
        }
        const move = (ev: MouseEvent | TouchEvent) => {
          const rect = target.getBoundingClientRect();
          const clientX = 'touches' in ev ? (ev as TouchEvent).touches[0]?.clientX ?? rect.left : (ev as MouseEvent).clientX;
          const clientY = 'touches' in ev ? (ev as TouchEvent).touches[0]?.clientY ?? rect.top : (ev as MouseEvent).clientY;
          if (type === 'sl') {
            const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
            const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
            const { h } = hexToHsl(paperRef.current);
            setPaper(hslToHex(h, x, 1 - y));
          } else {
            const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
            const { s, l } = hexToHsl(paperRef.current);
            setPaper(hslToHex(x * 360, s, l));
          }
        };
        const up = () => {
          window.removeEventListener('mousemove', move);
          window.removeEventListener('mouseup', up);
          window.removeEventListener('touchmove', move);
          window.removeEventListener('touchend', up);
        };
        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', up);
        window.addEventListener('touchmove', move, { passive: false });
        window.addEventListener('touchend', up);
      },
    [handleSaturationLightness, handleHue]
  );

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
        <div
          className="absolute right-0 top-full mt-2 flex w-[220px] flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-xl"
          data-picker-area
        >
          <div
            className="relative h-[180px] w-full shrink-0 cursor-crosshair overflow-hidden rounded-lg border border-[var(--border-subtle)]"
            style={{
              background: `linear-gradient(to bottom, transparent, black),
                linear-gradient(to right, white, hsl(${hsl.h}, 100%, 50%))`,
            }}
            onMouseDown={startDrag('sl')}
            onTouchStart={startDrag('sl')}
            role="slider"
            aria-valuetext={paper}
            tabIndex={0}
          >
            <span
              className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md"
              style={{
                left: `${hsl.s * 100}%`,
                top: `${(1 - hsl.l) * 100}%`,
                backgroundColor: paper,
              }}
            />
          </div>
          <div
            className="relative h-4 w-full shrink-0 cursor-pointer overflow-hidden rounded border border-[var(--border-subtle)]"
            style={{
              background:
                'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
            }}
            onMouseDown={startDrag('h')}
            onTouchStart={startDrag('h')}
            role="slider"
            aria-valuetext={`Hue ${Math.round(hsl.h)}°`}
            tabIndex={0}
          >
            <span
              className="pointer-events-none absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full border border-black/30 bg-white shadow"
              style={{ left: `${(hsl.h / 360) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
