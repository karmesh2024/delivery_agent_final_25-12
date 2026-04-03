import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { endpoint, method = 'GET', body, accessToken } = await req.json();

    if (!endpoint || !accessToken) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
    }

    // بناء الرابط
    const url = new URL(`https://graph.facebook.com/v21.0/${endpoint}`);
    url.searchParams.append('access_token', accessToken);

    const response = await fetch(url.toString(), {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
