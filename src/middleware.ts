import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { DEFAULT_LOCALE, isLocale } from '@/lib/i18n/config';
import { getPathSegments } from '@/lib/utils/path';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const segments = getPathSegments(pathname);

  // Уже есть локаль в пути — пропускаем
  if (segments.length > 0 && isLocale(segments[0]!)) {
    return NextResponse.next();
  }

  // / или /glava/... — редирект на /ru или /ru/glava/...
  const locale = DEFAULT_LOCALE;
  const newPath = pathname === '/' ? `/${locale}` : `/${locale}${pathname}`;
  return NextResponse.redirect(new URL(newPath, request.url));
}

export const config = {
  matcher: ['/', '/glava/:path*'],
};
