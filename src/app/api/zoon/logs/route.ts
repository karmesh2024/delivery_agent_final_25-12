import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: جلب سجلات التنفيذ
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '50');
  const status = searchParams.get('status');

  try {
    const logs = await (prisma as any).tool_execution_logs.findMany({
      where: status ? { status } : {},
      orderBy: { created_at: 'desc' },
      take: limit
    });
    return NextResponse.json(logs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
