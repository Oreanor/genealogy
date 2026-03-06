'use client';

import { Pencil } from 'lucide-react';
import { useLocaleRoutes } from '@/lib/i18n/context';
import Link from 'next/link';

export function AdminButton() {
  const { routes, t } = useLocaleRoutes();
  const label = t('adminTitle');
  return (
    <Link
      href={routes.admin}
      className="flex h-9 w-9 cursor-pointer flex-shrink-0 items-center justify-center rounded-lg border-2 border-(--border) bg-(--paper) shadow-md transition-shadow hover:shadow-lg md:h-11 md:w-11"
      aria-label={label}
    >
      <Pencil className="size-[18px] text-(--ink)" aria-hidden />
    </Link>
  );
}
