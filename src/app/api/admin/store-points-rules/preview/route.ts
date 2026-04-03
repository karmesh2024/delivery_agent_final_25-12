import { NextRequest, NextResponse } from 'next/server';
import { previewRule } from '@/services/storePointsRulesService';

/**
 * POST /api/admin/store-points-rules/preview
 * معاينة تأثير القاعدة
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rule_id, base_points, customer_tier, is_new_customer } = body;

    if (!rule_id || base_points === undefined) {
      return NextResponse.json(
        { success: false, error: 'معرف القاعدة وعدد النقاط الأساسية مطلوبان' },
        { status: 400 }
      );
    }

    const preview = await previewRule(
      rule_id,
      base_points,
      customer_tier,
      is_new_customer
    );
    
    return NextResponse.json({
      success: true,
      data: preview
    });
  } catch (error: any) {
    console.error('Error in POST /api/admin/store-points-rules/preview:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
      },
      { status: 500 }
    );
  }
}
