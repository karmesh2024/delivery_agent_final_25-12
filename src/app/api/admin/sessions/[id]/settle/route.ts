/**
 * API Route: /api/admin/sessions/[id]/settle
 * تسوية (اعتماد) جلسة تجميع
 */

import { NextRequest, NextResponse } from 'next/server';
import { settleSession, getSession } from '@/services/pointsService';

export async function POST(
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

    // جلب بيانات الجلسة للتحقق
    const session = await getSession(sessionId);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'الجلسة غير موجودة' },
        { status: 404 }
      );
    }

    if (session.is_settled) {
      return NextResponse.json(
        { success: false, error: 'الجلسة مقفلة بالفعل' },
        { status: 400 }
      );
    }

    if (session.status !== 'completed') {
      return NextResponse.json(
        { success: false, error: `الجلسة لم تكتمل بعد. الحالة الحالية: ${session.status}` },
        { status: 400 }
      );
    }

    // تسوية الجلسة
    const result = await settleSession(sessionId);

    return NextResponse.json({
      success: true,
      message: 'تم اعتماد الجلسة بنجاح',
      data: {
        sessionId,
        basePoints: session.base_points,
        walletAmount: (session.base_points || 0) / 100
      }
    });
  } catch (error) {
    console.error('Error in POST /api/admin/sessions/[id]/settle:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع' 
      },
      { status: 500 }
    );
  }
}
