import { NextResponse, NextRequest, } from 'next/server';

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();
  const apiRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/token/`, {
    method: 'POST',
    body: JSON.stringify({ username, password }),
    headers: { 'Content-Type': 'application/json' },
  });
  if (!apiRes.ok) return NextResponse.json({ error: 'Login failed' }, { status: 401 });
  const { access, refresh } = await apiRes.json();
  const response = NextResponse.json({ success: true });
  response.cookies.set('access', access, {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60,
  });

  response.cookies.set('refresh', refresh, {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
  });

  // const access2 = request.cookies.get('access')?.value;
  // const refresh2 = request.cookies.get('refresh')?.value;
  // console.log("[MIDDLEWARE]", { access2, refresh2 });
  return response;
}
