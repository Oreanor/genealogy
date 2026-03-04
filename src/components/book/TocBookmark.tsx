import { ROUTES } from '@/lib/constants/routes';
import Link from 'next/link';

export function TocBookmark() {
  return (
    <Link
      href={ROUTES.home}
      className="absolute left-1/2 top-[2vh] z-20 -translate-x-1/2 rounded-b-lg px-5 py-2 text-sm font-medium shadow-lg transition-colors md:min-h-[44px] md:min-w-[44px] md:flex md:items-center md:justify-center bg-[var(--nav-btn)] text-[var(--nav-btn-ink)] hover:bg-[var(--nav-btn-hover)]"
    >
      Оглавление
    </Link>
  );
}
