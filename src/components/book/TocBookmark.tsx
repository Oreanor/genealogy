import { ROUTES } from '@/lib/constants/routes';
import Link from 'next/link';

export function TocBookmark() {
  return (
    <Link
      href={ROUTES.home}
      className="absolute left-1/2 top-[2vh] z-20 -translate-x-1/2 rounded-b-lg bg-amber-800 px-5 py-2 text-sm font-medium text-amber-50 shadow-lg transition-colors hover:bg-amber-900 md:min-h-[44px] md:min-w-[44px] md:flex md:items-center md:justify-center"
    >
      Оглавление
    </Link>
  );
}
