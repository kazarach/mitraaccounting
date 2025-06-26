import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function GET(request: NextRequest, context: { params: { slug: string[] } }) {
  const { params } = await context;
  const token = request.cookies.get('access')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const query = request.nextUrl.search;
  let slugPath = params.slug.join('/');
  if (!slugPath.endsWith('/')) slugPath += '/';
  const url = `${API_URL}${slugPath}${query}`;

  console.log('Proxy URL:', url);

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } else {
    const text = await res.text();
  
    return NextResponse.json(
      {
        error: 'Invalid response from backend (not JSON)',
        status: res.status,
        details: text.slice(0, 400),
      },
      { status: res.status }
    );
  }
}


export async function POST(request: NextRequest, context: { params: { slug: string[] } }) {
  const { params } = await context;
  const token = request.cookies.get('access')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const query = request.nextUrl.search;
  let slugPath = params.slug.join('/');
  if (!slugPath.endsWith('/')) slugPath += '/';
  const url = `${API_URL}${slugPath}${query}`;

  const body = await request.text(); // atau request.json() kalau yakin selalu JSON

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': request.headers.get('content-type') || 'application/json',
    },
    body,
  });

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } else {
    const text = await res.text();
    return NextResponse.json({
      error: 'Invalid response from backend (not JSON)',
      status: res.status,
      details: text.slice(0, 400),
    }, { status: res.status });
  }
}