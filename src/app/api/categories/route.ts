import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { serializeBigInt } from '@/lib/utils';

/**
 * API Route لجلب الفئات (alias لـ main-categories لتسهيل الاختبارات)
 * GET /api/categories
 */
export async function GET() {
  try {
    const mainCategories = await prisma.store_main_categories.findMany({
      orderBy: {
        sort_order: 'asc'
      }
    });
    
    return NextResponse.json(serializeBigInt(mainCategories));
  } catch (error) {
    return NextResponse.json({ 
      message: 'Failed to fetch categories',
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
