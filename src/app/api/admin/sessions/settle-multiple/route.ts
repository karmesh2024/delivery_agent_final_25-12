/**
 * API Route: /api/admin/sessions/settle-multiple
 * تسوية (اعتماد) جلسات متعددة دفعة واحدة
 */

import { NextRequest, NextResponse } from 'next/server';
import { settleMultipleSessions } from '@/services/pointsService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionIds } = body;

    if (!sessionIds || !Array.isArray(sessionIds) || sessionIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'قائمة معرفات الجلسات مطلوبة' },
        { status: 400 }
      );
    }

    const result = await settleMultipleSessions(sessionIds);

    return NextResponse.json({
      success: true,
      message: `تم اعتماد ${result.results.length} جلسة`,
      data: result
    });
  } catch (error) {
    console.error('Error in POST /api/admin/sessions/settle-multiple:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع' 
      },
      { status: 500 }
    );
  }
}
