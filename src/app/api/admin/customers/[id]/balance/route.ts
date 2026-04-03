/**
 * API Route: /api/admin/customers/[id]/balance
 * جلب ملخص رصيد العميل
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCustomerBalance, checkUnsettledSessions } from '@/services/pointsService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customerId = params.id;

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: 'معرف العميل مطلوب' },
        { status: 400 }
      );
    }

    const balance = await getCustomerBalance(customerId);
    const unsettledCount = await checkUnsettledSessions(customerId);

    return NextResponse.json({
      success: true,
      data: {
        ...balance,
        unsettled_sessions: unsettledCount,
        can_withdraw: unsettledCount === 0 && balance.wallet_balance > 0
      }
    });
  } catch (error) {
    console.error('Error in GET /api/admin/customers/[id]/balance:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع' 
      },
      { status: 500 }
    );
  }
}
