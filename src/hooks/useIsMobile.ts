import { useEffect, useState } from 'react';

/** Breakpoint aligned with Tailwind md (768px). */
const MOBILE_MEDIA = '(max-width: 767px)';

/** true when viewport width &lt; 768px (Tailwind md breakpoint). */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const m = window.matchMedia(MOBILE_MEDIA);
    setIsMobile(m.matches);
    const listener = () => setIsMobile(m.matches);
    m.addEventListener('change', listener);
    return () => m.removeEventListener('change', listener);
  }, []);
  return isMobile;
}
