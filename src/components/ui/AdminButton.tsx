'use client';

import { Pencil } from 'lucide-react';
import { useLocaleRoutes } from '@/lib/i18n/context';
import { SquareIconLink } from '@/components/ui/SquareIconButton';

export function AdminButton() {
  const { routes, t } = useLocaleRoutes();
  const label = t('adminTitle');
  return (
    <SquareIconLink
      href={routes.admin}
      label={label}
      tone="inverse"
      className="cursor-pointer"
    >
      <Pencil className="size-[18px]" aria-hidden />
    </SquareIconLink>
  );
}
