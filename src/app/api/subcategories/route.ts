import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { Prisma } from '@prisma/client';
import { generateSlug } from '@/lib/utils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mainCategoryId = searchParams.get('main_category_id');
    const shopId = searchParams.get('shop_id');

    const whereClause: Prisma.store_subcategoriesWhereInput = {};
    if (mainCategoryId) {
      whereClause.main_category_id = mainCategoryId;
    }
    if (shopId) {
      whereClause.shop_id = shopId;
    }

    const subcategories = await prisma.store_subcategories.findMany({
      where: whereClause,
      orderBy: {
        sort_order: 'asc',
      },
    });
    return NextResponse.json(subcategories);
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      message: 'Failed to fetch subcategories', 
      error: errorMessage 
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const {
      main_category_id,
      name_ar,
      name_en,
      slug,
      sort_order,
      is_active,
      shop_id,
    } = await request.json();

    if (!main_category_id || !name_ar || !shop_id) {
      return NextResponse.json({ message: 'Main Category ID, Arabic name, and Shop ID are required' }, { status: 400 });
    }

    let generatedSlug = slug && slug !== '' ? slug : generateSlug(name_en || name_ar);
    let newSubCategory;
    const MAX_RETRIES = 3;

    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        newSubCategory = await prisma.store_subcategories.create({
          data: {
            name_ar,
            name_en: name_en === '' ? null : name_en,
            slug: generatedSlug,
            sort_order: sort_order ?? 0,
            is_active: is_active ?? true,
            store_main_categories: {
              connect: {
                id: main_category_id,
              },
            },
            store_shops: {
              connect: {
                id: shop_id,
              },
            },
          },
        });
        break; // If successful, break the loop
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          if (i < MAX_RETRIES - 1) {
            // Append a short random string to the slug and retry
            generatedSlug = `${generateSlug(name_en || name_ar)}-${Math.random().toString(36).substring(2, 6)}`;
            console.warn(`Slug '${generatedSlug}' conflicted, retrying with new slug.`);
          } else {
            // Last retry failed, re-throw the original error
            throw error;
          }
        } else {
          // Not a unique constraint error, re-throw it
          throw error;
        }
      }
    }

    return NextResponse.json(newSubCategory, { status: 201 });
  } catch (error) {
    console.error('Error creating subcategory:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ message: 'Subcategory with this slug already exists for this main category and shop. Please try a different name or slug.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Failed to create subcategory' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const {
      id,
      main_category_id,
      name_ar,
      name_en,
      slug,
      sort_order,
      is_active,
      shop_id,
    } = await request.json();

    if (!id || !main_category_id || !name_ar || !shop_id) {
      return NextResponse.json({ message: 'ID, Main Category ID, Arabic name, and Shop ID are required for update' }, { status: 400 });
    }

    let generatedSlug = slug && slug !== '' ? slug : generateSlug(name_en || name_ar);
    let updatedSubCategory;
    const MAX_RETRIES = 3;

    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        updatedSubCategory = await prisma.store_subcategories.update({
          where: { id },
          data: {
            name_ar,
            name_en: name_en === '' ? null : name_en,
            slug: generatedSlug,
            sort_order: sort_order ?? 0,
            is_active: is_active ?? true,
            store_main_categories: {
              connect: {
                id: main_category_id,
              },
            },
            store_shops: {
              connect: {
                id: shop_id,
              },
            },
          },
        });
        break; // If successful, break the loop
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          if (i < MAX_RETRIES - 1) {
            // Append a short random string to the slug and retry
            generatedSlug = `${generateSlug(name_en || name_ar)}-${Math.random().toString(36).substring(2, 6)}`;
            console.warn(`Slug '${generatedSlug}' conflicted, retrying with new slug.`);
          } else {
            // Last retry failed, re-throw the original error
            throw error;
          }
        } else {
          // Not a unique constraint error, re-throw it
          throw error;
        }
      }
    }

    return NextResponse.json(updatedSubCategory);
  } catch (error) {
    console.error('Error updating subcategory:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ message: 'Subcategory with this slug already exists for this main category and shop. Please try a different name or slug.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Failed to update subcategory' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'Subcategory ID is required' }, { status: 400 });
    }

    await prisma.store_subcategories.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Subcategory deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting subcategory:', error);
    return NextResponse.json({ message: 'Failed to delete subcategory' }, { status: 500 });
  }
}