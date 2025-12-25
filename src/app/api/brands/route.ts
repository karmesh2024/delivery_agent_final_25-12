import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shop_id');

    const whereClause: { shop_id?: string } = {};
    if (shopId) {
      whereClause.shop_id = shopId;
    }

    const brands = await prisma.store_brands.findMany({
      where: whereClause,
      orderBy: {
        name_ar: 'asc',
      },
    });
    return NextResponse.json(brands);
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json({ message: 'Failed to fetch brands' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { shop_id, name_ar, name_en, description_ar, description_en, logo_url } = body;

    if (!shop_id || !name_ar) {
      return NextResponse.json({ message: 'shop_id and name_ar are required' }, { status: 400 });
    }

    const existing = await prisma.store_brands.findFirst({
      where: {
        shop_id,
        name_ar,
      },
    });

    if (existing) {
      return NextResponse.json(existing);
    }

    const newBrand = await prisma.store_brands.create({
      data: {
        shop_id,
        name_ar,
        name_en: name_en ?? null,
        description_ar: description_ar ?? null,
        description_en: description_en ?? null,
        logo_url: logo_url ?? null,
        is_active: true,
      },
    });

    return NextResponse.json(newBrand, { status: 201 });
  } catch (error) {
    console.error('Error creating brand:', error);
    return NextResponse.json({ message: 'Failed to create brand' }, { status: 500 });
  }
}