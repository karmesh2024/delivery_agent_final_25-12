/**
 * API Route: /api/admin/sessions
 * إدارة جلسات التجميع
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessions } from '@/services/pointsService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      status: searchParams.get('status') || undefined,
      is_settled: searchParams.get('is_settled') 
        ? searchParams.get('is_settled') === 'true' 
        : undefined,
      customer_id: searchParams.get('customer_id') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      from_date: searchParams.get('from_date') || undefined,
      to_date: searchParams.get('to_date') || undefined,
    };

    const result = await getSessions(filters);

    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error in GET /api/admin/sessions:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع' 
      },
      { status: 500 }
    );
  }
}
