'use client';

import { useEffect, useState, type ReactNode } from 'react';

type LoadingOverlayProps = {
  /** For "dots" variant. If omitted, dots animate after an empty label. */
  text?: string;
  /** Which UI to show. */
  variant?: 'dots' | 'spinner';
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
    if (variant !== 'dots') return;
    setDotsCount(0);
    const id = window.setInterval(() => {
      setDotsCount((v) => (v + 1) % 4);
    }, 500);
    return () => window.clearInterval(id);
  }, [variant]);

  const pos =
    mode === 'fixed'
      ? 'fixed inset-0 z-50 flex items-center justify-center pointer-events-none'
      : 'absolute inset-0 z-50 flex items-center justify-center pointer-events-none';

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
          <span
            style={{
              display: 'inline-block',
              width: '1.8ch', // 3 dots * 0.6ch slot
              textAlign: 'left',
            }}
          >
            {Array.from({ length: 3 }, (_, i) => (
              <span key={i} style={{ opacity: i < dotsCount ? 1 : 0 }}>
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

