import { NextRequest, NextResponse } from 'next/server';
import { getLimits, updateLimit } from '@/services/withdrawalLimitsService';

/**
 * GET /api/admin/withdrawal-limits
 * الحصول على جميع الحدود
 */
export async function GET() {
  try {
    const limits = await getLimits();
    
    return NextResponse.json({
      success: true,
      data: limits
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/withdrawal-limits:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/withdrawal-limits
 * تحديث حد معين
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف الحد مطلوب' },
        { status: 400 }
      );
    }

    const limit = await updateLimit(id, updates);
    
    return NextResponse.json({
      success: true,
      data: limit
    });
  } catch (error: any) {
    console.error('Error in PUT /api/admin/withdrawal-limits:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
      },
      { status: 500 }
    );
  }
}
