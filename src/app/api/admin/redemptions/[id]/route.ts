/**
 * API Route: /api/admin/redemptions/[id]
 * جلب تفاصيل طلب استبدال معين
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRedemption } from '@/services/pointsService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const redemptionId = params.id;

    if (!redemptionId) {
      return NextResponse.json(
        { success: false, error: 'معرف طلب الاستبدال مطلوب' },
        { status: 400 }
      );
    }

    const redemption = await getRedemption(redemptionId);

    return NextResponse.json({
      success: true,
      data: redemption
    });
  } catch (error) {
    console.error('Error in GET /api/admin/redemptions/[id]:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع' 
      },
      { status: 500 }
    );
  }
}
