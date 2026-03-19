import { useEffect, useState } from 'react';

/** Breakpoint aligned with Tailwind md (768px). */
const MOBILE_MEDIA = '(max-width: 767px)';

/** true when viewport width &lt; 768px (Tailwind md breakpoint). */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(MOBILE_MEDIA).matches;
  });
  useEffect(() => {
    const m = window.matchMedia(MOBILE_MEDIA);
    const listener = () => setIsMobile(m.matches);
    m.addEventListener('change', listener);
    return () => m.removeEventListener('change', listener);
  }, []);
  return isMobile;
}
