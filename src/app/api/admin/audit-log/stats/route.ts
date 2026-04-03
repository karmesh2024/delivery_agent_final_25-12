/**
 * API Route: GET /api/admin/audit-log/stats
 * الحصول على إحصائيات المزامنة
 */

import { NextResponse } from 'next/server';
import { auditService } from '@/services/auditService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType') as any;

    const stats = await auditService.getSyncStats(entityType);

    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error in GET /api/admin/audit-log/stats:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
