import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: { storeId: string; productId: string } }
) {
  try {
    const { storeId, productId } = await params;

    if (!storeId || !productId) {
      return NextResponse.json(
        { message: 'Store ID and Product ID are required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      image_url,
      alt_text_ar,
      alt_text_en,
      is_primary,
      sort_order,
      media_type,
    } = body;

    if (!image_url) {
      return NextResponse.json(
        { message: 'image_url is required' },
        { status: 400 }
      );
    }

    const product = await prisma.store_products.findFirst({
      where: { id: productId, shop_id: storeId },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json(
        { message: 'Product not found for this store' },
        { status: 404 }
      );
    }

    const createdImage = await prisma.store_product_images.create({
      data: {
        product_id: productId,
        image_url,
        alt_text_ar: alt_text_ar ?? null,
        alt_text_en: alt_text_en ?? null,
        is_primary: is_primary ?? false,
        sort_order: sort_order ?? 0,
        media_type: media_type ?? 'image',
      },
    });

    return NextResponse.json(createdImage, { status: 201 });
  } catch (error) {
    console.error('Failed to create store product image:', error);
    return NextResponse.json(
      {
        message: 'Failed to create store product image',
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

