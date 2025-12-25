import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function POST(
  req: NextRequest,
  { params }: { params: { storeId: string; productId: string } }
) {
  const { storeId, productId } = await params;
  console.log('[Product Prices API] Received POST request for storeId:', storeId, 'and productId:', productId);

  if (!storeId || !productId) {
    return NextResponse.json(
      { error: 'Missing storeId or productId' },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    console.log('[Product Prices API] Request body:', body);

    const priceData: Prisma.store_product_pricesCreateInput = {
      store_products: {
        connect: { id: productId },
      },
      price: new Prisma.Decimal(body.price),
      price_name_ar: body.price_name_ar,
      price_name_en: body.price_name_en || null,
      store_target_audiences: body.target_audience_id ? { connect: { id: body.target_audience_id } } : undefined,
      is_on_sale: body.is_on_sale || false,
      sale_price: body.sale_price ? new Prisma.Decimal(body.sale_price) : null,
      price_type: body.price_type || 'selling',
      profit_margin: body.profit_margin ? new Prisma.Decimal(body.profit_margin) : null,
      min_price: body.min_price ? new Prisma.Decimal(body.min_price) : null,
      max_discount_percentage: body.max_discount_percentage ? new Prisma.Decimal(body.max_discount_percentage) : null,
      is_negotiable: body.is_negotiable || false,
      effective_from: body.effective_from ? new Date(body.effective_from) : null,
      effective_to: body.effective_to ? new Date(body.effective_to) : null,
      // لا تتضمن created_at و updated_at لأن Prisma يتعامل معهما تلقائياً
      // الروابط إلى الجداول الأخرى مثل store_products و store_target_audiences يتم التعامل معها عبر foreign keys
    };
    console.log('[Product Prices API] Data for Prisma create:', priceData);

    const newPrice = await prisma.store_product_prices.create({
      data: priceData,
    });

    console.log('[Product Prices API] Product price created:', newPrice);
    return NextResponse.json(newPrice, { status: 201 });
  } catch (error) {
    console.error('[Product Prices API] Error creating product price:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P2002: Unique constraint failed
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'A product price with these details already exists.' },
          { status: 409 }
        );
      }
      // P2003: Foreign key constraint failed
      if (error.code === 'P2003') {
        return NextResponse.json(
          { error: 'Foreign key constraint failed. Product or target audience not found.' },
          { status: 404 }
        );
      }
    }
    return NextResponse.json(
      { error: 'Failed to create product price', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 