'use client';

import { useEffect, type RefObject } from 'react';
import { hashData } from '@/lib/utils/dataMerge';
import { setNavigationGuard } from '@/lib/utils/navigationGuard';
import type { AdminDataSections } from './adminPageClientUtils';

/** Baseline value meaning "differs from anything exported" (e.g. right after an import). */
export const UNSAVED_BASELINE = '\u0000unsaved';

type Params = {
  dataRef: RefObject<AdminDataSections>;
  /** Hash of the last exported (downloaded / copied) or loaded state; `null` = take it once `ready`. */
  baselineHashRef: RefObject<string | null>;
  /** The editors have settled their initial data (incl. async normalization such as the photo scan). */
  ready: boolean;
  confirmMessage: string;
};

/**
 * Admin edits live only in memory, so leaving the page loses them. While the current data differs
 * from the baseline, this warns on reload / tab close (`beforeunload`), on in-app links, and on
 * `router.push` callers that check `confirmNavigation()` (e.g. the locale switcher).
 */
export function useUnsavedChangesGuard({ dataRef, baselineHashRef, ready, confirmMessage }: Params) {
  useEffect(() => {
    // The editors have pushed their normalized initial data into dataRef by now, so the freshly
    // loaded state counts as saved. Until then nothing is considered dirty.
    if (ready && baselineHashRef.current === null) baselineHashRef.current = hashData(dataRef.current);
  }, [ready, dataRef, baselineHashRef]);

  useEffect(() => {
    const isDirty = () =>
      baselineHashRef.current !== null && hashData(dataRef.current) !== baselineHashRef.current;
    const confirmLeave = () => !isDirty() || window.confirm(confirmMessage);

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isDirty()) return;
      e.preventDefault();
      e.returnValue = '';
    };

    const onClickCapture = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = e.target instanceof Element ? e.target.closest('a[href]') : null;
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if ((anchor.target && anchor.target !== '_self') || anchor.hasAttribute('download')) return;
      const url = new URL(anchor.href, window.location.href);
      // Other origins are full page loads: `beforeunload` covers them.
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      if (!confirmLeave()) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('click', onClickCapture, true);
    const removeGuard = setNavigationGuard(confirmLeave);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('click', onClickCapture, true);
      removeGuard();
    };
  }, [dataRef, baselineHashRef, confirmMessage]);
}
