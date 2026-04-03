import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  });
}

/**
 * GET /api/admin/profitability/time-series
 * الحصول على بيانات الربحية عبر الزمن
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('from_date') || undefined;
    const toDate = searchParams.get('to_date') || undefined;
    const period = searchParams.get('period') || 'daily'; // daily, weekly, monthly

    const supabase = getSupabaseClient();
    
    let query = supabase
      .from('waste_collection_sessions')
      .select('created_at, buy_total, sell_total, platform_profit')
      .eq('status', 'completed')
      .not('buy_total', 'is', null)
      .not('sell_total', 'is', null)
      .order('created_at', { ascending: true });

    if (fromDate) {
      query = query.gte('created_at', fromDate);
    }

    if (toDate) {
      query = query.lte('created_at', toDate);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // تجميع البيانات حسب الفترة
    const groupedData: Record<string, { buy_total: number; sell_total: number; profit: number }> = {};

    (data || []).forEach((session: any) => {
      const date = new Date(session.created_at);
      let key = '';

      switch (period) {
        case 'daily':
          key = date.toISOString().split('T')[0];
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      if (!groupedData[key]) {
        groupedData[key] = { buy_total: 0, sell_total: 0, profit: 0 };
      }

      groupedData[key].buy_total += session.buy_total || 0;
      groupedData[key].sell_total += session.sell_total || 0;
      groupedData[key].profit += session.platform_profit || 0;
    });

    const result = Object.entries(groupedData).map(([date, values]) => ({
      date,
      buy_total: values.buy_total,
      sell_total: values.sell_total,
      profit: values.profit,
    }));

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/profitability/time-series:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
      },
      { status: 500 }
    );
  }
}
