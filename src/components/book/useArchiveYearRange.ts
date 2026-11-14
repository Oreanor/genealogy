'use client';

import { startTransition, useCallback, useEffect, useRef, useState } from 'react';

export type YearBounds = { min: number; max: number };
export type YearRange = { lo: number; hi: number };

type RangeState = {
  /** Bounds the state was created for; stale state is discarded on render. */
  boundsKey: string;
  /** Range shown by the slider (updates on every pointer move). */
  slider: YearRange;
  /** Range applied to the map (lags the slider by at most one frame). */
  map: YearRange;
};

const boundsKeyOf = (b: YearBounds) => `${b.min}:${b.max}`;

const fullRangeState = (bounds: YearBounds): RangeState => {
  const full = { lo: bounds.min, hi: bounds.max };
  return { boundsKey: boundsKeyOf(bounds), slider: full, map: full };
};

/** Clamps a range into `bounds` and orders its ends. */
export function clampYearRange(range: YearRange, bounds: YearBounds): YearRange {
  const clamp = (y: number) => Math.min(Math.max(y, bounds.min), bounds.max);
  const a = clamp(range.lo);
  const b = clamp(range.hi);
  return { lo: Math.min(a, b), hi: Math.max(a, b) };
}

/**
 * Year-range state for archive maps.
 *
 * The slider range updates immediately; the map range is synced once per
 * animation frame (inside a transition) so Leaflet isn't rebuilt on every
 * pointer move. When `bounds` change, both ranges reset to the full span.
 */
export function useArchiveYearRange(bounds: YearBounds) {
  const { min, max } = bounds;
  const boundsKey = boundsKeyOf(bounds);
  const [state, setState] = useState(() => fullRangeState(bounds));
  const current = state.boundsKey === boundsKey ? state : fullRangeState(bounds);

  const rafRef = useRef<number | null>(null);
  const pendingRef = useRef<{ boundsKey: string; range: YearRange } | null>(null);

  const cancelPendingSync = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    pendingRef.current = null;
  }, []);

  useEffect(() => cancelPendingSync, [cancelPendingSync]);

  const setSliderRange = useCallback(
    (next: YearRange) => {
      const key = boundsKeyOf({ min, max });
      setState((prev) => {
        const base = prev.boundsKey === key ? prev : fullRangeState({ min, max });
        return { ...base, slider: next };
      });
      pendingRef.current = { boundsKey: key, range: next };
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const pending = pendingRef.current;
        pendingRef.current = null;
        if (!pending) return;
        startTransition(() => {
          setState((prev) =>
            prev.boundsKey === pending.boundsKey ? { ...prev, map: pending.range } : prev,
          );
        });
      });
    },
    [min, max],
  );

  /** Narrows slider and map to a single year at once (no frame delay). */
  const jumpToYear = useCallback(
    (year: number) => {
      cancelPendingSync();
      const range = { lo: year, hi: year };
      setState({ boundsKey, slider: range, map: range });
    },
    [boundsKey, cancelPendingSync],
  );

  return {
    sliderRange: clampYearRange(current.slider, bounds),
    mapRange: clampYearRange(current.map, bounds),
    setSliderRange,
    jumpToYear,
  };
}
