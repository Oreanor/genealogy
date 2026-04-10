'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TranslationFn } from '@/lib/i18n/types';

/** Порог сдвига по X: меньше — считаем кликом по году, больше (внутри выделения) — перенос интервала. */
const HIST_PAN_THRESHOLD_PX = 6;

const HIST_BAR_AREA_PX = 50;

export type YearArchiveRangeSliderProps = {
  /** Абсолютные границы данных (концы линии). */
  minBound: number;
  maxBound: number;
  /** Текущий выбранный интервал (годы включительно). */
  low: number;
  high: number;
  onChange: (next: { low: number; high: number }) => void;
  /** Число событий в текущем диапазоне — над центром выделенного участка. */
  eventCount: number;
  /**
   * События по годам от minBound до maxBound включительно:
   * `countsByYear[i]` — число событий в годe `minBound + i`.
   * Столбчатая диаграмма той же ширины, что дорожка, высотой 50px; высота столбца пропорциональна count (масштаб по max).
   */
  countsByYear: number[];
  className?: string;
  t: TranslationFn;
};

/**
 * Два ползунка на общей линии, выделенный диапазон между ними.
 * Перетаскивание полоски между ползунками сдвигает оба на одинаковую величину.
 */
export function YearArchiveRangeSlider({
  minBound,
  maxBound,
  low,
  high,
  onChange,
  eventCount,
  countsByYear,
  className = '',
  t,
}: YearArchiveRangeSliderProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  /** Геометрия дорожки на момент старта перетаскивания — без layout на каждом pointermove. */
  const trackGeomRef = useRef<{ left: number; width: number } | null>(null);
  const [drag, setDrag] = useState<'low' | 'high' | 'range' | null>(null);
  const [hoverYear, setHoverYear] = useState<number | null>(null);
  const rangeStartRef = useRef<{ clientX: number; low: number; high: number } | null>(null);

  const span = Math.max(0, maxBound - minBound);

  const clampPair = useCallback(
    (a: number, b: number): { low: number; high: number } => {
      let lo = Math.min(a, b);
      let hi = Math.max(a, b);
      lo = Math.min(Math.max(lo, minBound), maxBound);
      hi = Math.min(Math.max(hi, minBound), maxBound);
      if (lo > hi) [lo, hi] = [hi, lo];
      return { low: lo, high: hi };
    },
    [minBound, maxBound],
  );

  useEffect(() => {
    if (!drag) {
      trackGeomRef.current = null;
      return;
    }

    const el = trackRef.current;
    if (el) {
      const r = el.getBoundingClientRect();
      trackGeomRef.current = { left: r.left, width: Math.max(1, r.width) };
    }

    const onMove = (e: PointerEvent) => {
      const geom = trackGeomRef.current;
      if (!geom || span <= 0) return;

      if (drag === 'range' && rangeStartRef.current) {
        const deltaX = e.clientX - rangeStartRef.current.clientX;
        const deltaYears = Math.round((deltaX / geom.width) * span);
        let nextLo = rangeStartRef.current.low + deltaYears;
        let nextHi = rangeStartRef.current.high + deltaYears;
        if (nextLo < minBound) {
          const s = minBound - nextLo;
          nextLo += s;
          nextHi += s;
        }
        if (nextHi > maxBound) {
          const s = nextHi - maxBound;
          nextLo -= s;
          nextHi -= s;
        }
        onChange(clampPair(nextLo, nextHi));
        return;
      }

      if (drag === 'low') {
        const t = Math.min(1, Math.max(0, (e.clientX - geom.left) / geom.width));
        const y = Math.round(minBound + t * span);
        onChange(clampPair(y, high));
        return;
      }

      if (drag === 'high') {
        const t = Math.min(1, Math.max(0, (e.clientX - geom.left) / geom.width));
        const y = Math.round(minBound + t * span);
        onChange(clampPair(low, y));
      }
    };

    const onUp = () => {
      rangeStartRef.current = null;
      trackGeomRef.current = null;
      setDrag(null);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [drag, span, minBound, maxBound, low, high, onChange, clampPair]);

  const startLow = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      rangeStartRef.current = null;
      setDrag('low');
    },
    [],
  );

  const startHigh = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    rangeStartRef.current = null;
    setDrag('high');
  }, []);

  const startRange = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      rangeStartRef.current = { clientX: e.clientX, low, high };
      setDrag('range');
    },
    [low, high],
  );

  const onYearColumnPointerDown = useCallback(
    (e: React.PointerEvent, year: number, inRange: boolean) => {
      e.preventDefault();
      const startX = e.clientX;
      let startedRange = false;

      const onMove = (ev: PointerEvent) => {
        if (startedRange) return;
        if (Math.abs(ev.clientX - startX) <= HIST_PAN_THRESHOLD_PX) return;
        if (!inRange) return;
        startedRange = true;
        rangeStartRef.current = { clientX: startX, low, high };
        setDrag('range');
      };

      const onUp = (ev: PointerEvent) => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
        if (startedRange) return;
        if (Math.abs(ev.clientX - startX) <= HIST_PAN_THRESHOLD_PX) {
          onChange({ low: year, high: year });
        }
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    },
    [low, high, onChange],
  );

  const onColPointerEnter = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const y = Number(e.currentTarget.dataset.year);
    if (Number.isFinite(y)) setHoverYear(y);
  }, []);

  const onColPointerLeave = useCallback(() => {
    setHoverYear(null);
  }, []);

  const yearSpan = maxBound - minBound + 1;

  const { histCounts, maxYearCount } = useMemo(() => {
    if (yearSpan <= 0) {
      return { histCounts: [] as number[], maxYearCount: 0 };
    }
    const hist =
      countsByYear.length === yearSpan
        ? countsByYear
        : Array.from({ length: yearSpan }, (_, i) => countsByYear[i] ?? 0);
    let maxC = 0;
    for (let i = 0; i < hist.length; i += 1) {
      const v = hist[i]!;
      if (v > maxC) maxC = v;
    }
    return { histCounts: hist, maxYearCount: maxC };
  }, [countsByYear, yearSpan]);

  const tickYears = useMemo(() => {
    const out: number[] = [];
    if (maxBound < minBound) return out;
    const first = Math.ceil(minBound / 50) * 50;
    for (let y = first; y <= maxBound; y += 50) {
      out.push(y);
    }
    return out;
  }, [minBound, maxBound]);

  if (span <= 0) {
    return (
      <div className={`text-center text-xs text-(--ink-muted) ${className}`}>
        {minBound}
      </div>
    );
  }

  const pLow = ((low - minBound) / span) * 100;
  const pHigh = ((high - minBound) / span) * 100;
  const leftPct = Math.min(pLow, pHigh);
  const widthPct = Math.abs(pHigh - pLow);
  const pMid = leftPct + widthPct / 2;

  return (
    <div className={`w-full ${className}`}>
      <div className="relative w-full touch-none select-none">
        <div className="pointer-events-none relative h-5 mb-0.5 w-full shrink-0 leading-none">
          {low === high ? (
            <span
              className="absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 font-mono text-xs tabular-nums"
              style={{ left: `calc(0.5rem + (100% - 1rem) * ${pLow / 100})` }}
            >
              <span className="text-(--ink-muted)">{low}</span>
              <span className="font-semibold text-(--ink)">{eventCount}</span>
            </span>
          ) : (
            <>
              <span
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 font-mono text-xs tabular-nums text-(--ink-muted)"
                style={{ left: `calc(0.5rem + (100% - 1rem) * ${pLow / 100})` }}
              >
                {low}
              </span>
              <span
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 font-mono text-xs font-semibold tabular-nums text-(--ink)"
                style={{ left: `calc(0.5rem + (100% - 1rem) * ${pMid / 100})` }}
              >
                {eventCount}
              </span>
              <span
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 font-mono text-xs tabular-nums text-(--ink-muted)"
                style={{ left: `calc(0.5rem + (100% - 1rem) * ${pHigh / 100})` }}
              >
                {high}
              </span>
            </>
          )}
        </div>
        {/* Гистограмма (всегда интерактивна) + дорожка; перетаскивание интервала — полоса на дорожке и жест со столбцов внутри выделения. */}
        <div className="relative flex w-full flex-col">
          {/* Столбцы по годам — та же ширина, что у дорожки (px-2). Наведение: число событий над столбцом. */}
          <div
            className="relative z-[6] mb-0.5 flex w-full items-stretch px-2"
            style={{ height: HIST_BAR_AREA_PX }}
          >
            {tickYears.map((y) => {
              const p = ((y - minBound) / span) * 100;
              return (
                <div
                  key={`tick-${y}`}
                  className="pointer-events-none absolute z-0"
                  style={{ left: `calc(0.5rem + (100% - 1rem) * ${p / 100})` }}
                  aria-hidden
                >
                  <div className="w-px bg-(--ink-muted)/20" style={{ height: HIST_BAR_AREA_PX }} />
                  <div className="mt-0.5 -translate-x-1/2 whitespace-nowrap font-mono text-[10px] leading-none text-(--ink-muted)/70">
                    {y}
                  </div>
                </div>
              );
            })}
            {histCounts.map((c, i) => {
              const year = minBound + i;
              const hPx =
                c > 0 && maxYearCount > 0
                  ? Math.max(1, Math.round((c / maxYearCount) * HIST_BAR_AREA_PX))
                  : 0;
              const inRange = year >= low && year <= high;
              const showLabel = hoverYear === year;
              return (
                <div
                  key={year}
                  data-year={year}
                  className="relative h-full min-w-0 flex-1 cursor-pointer"
                  onPointerEnter={onColPointerEnter}
                  onPointerLeave={onColPointerLeave}
                  onPointerDown={(e) => onYearColumnPointerDown(e, year, inRange)}
                >
                  {showLabel && (
                    <span
                      className="pointer-events-none absolute left-1/2 z-20 -translate-x-1/2 font-mono text-[10px] font-semibold tabular-nums leading-none text-(--ink)"
                      style={{ bottom: `${hPx + 4}px` }}
                    >
                      {c}
                    </span>
                  )}
                  <div
                    className={`absolute bottom-0 left-0 right-0 w-full rounded-t-[1px] transition-[height] duration-75 ${
                      inRange ? 'bg-(--accent)' : 'bg-(--accent)/35'
                    }`}
                    style={{ height: hPx }}
                  />
                </div>
              );
            })}
          </div>
          <div
            ref={trackRef}
            className="pointer-events-none relative z-10 h-8 w-full"
            role="group"
            aria-label={t('mapArchiveYearRangeGroupAria')}
          >
            {/* вся линия */}
            <div
              className="pointer-events-none absolute left-2 right-2 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-(--accent)/25"
              aria-hidden
            />
            {/* выбранный отрезок */}
            <div
              className="pointer-events-none absolute top-1/2 h-2.5 -translate-y-1/2 rounded-full bg-(--accent) shadow-sm ring-1 ring-(--accent)/35"
              style={{
                left: `calc(0.5rem + (100% - 1rem) * ${leftPct / 100})`,
                width: `calc((100% - 1rem) * ${widthPct / 100})`,
                minWidth: widthPct > 0 ? 8 : 0,
              }}
              aria-hidden
            />
            {/* левый ползунок */}
            <button
              type="button"
              className="pointer-events-auto absolute top-1/2 z-20 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-(--paper) bg-(--accent) shadow-md hover:ring-2 hover:ring-(--accent)/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)"
              style={{ left: `calc(0.5rem + (100% - 1rem) * ${pLow / 100})` }}
              onPointerDown={startLow}
              aria-label={t('mapArchiveYearFromHandleAria', { year: low })}
            />
            {/* правый ползунок */}
            <button
              type="button"
              className="pointer-events-auto absolute top-1/2 z-20 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-(--paper) bg-(--accent) shadow-md hover:ring-2 hover:ring-(--accent)/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)"
              style={{ left: `calc(0.5rem + (100% - 1rem) * ${pHigh / 100})` }}
              onPointerDown={startHigh}
              aria-label={t('mapArchiveYearToHandleAria', { year: high })}
            />
          </div>
          {/* Перетаскивание всего интервала только по дорожке (столбцы не перекрываются — там hover/клик). */}
          <button
            type="button"
            tabIndex={-1}
            className="touch-none absolute bottom-0 z-[5] h-8 cursor-grab border-0 bg-transparent active:cursor-grabbing"
            style={{
              left: `calc(0.5rem + (100% - 1rem) * ${leftPct / 100})`,
              width: `calc((100% - 1rem) * ${Math.max(widthPct, 2) / 100})`,
              minWidth: 24,
            }}
            onPointerDown={startRange}
            aria-label={t('mapArchiveYearRangeDragAria')}
          />
        </div>
      </div>
    </div>
  );
}
