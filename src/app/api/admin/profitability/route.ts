import { NextRequest, NextResponse } from 'next/server';
import { getProfitabilityStats, getProfitabilitySessions } from '@/services/profitabilityService';

/**
 * GET /api/admin/profitability
 * الحصول على إحصائيات الربحية
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const period = (searchParams.get('period') || 'daily') as 'daily' | 'weekly' | 'monthly' | 'custom';
    const fromDate = searchParams.get('from_date') || undefined;
    const toDate = searchParams.get('to_date') || undefined;
    
    const stats = await getProfitabilityStats(period, fromDate, toDate);
    
    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/profitability:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
      },
      { status: 500 }
    );
  }
}
