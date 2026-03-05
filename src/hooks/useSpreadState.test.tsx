import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSpreadState } from './useSpreadState';

const mockGet = vi.fn();
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: mockGet }),
}));

describe('useSpreadState', () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it('returns index 0 when no spread param', () => {
    mockGet.mockReturnValue(null);
    const { result } = renderHook(() => useSpreadState(5));
    expect(result.current.safeIndex).toBe(0);
    expect(result.current.spreadIndex).toBe(0);
    expect(result.current.hasPrev).toBe(false);
    expect(result.current.hasNext).toBe(true);
    expect(result.current.totalSpreads).toBe(5);
  });

  it('returns index from spread param', () => {
    mockGet.mockReturnValue('2');
    const { result } = renderHook(() => useSpreadState(5));
    expect(result.current.safeIndex).toBe(2);
    expect(result.current.spreadIndex).toBe(2);
    expect(result.current.hasPrev).toBe(true);
    expect(result.current.hasNext).toBe(true);
  });

  it('clamps safeIndex when spread exceeds max', () => {
    mockGet.mockReturnValue('99');
    const { result } = renderHook(() => useSpreadState(5));
    expect(result.current.safeIndex).toBe(4);
    expect(result.current.hasNext).toBe(false);
  });

  it('handles negative spread param', () => {
    mockGet.mockReturnValue('-1');
    const { result } = renderHook(() => useSpreadState(5));
    expect(result.current.safeIndex).toBe(0);
  });

  it('hasPrev false at first, hasNext false at last', () => {
    mockGet.mockReturnValue('0');
    const { result: r0 } = renderHook(() => useSpreadState(3));
    expect(r0.current.hasPrev).toBe(false);

    mockGet.mockReturnValue('2');
    const { result: r2 } = renderHook(() => useSpreadState(3));
    expect(r2.current.hasNext).toBe(false);
  });
});
