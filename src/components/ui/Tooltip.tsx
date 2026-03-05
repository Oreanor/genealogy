'use client';

import { useState, useRef, useEffect } from 'react';

const HOVER_DELAY_MS = 400;

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

  const positionClass =
    side === 'left'
      ? 'right-full top-1/2 -translate-y-1/2 mr-2'
      : side === 'right'
        ? 'left-full top-1/2 -translate-y-1/2 ml-2'
        : side === 'top'
          ? 'bottom-full left-1/2 -translate-x-1/2 mb-2'
          : 'top-full left-1/2 -translate-x-1/2 mt-2';

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
          className={`absolute z-50 whitespace-nowrap rounded px-2 py-1 text-xs font-medium text-white bg-neutral-800 shadow-lg ${positionClass}`}
          role="tooltip"
        >
          {label}
        </span>
      )}
    </span>
  );
}
