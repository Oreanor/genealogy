import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePhotoImageBounds } from './usePhotoImageBounds';

describe('usePhotoImageBounds', () => {
  let rafCallback: (() => void) | null;
  beforeEach(() => {
    rafCallback = null;
    vi.stubGlobal(
      'requestAnimationFrame',
      (cb: () => void) => {
        rafCallback = cb;
        return 1;
      }
    );
  });

  it('returns ref, imageBounds, setImageBounds, onPhotoImageLoad', () => {
    const { result } = renderHook(() => usePhotoImageBounds());
    expect(result.current.photoContainerRef).toBeDefined();
    expect(result.current.photoContainerRef.current).toBeNull();
    expect(result.current.imageBounds).toBeNull();
    expect(typeof result.current.setImageBounds).toBe('function');
    expect(typeof result.current.onPhotoImageLoad).toBe('function');
  });

  it('onPhotoImageLoad does nothing when naturalWidth or naturalHeight is 0', () => {
    const { result } = renderHook(() => usePhotoImageBounds());
    const fakeEvent = {
      currentTarget: { naturalWidth: 0, naturalHeight: 100 } as HTMLImageElement,
      target: null,
    } as unknown as React.SyntheticEvent<HTMLImageElement, Event>;
    result.current.onPhotoImageLoad(fakeEvent);
    expect(rafCallback).toBeNull();
    expect(result.current.imageBounds).toBeNull();
  });

  it('onPhotoImageLoad sets bounds when container ref is set and rAF runs', () => {
    const mockRect = { width: 200, height: 100, left: 0, top: 0 };
    const { result } = renderHook(() => usePhotoImageBounds());
    const div = document.createElement('div');
    div.getBoundingClientRect = () => mockRect as DOMRect;
    (result.current.photoContainerRef as React.MutableRefObject<HTMLDivElement | null>).current = div;

    const fakeEvent = {
      currentTarget: { naturalWidth: 400, naturalHeight: 200 } as HTMLImageElement,
      target: null,
    } as unknown as React.SyntheticEvent<HTMLImageElement, Event>;
    result.current.onPhotoImageLoad(fakeEvent);
    expect(rafCallback).not.toBeNull();
    act(() => {
      rafCallback!();
    });
    expect(result.current.imageBounds).not.toBeNull();
    expect(result.current.imageBounds!.width).toBe(100);
    expect(result.current.imageBounds!.height).toBe(100);
    expect(result.current.imageBounds!.left).toBe(0);
    expect(result.current.imageBounds!.top).toBe(0);
  });
});
