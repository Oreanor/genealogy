'use client';

import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

type PanState = { x: number; y: number };
type DragState = {
  active: boolean;
  moved: boolean;
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
};

type Params = {
  initialY: number;
  limitX: number;
  limitYDown: number;
  limitYUp: number;
  dragStartThresholdPx: number;
  resetKey: string;
};

type PanStore = {
  resetKey: string;
  pan: PanState;
};

export function useTreePan({
  initialY,
  limitX,
  limitYDown,
  limitYUp,
  dragStartThresholdPx,
  resetKey,
}: Params) {
  const [panStore, setPanStore] = useState<PanStore>({
    resetKey,
    pan: { x: 0, y: initialY },
  });
  const dragRef = useRef<DragState | null>(null);
  const suppressNextClickRef = useRef(false);
  const pan = panStore.resetKey === resetKey ? panStore.pan : { x: 0, y: initialY };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragRef.current = {
      active: true,
      moved: false,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: pan.x,
      originY: pan.y,
    };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const st = dragRef.current;
    if (!st || !st.active || st.pointerId !== e.pointerId) return;
    const dx = e.clientX - st.startX;
    const dy = e.clientY - st.startY;
    if (!st.moved && Math.hypot(dx, dy) < dragStartThresholdPx) return;
    if (!st.moved) {
      st.moved = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    const nextX = Math.max(-limitX, Math.min(limitX, st.originX + dx));
    const nextY = Math.max(limitYUp, Math.min(limitYDown, st.originY + dy));
    setPanStore({
      resetKey,
      pan: { x: nextX, y: nextY },
    });
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const st = dragRef.current;
    if (!st || st.pointerId !== e.pointerId) return;
    if (st.moved) suppressNextClickRef.current = true;
    dragRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const onClickCapture = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!suppressNextClickRef.current) return;
    suppressNextClickRef.current = false;
    e.preventDefault();
    e.stopPropagation();
  };

  return {
    pan,
    panHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
      onClickCapture,
    },
  };
}
