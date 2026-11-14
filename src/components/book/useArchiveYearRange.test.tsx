import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { clampYearRange, useArchiveYearRange } from './useArchiveYearRange';

describe('clampYearRange', () => {
  it('clamps both ends into bounds and orders them', () => {
    expect(clampYearRange({ lo: 1990, hi: 1700 }, { min: 1800, max: 1950 })).toEqual({
      lo: 1800,
      hi: 1950,
    });
    expect(clampYearRange({ lo: 1900, hi: 1850 }, { min: 1800, max: 1950 })).toEqual({
      lo: 1850,
      hi: 1900,
    });
  });
});

describe('useArchiveYearRange', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts at the full span', () => {
    const { result } = renderHook(() => useArchiveYearRange({ min: 1800, max: 1900 }));
    expect(result.current.sliderRange).toEqual({ lo: 1800, hi: 1900 });
    expect(result.current.mapRange).toEqual({ lo: 1800, hi: 1900 });
  });

  it('updates the slider immediately and the map on the next frame', () => {
    const { result } = renderHook(() => useArchiveYearRange({ min: 1800, max: 1900 }));

    act(() => result.current.setSliderRange({ lo: 1820, hi: 1850 }));
    expect(result.current.sliderRange).toEqual({ lo: 1820, hi: 1850 });
    expect(result.current.mapRange).toEqual({ lo: 1800, hi: 1900 });

    act(() => {
      vi.advanceTimersToNextFrame();
    });
    expect(result.current.mapRange).toEqual({ lo: 1820, hi: 1850 });
  });

  it('coalesces several slider moves within a frame into one map update', () => {
    const { result } = renderHook(() => useArchiveYearRange({ min: 1800, max: 1900 }));

    act(() => {
      result.current.setSliderRange({ lo: 1810, hi: 1900 });
      result.current.setSliderRange({ lo: 1830, hi: 1880 });
    });
    act(() => {
      vi.advanceTimersToNextFrame();
    });
    expect(result.current.mapRange).toEqual({ lo: 1830, hi: 1880 });
  });

  it('jumpToYear narrows both ranges at once and drops a pending sync', () => {
    const { result } = renderHook(() => useArchiveYearRange({ min: 1800, max: 1900 }));

    act(() => result.current.setSliderRange({ lo: 1810, hi: 1820 }));
    act(() => result.current.jumpToYear(1866));
    expect(result.current.sliderRange).toEqual({ lo: 1866, hi: 1866 });
    expect(result.current.mapRange).toEqual({ lo: 1866, hi: 1866 });

    act(() => {
      vi.advanceTimersToNextFrame();
    });
    expect(result.current.mapRange).toEqual({ lo: 1866, hi: 1866 });
  });

  it('resets to the full span when bounds change', () => {
    const { result, rerender } = renderHook(({ min, max }) => useArchiveYearRange({ min, max }), {
      initialProps: { min: 1800, max: 1900 },
    });
    act(() => result.current.jumpToYear(1850));

    rerender({ min: 1700, max: 1950 });
    expect(result.current.sliderRange).toEqual({ lo: 1700, hi: 1950 });
    expect(result.current.mapRange).toEqual({ lo: 1700, hi: 1950 });
  });
});
