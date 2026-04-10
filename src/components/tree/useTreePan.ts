'use client';

import { useEffect, useRef, useState, type RefObject, type PointerEvent as ReactPointerEvent } from 'react';

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
  /** Wheel / pinch: listener on this node (non-passive). */
  zoomRootRef: RefObject<HTMLDivElement | null>;
  /** Node with `translate` + `scale` (for cursor-relative zoom). */
  transformTargetRef: RefObject<HTMLDivElement | null>;
};

type PanStore = {
  resetKey: string;
  pan: PanState;
  scale: number;
};

type PinchSession = {
  startDist: number;
  startScale: number;
  startPan: PanState;
};

/** Zoom range: ~0.55 «далеко» … ~2.35 «крупно». */
const SCALE_MIN = 0.55;
const SCALE_MAX = 2.35;
const WHEEL_ZOOM_SENS = 0.00135;

function touchDistance(t: TouchList): number {
  if (t.length < 2) return 0;
  const a = t[0]!;
  const b = t[1]!;
  return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
}

export function useTreePan({
  initialY,
  limitX,
  limitYDown,
  limitYUp,
  dragStartThresholdPx,
  resetKey,
  zoomRootRef,
  transformTargetRef,
}: Params) {
  const [panStore, setPanStore] = useState<PanStore>({
    resetKey,
    pan: { x: 0, y: initialY },
    scale: 1,
  });
  const dragRef = useRef<DragState | null>(null);
  const suppressNextClickRef = useRef(false);
  const pinchSessionRef = useRef<PinchSession | null>(null);
  const pinchActiveRef = useRef(false);
  const latestRef = useRef({ pan: panStore.pan, scale: panStore.scale, resetKey });

  useEffect(() => {
    setPanStore({ resetKey, pan: { x: 0, y: initialY }, scale: 1 });
  }, [resetKey, initialY]);

  const pan = panStore.resetKey === resetKey ? panStore.pan : { x: 0, y: initialY };
  const scale = panStore.resetKey === resetKey ? panStore.scale : 1;
  latestRef.current = { pan, scale, resetKey };

  const clampPan = (x: number, y: number): PanState => ({
    x: Math.max(-limitX, Math.min(limitX, x)),
    y: Math.max(limitYUp, Math.min(limitYDown, y)),
  });

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (pinchActiveRef.current) return;
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
    if (pinchActiveRef.current) return;
    const st = dragRef.current;
    if (!st || !st.active || st.pointerId !== e.pointerId) return;
    const dx = e.clientX - st.startX;
    const dy = e.clientY - st.startY;
    if (!st.moved && Math.hypot(dx, dy) < dragStartThresholdPx) return;
    if (!st.moved) {
      st.moved = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    const next = clampPan(st.originX + dx, st.originY + dy);
    setPanStore((prev) => ({
      resetKey,
      pan: next,
      scale: prev.resetKey === resetKey ? prev.scale : 1,
    }));
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

  useEffect(() => {
    const root = zoomRootRef.current;
    const inner = transformTargetRef.current;
    if (!root || !inner) return;

    const parent = inner.offsetParent as HTMLElement | null;
    if (!parent) return;

    const clientToLocal = (clientX: number, clientY: number) => {
      const pr = parent.getBoundingClientRect();
      return {
        mx: clientX - pr.left - inner.offsetLeft,
        my: clientY - pr.top - inner.offsetTop,
      };
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const { mx, my } = clientToLocal(e.clientX, e.clientY);
      const factor = 1 - e.deltaY * WHEEL_ZOOM_SENS;
      if (!Number.isFinite(factor) || factor <= 0) return;

      setPanStore((prev) => {
        if (prev.resetKey !== resetKey) {
          return { resetKey, pan: { x: 0, y: initialY }, scale: 1 };
        }
        const oldS = prev.scale;
        const oldP = prev.pan;
        const rawNext = oldS * factor;
        const nextS = Math.min(SCALE_MAX, Math.max(SCALE_MIN, rawNext));
        if (nextS === oldS) return prev;
        const ratio = nextS / oldS;
        const nextPan = clampPan(
          mx - (mx - oldP.x) * ratio,
          my - (my - oldP.y) * ratio
        );
        return { resetKey, scale: nextS, pan: nextPan };
      });
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      const d0 = touchDistance(e.touches);
      if (d0 < 8) return;
      e.preventDefault();
      dragRef.current = null;
      pinchActiveRef.current = true;
      const L = latestRef.current;
      pinchSessionRef.current = {
        startDist: d0,
        startScale: L.scale,
        startPan: { ...L.pan },
      };
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && !pinchSessionRef.current) {
        const d0 = touchDistance(e.touches);
        if (d0 >= 8) {
          e.preventDefault();
          dragRef.current = null;
          pinchActiveRef.current = true;
          const L = latestRef.current;
          pinchSessionRef.current = {
            startDist: d0,
            startScale: L.scale,
            startPan: { ...L.pan },
          };
        }
      }
      const session = pinchSessionRef.current;
      if (!session || e.touches.length < 2) return;
      e.preventDefault();
      const d1 = touchDistance(e.touches);
      if (d1 < 1) return;
      const t0 = e.touches[0]!;
      const t1 = e.touches[1]!;
      const midX = (t0.clientX + t1.clientX) / 2;
      const midY = (t0.clientY + t1.clientY) / 2;
      const { mx, my } = clientToLocal(midX, midY);
      const nextScale = session.startScale * (d1 / session.startDist);
      const s = Math.min(SCALE_MAX, Math.max(SCALE_MIN, nextScale));
      const ratio = s / session.startScale;
      setPanStore((prev) => {
        if (prev.resetKey !== resetKey) {
          return { resetKey, pan: { x: 0, y: initialY }, scale: 1 };
        }
        const p0 = session.startPan;
        const nextPan = clampPan(mx - (mx - p0.x) * ratio, my - (my - p0.y) * ratio);
        return { resetKey, scale: s, pan: nextPan };
      });
    };

    const endPinch = () => {
      pinchSessionRef.current = null;
      pinchActiveRef.current = false;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) endPinch();
    };

    root.addEventListener('wheel', onWheel, { passive: false });
    root.addEventListener('touchstart', onTouchStart, { passive: false });
    root.addEventListener('touchmove', onTouchMove, { passive: false });
    root.addEventListener('touchend', onTouchEnd);
    root.addEventListener('touchcancel', endPinch);

    return () => {
      root.removeEventListener('wheel', onWheel);
      root.removeEventListener('touchstart', onTouchStart);
      root.removeEventListener('touchmove', onTouchMove);
      root.removeEventListener('touchend', onTouchEnd);
      root.removeEventListener('touchcancel', endPinch);
    };
  }, [zoomRootRef, transformTargetRef, resetKey, initialY, limitX, limitYDown, limitYUp]);

  return {
    pan,
    scale,
    panHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
      onClickCapture,
    },
  };
}
