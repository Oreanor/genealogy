'use client';

import { useLocaleRoutes } from '@/lib/i18n/context';
import { SECTIONS, isSectionId } from '@/lib/constants/sections';
import type { SectionId } from '@/lib/constants/sections';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { HelpCircle } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { AdminButton } from '@/components/ui/AdminButton';
import { PageColorPicker } from '@/components/ui/PageColorPickerClient';
import { LocaleSwitcher } from '@/components/ui/LocaleSwitcher';
import { SquareIconButton } from '@/components/ui/SquareIconButton';
import { useState } from 'react';
import { BookHelpDialog } from './BookHelpDialog';

const BOOKMARK_BASE =
  'rounded-t-md px-3 py-1.5 text-xs font-medium shadow-md transition-colors md:min-h-[36px] md:px-4 md:py-2 md:text-sm';
const BOOKMARK_ACTIVE = 'bg-(--ink) text-(--paper) hover:bg-(--ink)';
const BOOKMARK_INACTIVE =
  'bg-(--nav-btn) text-(--nav-btn-ink) hover:bg-(--nav-btn-hover)';
/** Mobile: dropdown for section. Desktop: tab links + square action buttons. */
export function SectionBookmarks() {
  const { t } = useLocaleRoutes();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get('section') ?? '';
  const current: SectionId = isSectionId(sectionParam) ? sectionParam : 'tree';
  const [helpOpen, setHelpOpen] = useState(false);
  const helpTarget = current === 'kinship' || current === 'help' ? 'tree' : current;

  const RIGHT_IDS = new Set<string>(['help']);
  // Kinship is handled via selection mode on the Tree page, so hide it from the usual tabs.
  const mainSections = SECTIONS.filter((s) => !RIGHT_IDS.has(s.id) && s.id !== 'kinship');
  const helpSection = SECTIONS.find((s) => s.id === 'help');

  return (
    <nav
      className="relative z-50 mt-1 mb-0 ml-3 flex w-full flex-row flex-wrap items-center justify-between gap-1 pl-0.5 pr-2 md:-mt-2 md:mb-0 md:ml-4 md:pl-0 md:pr-3"
      aria-label={t('navAria')}
    >
      {/* Desktop: tab links (mobile moved to bottom toolbar) */}
      <div className="flex-row flex-wrap gap-1 max-md:hidden">
        {mainSections.map(({ id, i18nKey }, i) => {
          const isActive = current === id;
          const href = id === 'tree' ? pathname : `${pathname}?section=${id}`;
          return (
            <Link
              key={id}
              href={href}
              style={{ zIndex: i }}
              className={`${BOOKMARK_BASE} ${
                i > 0 ? '-ml-[6px]' : ''
              } ${isActive ? BOOKMARK_ACTIVE : BOOKMARK_INACTIVE}`}
            >
              {t(i18nKey)}
            </Link>
          );
        })}
      </div>
      <div className="hidden shrink-0 flex-row items-center gap-1 md:mr-0.5 md:flex md:-mt-1">
        <Tooltip label={t('adminTitle')} side="bottom">
          <AdminButton />
        </Tooltip>
        <Tooltip label={t('tooltipPageColor')} side="bottom">
          <PageColorPicker />
        </Tooltip>
        <Tooltip label={t('tooltipLanguage')} side="bottom">
          <LocaleSwitcher />
        </Tooltip>
        {helpSection && (
          <Tooltip label={t(helpSection.i18nKey)} side="bottom">
            <SquareIconButton
              onClick={() => setHelpOpen(true)}
              label={t(helpSection.i18nKey)}
            >
              <HelpCircle className="size-[18px]" aria-hidden />
            </SquareIconButton>
          </Tooltip>
        )}
      </div>
      <BookHelpDialog
        open={helpOpen}
        section={helpTarget}
        onClose={() => setHelpOpen(false)}
      />
    </nav>
  );
}
