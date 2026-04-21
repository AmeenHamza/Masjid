import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const localePrefixMatch = request.nextUrl.pathname.match(/^\/(en|ur)(\/.*)?$/);
  if (localePrefixMatch) {
    const cleanPath = localePrefixMatch[2] || '/';
    const url = request.nextUrl.clone();
    url.pathname = cleanPath;
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

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
