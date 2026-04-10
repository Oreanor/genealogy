import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebouncedValue } from './useDebouncedValue';

describe('useDebouncedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('updates only after delay from last change', () => {
    const { result, rerender } = renderHook(({ v }: { v: string }) => useDebouncedValue(v, 100), {
      initialProps: { v: 'a' },
    });
    expect(result.current).toBe('a');

    rerender({ v: 'b' });
    expect(result.current).toBe('a');
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(result.current).toBe('a');

    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(result.current).toBe('b');

    rerender({ v: 'c' });
    act(() => {
      vi.advanceTimersByTime(99);
    });
    expect(result.current).toBe('b');
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('c');
  });
});
