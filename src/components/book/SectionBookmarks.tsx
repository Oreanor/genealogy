'use client';

import { useLocaleRoutes } from '@/lib/i18n/context';
import { SECTIONS, isSectionId } from '@/lib/constants/sections';
import type { SectionId } from '@/lib/constants/sections';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

/** Bookmarks at top-right of book: Tree, History, Photos, Persons. Visually protrude from the top edge. */
export function SectionBookmarks() {
  const { t } = useLocaleRoutes();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get('section') ?? '';
  const current: SectionId = isSectionId(sectionParam) ? sectionParam : 'tree';

  return (
    <nav
      className="z-30 mr-4 flex flex-row flex-wrap justify-end gap-1 md:mr-6"
      aria-label={t('navAria')}
    >
      {SECTIONS.map(({ id, i18nKey }) => {
        const isActive = current === id;
        const href = id === 'tree' ? pathname : `${pathname}?section=${id}`;
        return (
          <Link
            key={id}
            href={href}
            className={`
              rounded-t-md px-3 py-1.5 text-xs font-medium shadow-md transition-colors
              md:min-h-[36px] md:px-4 md:py-2 md:text-sm
              ${isActive ? 'bg-[var(--accent)] text-[var(--nav-btn-ink)] border-2 border-[var(--accent)] border-b-0' : 'bg-[var(--nav-btn)] text-[var(--nav-btn-ink)] hover:bg-[var(--nav-btn-hover)]'}
            `}
          >
            {t(i18nKey)}
          </Link>
        );
      })}
    </nav>
  );
}
