/**
 * API Route: /api/admin/sessions/[id]
 * جلب تفاصيل جلسة معينة
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/services/pointsService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'معرف الجلسة مطلوب' },
        { status: 400 }
      );
    }

    const session = await getSession(sessionId);

    return NextResponse.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Error in GET /api/admin/sessions/[id]:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع' 
      },
      { status: 500 }
    );
  }
}
