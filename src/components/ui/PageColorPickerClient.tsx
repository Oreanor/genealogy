'use client';

import dynamic from 'next/dynamic';

export const PageColorPicker = dynamic(
  () => import('./PageColorPicker').then((m) => m.PageColorPicker),
  {
    ssr: false,
    // Same box as the picker's trigger button, so its arrival doesn't shift neighbouring buttons.
    loading: () => (
      <div className="relative">
        <div
          className="flex h-8 w-8 shrink-0 rounded-lg border-2 border-(--border) bg-(--book-bg) shadow-md md:h-9 md:w-9"
          aria-hidden
        />
      </div>
    ),
  }
);
