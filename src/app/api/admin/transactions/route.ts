/**
 * API Route: /api/admin/transactions
 * سجل معاملات النقاط (Audit Log)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTransactions } from '@/services/pointsService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      profile_id: searchParams.get('profile_id') || undefined,
      type: searchParams.get('type') || undefined,
      source: searchParams.get('source') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };

    const result = await getTransactions(filters);

    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error in GET /api/admin/transactions:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع' 
      },
      { status: 500 }
    );
  }
}
