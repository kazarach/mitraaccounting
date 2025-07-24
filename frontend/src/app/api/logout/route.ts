import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });

  // Hapus cookies dengan set maxAge: 0
  response.cookies.set('access', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
  });

  response.cookies.set('refresh', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
  });

  return response;
}
