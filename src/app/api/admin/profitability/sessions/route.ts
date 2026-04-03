import { NextRequest, NextResponse } from 'next/server';
import { getProfitabilitySessions } from '@/services/profitabilityService';

/**
 * GET /api/admin/profitability/sessions
 * الحصول على الجلسات مع تفاصيل الربحية
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      from_date: searchParams.get('from_date') || undefined,
      to_date: searchParams.get('to_date') || undefined,
      min_profit: searchParams.get('min_profit') 
        ? parseFloat(searchParams.get('min_profit')!) 
        : undefined,
      max_profit: searchParams.get('max_profit') 
        ? parseFloat(searchParams.get('max_profit')!) 
        : undefined,
      min_margin: searchParams.get('min_margin') 
        ? parseFloat(searchParams.get('min_margin')!) 
        : undefined,
      max_margin: searchParams.get('max_margin') 
        ? parseFloat(searchParams.get('max_margin')!) 
        : undefined,
      is_settled: searchParams.get('is_settled') 
        ? searchParams.get('is_settled') === 'true' 
        : undefined,
      status: searchParams.get('status') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };
    
    const result = await getProfitabilitySessions(filters);
    
    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/profitability/sessions:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
      },
      { status: 500 }
    );
  }
}
