'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const HOVER_DELAY_MS = 400;
const VIEWPORT_PAD_PX = 8;

interface TooltipProps {
  label: string;
  children: React.ReactNode;
  /** Position relative to trigger */
  side?: 'left' | 'right' | 'top' | 'bottom';
}

export function Tooltip({ label, children, side = 'left' }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  const clearTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleEnter = () => {
    clearTimer();
    timeoutRef.current = setTimeout(() => setVisible(true), HOVER_DELAY_MS);
  };

  const handleLeave = () => {
    clearTimer();
    setVisible(false);
  };

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return clearTimer;
    const onFocusIn = (e: FocusEvent) => {
      if (el.contains(e.target as Node)) setVisible(true);
    };
    const onFocusOut = (e: FocusEvent) => {
      if (!el.contains(e.relatedTarget as Node)) setVisible(false);
    };
    el.addEventListener('focusin', onFocusIn);
    el.addEventListener('focusout', onFocusOut);
    return () => {
      clearTimer();
      el.removeEventListener('focusin', onFocusIn);
      el.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  useLayoutEffect(() => {
    if (!visible) {
      setPos(null);
      return;
    }
    const anchor = wrapperRef.current;
    const tip = tooltipRef.current;
    if (!anchor || !tip) return;

    const anchorRect = anchor.getBoundingClientRect();
    const tipRect = tip.getBoundingClientRect();

    const gap = 8;
    let left = 0;
    let top = 0;

    if (side === 'top') {
      left = anchorRect.left + anchorRect.width / 2 - tipRect.width / 2;
      top = anchorRect.top - tipRect.height - gap;
    } else if (side === 'bottom') {
      left = anchorRect.left + anchorRect.width / 2 - tipRect.width / 2;
      top = anchorRect.bottom + gap;
    } else if (side === 'right') {
      left = anchorRect.right + gap;
      top = anchorRect.top + anchorRect.height / 2 - tipRect.height / 2;
    } else {
      left = anchorRect.left - tipRect.width - gap;
      top = anchorRect.top + anchorRect.height / 2 - tipRect.height / 2;
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const minLeft = VIEWPORT_PAD_PX;
    const maxLeft = Math.max(minLeft, vw - VIEWPORT_PAD_PX - tipRect.width);
    const minTop = VIEWPORT_PAD_PX;
    const maxTop = Math.max(minTop, vh - VIEWPORT_PAD_PX - tipRect.height);

    left = Math.min(Math.max(left, minLeft), maxLeft);
    top = Math.min(Math.max(top, minTop), maxTop);

    setPos({ left, top });
  }, [visible, side, label]);

  return (
    <span
      ref={wrapperRef}
      className="relative inline-flex"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {children}
      {visible && (
        <span
          ref={tooltipRef}
          className="fixed z-50 max-w-[calc(100vw-16px)] whitespace-nowrap rounded bg-neutral-800 px-2 py-1 text-xs font-medium text-white shadow-lg"
          role="tooltip"
          style={pos ?? undefined}
        >
          {label}
        </span>
      )}
    </span>
  );
}
