import { NextRequest, NextResponse } from 'next/server';
import { getLimitStats } from '@/services/withdrawalLimitsService';

/**
 * GET /api/admin/withdrawal-limits/stats
 * الحصول على إحصائيات استخدام الحدود
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('from_date') || undefined;
    const toDate = searchParams.get('to_date') || undefined;

    const stats = await getLimitStats(fromDate, toDate);
    
    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/withdrawal-limits/stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
      },
      { status: 500 }
    );
  }
}
