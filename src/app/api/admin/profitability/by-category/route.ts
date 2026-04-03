import { NextRequest, NextResponse } from 'next/server';
import { getProfitabilityByCategory } from '@/services/profitabilityService';

/**
 * GET /api/admin/profitability/by-category
 * الحصول على الربحية حسب الفئة
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const fromDate = searchParams.get('from_date') || undefined;
    const toDate = searchParams.get('to_date') || undefined;
    
    const data = await getProfitabilityByCategory(fromDate, toDate);
    
    return NextResponse.json({
      success: true,
      data
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/profitability/by-category:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
      },
      { status: 500 }
    );
  }
}
