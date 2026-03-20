import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { DEFAULT_LOCALE, isLocale } from '@/lib/i18n/config';
import { getPathSegments } from '@/lib/utils/path';
import { ADMIN_TAB_COOKIE, ADMIN_TAB_IDS } from '@/lib/constants/storage';

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const segments = getPathSegments(pathname);

  // /[locale]/admin without ?tab= — redirect to ?tab= from cookie or persons
  if (segments.length === 2 && isLocale(segments[0]!) && segments[1] === 'admin') {
    if (!searchParams.has('tab')) {
      const tab = request.cookies.get(ADMIN_TAB_COOKIE)?.value;
      const validTab = tab && (ADMIN_TAB_IDS as readonly string[]).includes(tab) ? tab : 'persons';
      const url = new URL(request.url);
      url.searchParams.set('tab', validTab);
      const res = NextResponse.redirect(url);
      res.cookies.set(ADMIN_TAB_COOKIE, validTab, { path: '/', maxAge: 60 * 60 * 24 * 365 });
      return res;
    }
    return NextResponse.next();
  }

  // Locale already in path — skip
  if (segments.length > 0 && isLocale(segments[0]!)) {
    return NextResponse.next();
  }

  // /, /admin, /chapter/... — redirect to /{DEFAULT_LOCALE}/...
  const locale = DEFAULT_LOCALE;
  const newPath = pathname === '/' ? `/${locale}` : `/${locale}${pathname}`;
  const url = new URL(request.url);
  url.pathname = newPath;
  return NextResponse.redirect(url);
}

/** Matcher: all pages except _next, api and static assets. */
export const config = {
  matcher: ['/((?!_next|api|_next/static|_next/image|favicon\\.ico|.*\\.[a-zA-Z0-9]+$).*)'],
};
