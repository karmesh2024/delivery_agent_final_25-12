/**
 * API Route: /api/admin/dashboard/stats
 * إحصائيات لوحة التحكم
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDashboardStats } from '@/services/pointsService';

export async function GET(request: NextRequest) {
  try {
    const stats = await getDashboardStats();

    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error in GET /api/admin/dashboard/stats:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع' 
      },
      { status: 500 }
    );
  }
}
