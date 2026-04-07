import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {

  // ── 1. التحقق من صلاحية المستخدم ────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
      console.warn('[Pulse-Trigger] ❌ Authorization header completely missing');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) {
      console.warn('[Pulse-Trigger] ❌ Authorization header present but token is empty');
      return NextResponse.json({ error: 'Unauthorized: Empty Token' }, { status: 401 });
  }

  // Diagnostic Log (length only for security)
  console.log(`[Pulse-Trigger] 🔍 Attempting auth with token length: ${token.length}`);

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    console.warn('[Pulse-Trigger] ❌ Auth failure:', authError?.message || 'No user found');
    return NextResponse.json({ 
        error: 'Unauthorized', 
        detail: authError?.message || 'User not found for this token',
        token_received_length: token.length
    }, { status: 401 });
  }

  console.log('[Pulse-Trigger] ✅ Authorized user:', user.email);

  // ── 2. استدعاء الـ Pulse الحقيقي داخلياً ─────
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const secret = process.env.CRON_SECRET ?? '';

  if (!secret) {
    console.error('[Pulse-Trigger] CRON_SECRET not configured');
    return NextResponse.json(
      { error: 'CRON_SECRET not configured' },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(`${appUrl}/api/zoon/discovery/pulse`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${secret}`,
      },
    });

    const text = await res.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      console.error('[Pulse-Trigger] Pulse returned non-JSON:', text.substring(0, 200));
      data = { error: 'Pulse returned invalid response', status: res.status };
    }
    return NextResponse.json(data, { status: res.ok ? res.status : 500 });

  } catch (err) {
    console.error('[Pulse-Trigger] Fetch error:', err);
    return NextResponse.json(
      { error: 'Failed to trigger pulse', detail: String(err) },
      { status: 500 }
    );
  }
}
