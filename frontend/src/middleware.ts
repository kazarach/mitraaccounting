import { NextRequest, NextResponse } from 'next/server';

const publicPaths = ['/login', '/api', '/_next', '/favicon.ico'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = publicPaths.some((path) => pathname.startsWith(path));
  if (isPublic) return NextResponse.next();

  const access = request.cookies.get('access')?.value;
  const refresh = request.cookies.get('refresh')?.value;

  if (!access || !refresh) {
    return NextResponse.redirect(new URL('/login',request.url));
  }
  return NextResponse.next();

}

export const config = {
  matcher: '/:path*',
};


