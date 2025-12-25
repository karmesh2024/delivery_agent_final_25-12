import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

/**
 * GET /api/stores
 * Fetches all stores
 */
export async function GET() {
  try {
    const stores = await prisma.store_shops.findMany({
      orderBy: {
        created_at: 'desc',
      },
    });
    return NextResponse.json(stores);
  } catch (error) {
    console.error('[STORES_GET_API] Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

/**
 * POST /api/stores
 * Creates a new store
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name_ar, name_en, description_ar, description_en, logo_path, cover_path, slug, is_active } = body;

    if (!name_ar || !slug) {
      return new NextResponse('Name and slug are required', { status: 400 });
    }

    const newStore = await prisma.store_shops.create({
      data: {
        name_ar,
        name_en,
        description_ar,
        description_en,
        logo_path,
        cover_path,
        slug,
        is_active,
      },
    });

    return NextResponse.json(newStore, { status: 201 });
  } catch (error) {
    console.error('[STORES_POST_API] Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 