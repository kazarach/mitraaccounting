// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  
  const isAuthenticated = false; 

  if (!isAuthenticated && req.nextUrl.pathname !== '/login') {

    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next(); 
}


export const config = {
  matcher: ['/'], // Halaman yang memerlukan autentikasi
};
