import { CHAPTER_IDS } from '@/lib/constants/chapters';
import { getRoutes } from '@/lib/constants/routes';
import { useLocale, useTranslations } from '@/lib/i18n/context';
import Link from 'next/link';

const navLinkClass =
  'rounded-b-lg px-5 py-2 text-sm font-medium shadow-lg transition-colors md:min-h-[44px] md:min-w-[44px] md:flex md:items-center md:justify-center bg-[var(--nav-btn)] text-[var(--nav-btn-ink)] hover:bg-[var(--nav-btn-hover)]';

export function TocBookmark() {
  const locale = useLocale();
  const t = useTranslations();
  const routes = getRoutes(locale);
  return (
    <nav
      className="absolute left-1/2 top-0 z-20 flex -translate-x-1/2 items-center gap-2"
      aria-label={t('navAria')}
    >
      <Link href={routes.home} className={navLinkClass}>
        {t('navToc')}
      </Link>
      <Link href={routes.chapter(CHAPTER_IDS.TREE)} className={navLinkClass}>
        {t('navTree')}
      </Link>
    </nav>
  );
}
