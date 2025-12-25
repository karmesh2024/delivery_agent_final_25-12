import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/agents/me/stores
// مؤقتًا: نعيد المتاجر العامة الفعّالة حتى يتم ربط الوكيل بمتاجره لاحقًا
export async function GET() {
  try {
    const stores = await prisma.store_shops.findMany({
      where: { is_active: true },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        name_ar: true,
        name_en: true,
        slug: true,
        logo_path: true,
        is_active: true,
        created_at: true,
      },
    });

    return NextResponse.json({ items: stores });
  } catch (error) {
    console.error('[API] /api/agents/me/stores error:', error);
    return NextResponse.json({ message: 'Failed to fetch stores' }, { status: 500 });
  }
}


