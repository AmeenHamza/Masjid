import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const intlMiddleware = createMiddleware({
  locales: ['en', 'ur'],
  defaultLocale: 'en',
  localePrefix: 'always',
  localeDetection: false
});

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/en';
    return NextResponse.redirect(url);
  }

  const normalizedPath = request.nextUrl.pathname.replace(/^\/(en|ur)\/(en|ur)(?=\/|$)/, '/$1');

  if (normalizedPath !== request.nextUrl.pathname) {
    const url = request.nextUrl.clone();
    url.pathname = normalizedPath;
    return NextResponse.redirect(url);
  }

  const localeAdminMatch = request.nextUrl.pathname.match(/^\/(en|ur)\/admin(\/.*)?$/);
  if (localeAdminMatch) {
    const url = request.nextUrl.clone();
    url.pathname = `/admin${localeAdminMatch[2] || ''}`;
    return NextResponse.redirect(url);
  }

  if (request.nextUrl.pathname === '/admin' || request.nextUrl.pathname.startsWith('/admin/')) {
    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
