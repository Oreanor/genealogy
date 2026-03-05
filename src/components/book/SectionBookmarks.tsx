'use client';

import { useLocaleRoutes } from '@/lib/i18n/context';
import { SECTIONS, isSectionId } from '@/lib/constants/sections';
import type { SectionId } from '@/lib/constants/sections';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

/** Закладки справа сверху книги: Дерево, Истории, Фотографии, Персоны. Визуально вылезают из верхней границы книги. */
export function SectionBookmarks() {
  const { t } = useLocaleRoutes();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get('section');
  const current: SectionId = isSectionId(sectionParam) ? sectionParam : 'tree';

  return (
    <nav
      className="absolute -top-1 right-0 z-30 flex flex-col gap-0.5"
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
              rounded-b-md px-3 py-1.5 text-xs font-medium shadow-md transition-colors
              md:min-h-[36px] md:px-4 md:py-2 md:text-sm
              ${isActive ? 'bg-[var(--accent)] text-[var(--nav-btn-ink)] ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--paper)]' : 'bg-[var(--nav-btn)] text-[var(--nav-btn-ink)] hover:bg-[var(--nav-btn-hover)]'}
            `}
          >
            {t(i18nKey)}
          </Link>
        );
      })}
    </nav>
  );
}
