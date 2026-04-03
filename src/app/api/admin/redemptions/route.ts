/**
 * API Route: /api/admin/redemptions
 * إدارة طلبات السحب/الاستبدال
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRedemptions } from '@/services/pointsService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      status: searchParams.get('status') || undefined,
      redemption_type: searchParams.get('redemption_type') || undefined,
      customer_id: searchParams.get('customer_id') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };

    const result = await getRedemptions(filters);

    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error in GET /api/admin/redemptions:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع' 
      },
      { status: 500 }
    );
  }
}
