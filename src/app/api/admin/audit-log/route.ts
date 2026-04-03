/**
 * API Route: GET /api/admin/audit-log
 * الحصول على سجل العمليات والمزامنة
 */

import { NextResponse } from 'next/server';
import { auditService } from '@/services/auditService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');
    const entityType = searchParams.get('entityType') as any;

    let logs;
    if (filter === 'failed') {
      logs = await auditService.getFailedOperations(limit);
    } else {
      logs = await auditService.getRecentLogs(limit);
      if (filter !== 'all') {
        logs = logs.filter(log => log.sync_status === filter);
      }
    }

    if (entityType) {
      logs = logs.filter(log => log.entity_type === entityType);
    }

    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    console.error('Error in GET /api/admin/audit-log:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
