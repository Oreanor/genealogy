import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useTreePan } from './useTreePan';

function createPointerEvent(pointerId: number, clientX: number, clientY: number) {
  return {
    pointerId,
    clientX,
    clientY,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    currentTarget: {
      setPointerCapture: vi.fn(),
      hasPointerCapture: vi.fn(() => true),
      releasePointerCapture: vi.fn(),
    },
  } as unknown as React.PointerEvent<HTMLDivElement>;
}

describe('useTreePan', () => {
  it('resets pan immediately when resetKey changes', () => {
    const { result, rerender } = renderHook(
      ({ resetKey }) =>
        useTreePan({
          initialY: 10,
          limitX: 100,
          limitYDown: 50,
          limitYUp: -50,
          dragStartThresholdPx: 3,
          resetKey,
        }),
      {
        initialProps: { resetKey: 'a' },
      }
    );

    act(() => {
      result.current.panHandlers.onPointerDown(createPointerEvent(1, 10, 10));
      result.current.panHandlers.onPointerMove(createPointerEvent(1, 40, 30));
    });

    expect(result.current.pan).toEqual({ x: 30, y: 30 });

    rerender({ resetKey: 'b' });
    expect(result.current.pan).toEqual({ x: 0, y: 10 });
  });

  it('suppresses the click that follows a drag gesture', () => {
    const { result } = renderHook(() =>
      useTreePan({
        initialY: 0,
        limitX: 100,
        limitYDown: 50,
        limitYUp: -50,
        dragStartThresholdPx: 3,
        resetKey: 'stable',
      })
    );

    const downEvent = createPointerEvent(1, 10, 10);
    const moveEvent = createPointerEvent(1, 25, 10);
    const upEvent = createPointerEvent(1, 25, 10);
    const clickEvent = createPointerEvent(1, 25, 10);

    act(() => {
      result.current.panHandlers.onPointerDown(downEvent);
      result.current.panHandlers.onPointerMove(moveEvent);
      result.current.panHandlers.onPointerUp(upEvent);
      result.current.panHandlers.onClickCapture(clickEvent);
    });

    expect(clickEvent.preventDefault).toHaveBeenCalled();
    expect(clickEvent.stopPropagation).toHaveBeenCalled();
  });
});
