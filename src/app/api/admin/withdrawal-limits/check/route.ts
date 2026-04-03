import { NextRequest, NextResponse } from 'next/server';
import { checkLimit } from '@/services/withdrawalLimitsService';

/**
 * POST /api/admin/withdrawal-limits/check
 * التحقق من حد لعميل معين
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customer_id, amount } = body;

    if (!customer_id || !amount) {
      return NextResponse.json(
        { success: false, error: 'معرف العميل والمبلغ مطلوبان' },
        { status: 400 }
      );
    }

    const result = await checkLimit(customer_id, amount);
    
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error in POST /api/admin/withdrawal-limits/check:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
      },
      { status: 500 }
    );
  }
}
