'use client';

import { useLocaleRoutes } from '@/lib/i18n/context';
import Link from 'next/link';

export function AdminButton() {
  const { routes, t } = useLocaleRoutes();
  const label = t('adminTitle');
  return (
    <Link
      href={routes.admin}
      className="flex h-9 w-9 cursor-pointer flex-shrink-0 items-center justify-center rounded-lg border-2 border-[var(--border)] bg-[var(--paper)] shadow-md transition-shadow hover:shadow-lg md:h-11 md:w-11"
      aria-label={label}
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
        className="text-[var(--ink)]"
      >
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    </Link>
  );
}
