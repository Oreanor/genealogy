'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Clipboard, Save } from 'lucide-react';
import { AdminButton } from '@/components/ui/AdminButton';
import { PageColorPicker } from '@/components/ui/PageColorPickerClient';
import { LocaleSwitcher } from '@/components/ui/LocaleSwitcher';
import { Tooltip } from '@/components/ui/Tooltip';
import { Button } from '@/components/ui/atoms/Button';
import { useLocaleRoutes } from '@/lib/i18n/context';
import { useAdminToolbar } from '@/lib/contexts/AdminToolbarContext';

function BookLinkButton({ title }: { title?: string }) {
  const { routes, t } = useLocaleRoutes();
  const label = title ?? t('navTree');
  return (
    <Link
      href={routes.home}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-[var(--border)] bg-[var(--paper)] text-[var(--ink)] shadow-md transition-shadow hover:shadow-lg md:h-11 md:w-11"
      aria-label={label}
    >
      <BookOpen className="size-[18px]" aria-hidden />
    </Link>
  );
}

/** Vertical toolbar on the right: admin/book, color, language; in admin — copy and download JSON */
export function BookToolbar() {
  const pathname = usePathname() ?? '';
  const isAdmin = pathname.includes('/admin');
  const { actions } = useAdminToolbar();
  const { t } = useLocaleRoutes();

  return (
    <div className="absolute left-2 top-[2vh] z-20 flex flex-col items-start gap-2">
      <Tooltip label={isAdmin ? t('tooltipToBook') : t('adminTitle')} side="right">
        {isAdmin ? <BookLinkButton title={t('tooltipToBook')} /> : <AdminButton />}
      </Tooltip>
      <Tooltip label={t('tooltipPageColor')} side="right">
        <PageColorPicker />
      </Tooltip>
      <Tooltip label={t('tooltipLanguage')} side="right">
        <LocaleSwitcher />
      </Tooltip>
      {isAdmin && actions && (
        <>
          <Tooltip label={t('adminCopyJson')} side="right">
            <Button
              variant="icon"
              onClick={actions.onCopy}
              aria-label={t('adminCopyJson')}
            >
              <Clipboard className="size-5" aria-hidden />
            </Button>
          </Tooltip>
          <Tooltip label={t('adminDownloadJson')} side="right">
            <Button
              variant="icon"
              onClick={actions.onDownload}
              aria-label={t('adminDownloadJson')}
            >
              <Save className="size-5" aria-hidden />
            </Button>
          </Tooltip>
        </>
      )}
    </div>
  );
}
