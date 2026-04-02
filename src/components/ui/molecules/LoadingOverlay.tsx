'use client';

import { useEffect, useState, type ReactNode } from 'react';

type LoadingOverlayProps = {
  /** For "dots" variant. If omitted, dots animate after an empty label. */
  text?: string;
  /** Which UI to show. */
  variant?: 'dots' | 'spinner' | 'map';
  /**
   * Positioning context.
   * - `fixed`: relative to viewport (no jumping if parent layout shifts)
   * - `absolute`: relative to nearest positioned ancestor
   */
  mode?: 'fixed' | 'absolute';
  /** Optional extra node (e.g. different icon). */
  children?: ReactNode;
};

export function LoadingOverlay({
  text,
  variant = 'dots',
  mode = 'fixed',
  children,
}: LoadingOverlayProps) {
  const [dotsCount, setDotsCount] = useState(0);

  useEffect(() => {
    if (variant !== 'dots' && variant !== 'map') return;
    const id = window.setInterval(() => {
      setDotsCount((v) => (v + 1) % 4);
    }, 500);
    return () => window.clearInterval(id);
  }, [variant]);

  const pos =
    mode === 'fixed'
      ? 'fixed inset-0 z-50 flex items-center justify-center pointer-events-none'
      : 'absolute inset-0 z-50 flex items-center justify-center pointer-events-none';

  if (variant === 'map') {
    const safeText = (text ?? '').trim();
    return (
      <div className={pos}>
        <div className="pointer-events-none flex min-w-[220px] max-w-[min(92vw,320px)] flex-col items-center gap-3 rounded-xl border border-(--ink-muted)/25 bg-(--paper)/92 px-5 py-4 shadow-xl backdrop-blur-md">
          <div className="relative size-10">
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-(--ink-muted)/20 border-t-(--accent)" />
            <div
              className="absolute inset-1 animate-spin rounded-full border-2 border-transparent border-b-(--accent-hover)"
              style={{ animationDirection: 'reverse', animationDuration: '0.9s' }}
            />
          </div>
          {safeText ? (
            <p className="text-center text-sm font-medium leading-snug text-(--ink)">{safeText}</p>
          ) : null}
          <div className="flex h-1 w-full overflow-hidden rounded-full bg-(--ink-muted)/15">
            <div className="map-loading-progress h-full w-1/3 rounded-full bg-(--accent)" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'spinner') {
    return (
      <div className={pos}>
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-(--paper) border-t-transparent" />
        {children}
      </div>
    );
  }

  const safeText = (text ?? '').trim();

  return (
    <div className={pos}>
      <div className="flex items-center gap-0.5 rounded-md bg-(--paper) bg-opacity-60 backdrop-blur-sm p-0.5 shadow-sm">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-(--paper) border-t-transparent" />
        <div className="text-sm font-medium text-(--ink)">
          {safeText}
          <span className="inline-block w-[1.8ch] text-left">
            {Array.from({ length: 3 }, (_, i) => (
              <span key={i} className={i < dotsCount ? 'opacity-100' : 'opacity-0'}>
                .
              </span>
            ))}
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}

