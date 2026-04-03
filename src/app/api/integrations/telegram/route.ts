import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { method = 'sendMessage', body, token } = await req.json();

    if (!token) {
      return NextResponse.json({ ok: false, description: 'Missing bot token' }, { status: 400 });
    }

    const url = `https://api.telegram.org/bot${token}/${method}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ ok: false, description: error.message }, { status: 500 });
  }
}
