import { NextResponse } from 'next/server';
import { supabaseServiceRole } from '@/lib/supabase/base';
import { logger } from '@/lib/logger-safe';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter');
    
    if (!supabaseServiceRole) {
      return NextResponse.json({ error: 'Database client missing' }, { status: 500 });
    }

    let query = supabaseServiceRole.from('delivery_boys').select('*');
    
    if (filter === 'approved') {
      query = query.or('status.eq.active,status.eq.approved');
    } else if (filter === 'pending') {
      query = query.eq('status', 'pending');
    }
    
    const { data: rawData, error } = await query;
    
    if (error) {
      console.error('❌ Agents API Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Minimal, safe mapping
    const agents = (rawData || []).map(agent => ({
      ...agent,
      name: agent.full_name || agent.name || 'مجهول',
      id: agent.id
    }));
    
    return NextResponse.json(agents);
  } catch (err) {
    console.error('❌ Fatal Agents API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
