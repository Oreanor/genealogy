'use client';

import { useEffect, useState } from 'react';
import { subscribePersonsOverlay } from '@/lib/data/persons';

/** Re-render when in-memory persons overlay changes (locale template / admin session). */
export function usePersonsOverlayRevision(): number {
  const [rev, setRev] = useState(0);
  useEffect(() => subscribePersonsOverlay(() => setRev((x) => x + 1)), []);
  return rev;
}
