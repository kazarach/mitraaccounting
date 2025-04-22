import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access')?.value;

  // Jika tidak ada token, redirect ke halaman login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

// Tentukan rute mana saja yang perlu login
export const config = {
  matcher: [
    '/',
    // Tambahkan rute lainnya yang ingin dilindungi
  ],
}
