import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { Prisma } from '@prisma/client';
import { serializeBigInt } from '@/lib/utils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shop_id');

    const whereClause: Prisma.store_main_categoriesWhereInput = {};
    if (shopId) {
      whereClause.shop_id = shopId;
    }

    const mainCategories = await prisma.store_main_categories.findMany({
      where: whereClause,
      orderBy: {
        created_at: 'asc'
      },
    });
    
    // ترتيب النتائج يدوياً حسب sort_order
    const sortedCategories = mainCategories.sort((a, b) => {
      const aOrder = a.sort_order ?? 999999;
      const bOrder = b.sort_order ?? 999999;
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }
      const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
      return aDate - bDate;
    });

    return NextResponse.json(serializeBigInt(sortedCategories));
  } catch (error) {
    console.error('Error fetching main categories:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      message: 'Failed to fetch main categories',
      error: errorMessage 
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const {
      shop_id,
      name_ar,
      name_en,
      description_ar,
      description_en,
      image_url,
      slug,
      is_active,
      sort_order,
    } = await request.json();

    if (!shop_id || !name_ar) {
      return NextResponse.json({ message: 'Shop ID and Arabic name are required' }, { status: 400 });
    }

    const newMainCategory = await prisma.store_main_categories.create({
      data: {
        name_ar,
        name_en,
        description_ar,
        description_en,
        image_url,
        slug,
        is_active,
        sort_order,
        store_shops: {
          connect: {
            id: shop_id,
          },
        },
      },
    });
    return NextResponse.json(newMainCategory, { status: 201 });
  } catch (error) {
    console.error('Error creating main category:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ message: 'Main category with this slug already exists for this shop.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Failed to create main category' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const {
      id,
      shop_id,
      name_ar,
      name_en,
      description_ar,
      description_en,
      image_url,
      slug,
      is_active,
      sort_order,
    } = await request.json();

    if (!id) {
      return NextResponse.json({ message: 'Main category ID is required' }, { status: 400 });
    }

    const updatedMainCategory = await prisma.store_main_categories.update({
      where: { id },
      data: {
        name_ar,
        name_en,
        description_ar,
        description_en,
        image_url,
        slug,
        is_active,
        sort_order,
        store_shops: {
          connect: {
            id: shop_id,
          },
        },
      },
    });
    return NextResponse.json(updatedMainCategory);
  } catch (error) {
    console.error('Error updating main category:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ message: 'Main category with this slug already exists for this shop.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Failed to update main category' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'Main Category ID is required' }, { status: 400 });
    }

    await prisma.store_main_categories.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Main category deleted successfully' }, { status: 204 });
  } catch (error) {
    console.error('Error deleting main category:', error);
    return NextResponse.json({ message: 'Failed to delete main category' }, { status: 500 });
  }
} 