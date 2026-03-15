'use client';

import { useLocaleRoutes } from '@/lib/i18n/context';
import { SECTIONS, isSectionId } from '@/lib/constants/sections';
import type { SectionId } from '@/lib/constants/sections';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { HelpCircle } from 'lucide-react';

const BOOKMARK_BASE =
  'rounded-t-md px-3 py-1.5 text-xs font-medium shadow-md transition-colors md:min-h-[36px] md:px-4 md:py-2 md:text-sm';
const BOOKMARK_ACTIVE = 'bg-(--ink) text-(--paper) hover:bg-(--ink)';
const BOOKMARK_INACTIVE =
  'bg-(--nav-btn) text-(--nav-btn-ink) hover:bg-(--nav-btn-hover)';

/** Mobile: dropdown for section (tree, persons, history, photos, kinship, help). Desktop: tab links. */
export function SectionBookmarks() {
  const { t } = useLocaleRoutes();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const sectionParam = searchParams.get('section') ?? '';
  const current: SectionId = isSectionId(sectionParam) ? sectionParam : 'tree';

  const handleSectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value as SectionId;
    const url = id === 'tree' ? pathname : `${pathname}?section=${id}`;
    router.push(url);
  };

  const RIGHT_IDS = new Set<string>(['kinship', 'help']);
  const mainSections = SECTIONS.filter((s) => !RIGHT_IDS.has(s.id));
  const rightSections = SECTIONS.filter((s) => RIGHT_IDS.has(s.id));

  return (
    <nav
      className="z-30 ml-4 flex w-full flex-row flex-wrap items-center justify-between gap-1 pl-0.5 pr-8 md:ml-6 md:pl-1 md:pr-10"
      aria-label={t('navAria')}
    >
      {/* Mobile: single dropdown (portrait/narrow) */}
      <div className="flex w-full justify-center md:hidden">
        <select
          value={current}
          onChange={handleSectionChange}
          className="w-full max-w-[280px] rounded-md border-2 border-(--border) bg-(--paper) px-3 py-2 text-(--ink) shadow-md focus:outline-none focus:ring-2 focus:ring-(--ink)"
          aria-label={t('navAria')}
        >
          {SECTIONS.map(({ id, i18nKey }) => (
            <option key={id} value={id}>
              {t(i18nKey)}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop: tab links */}
      <div className="hidden flex-row flex-wrap gap-1 md:flex">
        {mainSections.map(({ id, i18nKey }) => {
          const isActive = current === id;
          const href = id === 'tree' ? pathname : `${pathname}?section=${id}`;
          return (
            <Link
              key={id}
              href={href}
              className={`${BOOKMARK_BASE} ${isActive ? BOOKMARK_ACTIVE : BOOKMARK_INACTIVE}`}
            >
              {t(i18nKey)}
            </Link>
          );
        })}
      </div>
      <div className="hidden shrink-0 flex-row gap-1 md:flex">
        {rightSections.map(({ id, i18nKey }) => (
          <Link
            key={id}
            href={`${pathname}?section=${id}`}
            className={`${BOOKMARK_BASE} ${current === id ? BOOKMARK_ACTIVE : BOOKMARK_INACTIVE} ${id === 'help' ? 'flex items-center gap-1.5' : ''}`}
          >
            {id === 'help' && <HelpCircle className="size-4" aria-hidden />}
            {t(i18nKey)}
          </Link>
        ))}
      </div>
    </nav>
  );
}
