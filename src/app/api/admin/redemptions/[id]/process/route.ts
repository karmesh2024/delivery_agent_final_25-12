/**
 * API Route: /api/admin/redemptions/[id]/process
 * معالجة طلب السحب/الاستبدال (موافقة أو رفض)
 */

import { NextRequest, NextResponse } from 'next/server';
import { processRedemption, getRedemption, checkUnsettledSessions } from '@/services/pointsService';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const redemptionId = params.id;
    const body = await request.json();
    const { action, processedBy, referenceNumber, notes } = body;

    if (!redemptionId) {
      return NextResponse.json(
        { success: false, error: 'معرف طلب الاستبدال مطلوب' },
        { status: 400 }
      );
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'الإجراء مطلوب (approve أو reject)' },
        { status: 400 }
      );
    }

    // جلب بيانات الطلب
    const redemption = await getRedemption(redemptionId);

    if (!redemption) {
      return NextResponse.json(
        { success: false, error: 'طلب الاستبدال غير موجود' },
        { status: 404 }
      );
    }

    if (redemption.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: `لا يمكن معالجة طلب في حالة: ${redemption.status}` },
        { status: 400 }
      );
    }

    // التحقق من الجلسات المعلقة (للموافقة فقط)
    if (action === 'approve' && redemption.redemption_type === 'cash') {
      const unsettledCount = await checkUnsettledSessions(redemption.customer_id);
      
      if (unsettledCount > 0) {
        return NextResponse.json({
          success: false,
          error: `يوجد ${unsettledCount} جلسة غير مقفلة. لا يمكن الموافقة على السحب.`,
          unsettledSessions: unsettledCount
        }, { status: 400 });
      }
    }

    // معالجة الطلب
    const result = await processRedemption(
      redemptionId,
      action,
      processedBy,
      referenceNumber,
      notes
    );

    return NextResponse.json({
      success: true,
      message: action === 'approve' 
        ? 'تمت الموافقة على طلب السحب بنجاح' 
        : 'تم رفض طلب السحب وإرجاع النقاط',
      data: result
    });
  } catch (error) {
    console.error('Error in POST /api/admin/redemptions/[id]/process:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع' 
      },
      { status: 500 }
    );
  }
}
