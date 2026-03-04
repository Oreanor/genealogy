'use client';

import dynamic from 'next/dynamic';

export const PageColorPicker = dynamic(
  () => import('./PageColorPicker').then((m) => m.PageColorPicker),
  { ssr: false }
);
