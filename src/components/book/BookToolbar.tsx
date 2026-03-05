'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { AdminButton } from '@/components/ui/AdminButton';
import { PageColorPicker } from '@/components/ui/PageColorPickerClient';
import { LocaleSwitcher } from '@/components/ui/LocaleSwitcher';
import { useLocaleRoutes } from '@/lib/i18n/context';
import { useAdminToolbar } from '@/lib/contexts/AdminToolbarContext';

const BTN_CLASS =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-[var(--border)] bg-[var(--paper)] shadow-md transition-shadow hover:shadow-lg md:h-11 md:w-11 text-[var(--ink)]';

function BookLinkButton() {
  const { routes, t } = useLocaleRoutes();
  return (
    <Link
      href={routes.home}
      className={BTN_CLASS}
      aria-label={t('navTree')}
      title={t('navTree')}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <path d="M8 7h8" />
        <path d="M8 11h8" />
      </svg>
    </Link>
  );
}

function ClipboardIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="8" y="4" width="12" height="16" rx="2" />
      <path d="M16 2H8a2 2 0 0 0-2 2v2h12V4a2 2 0 0 0-2-2z" />
    </svg>
  );
}

function FloppyIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

/** Vertical toolbar on the right: admin/book, color, language; in admin — copy and download JSON */
export function BookToolbar() {
  const pathname = usePathname() ?? '';
  const isAdmin = pathname.includes('/admin');
  const { actions } = useAdminToolbar();
  const { t } = useLocaleRoutes();

  return (
    <div className="absolute right-2 top-[2vh] z-20 flex flex-col items-end gap-2">
      {isAdmin ? <BookLinkButton /> : <AdminButton />}
      <PageColorPicker />
      <LocaleSwitcher />
      {isAdmin && actions && (
        <>
          <button
            type="button"
            onClick={actions.onCopy}
            title={t('adminCopyJson')}
            className={BTN_CLASS}
            aria-label={t('adminCopyJson')}
          >
            <ClipboardIcon />
          </button>
          <button
            type="button"
            onClick={actions.onDownload}
            title={t('adminDownloadJson')}
            className={BTN_CLASS}
            aria-label={t('adminDownloadJson')}
          >
            <FloppyIcon />
          </button>
        </>
      )}
    </div>
  );
}
