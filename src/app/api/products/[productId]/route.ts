import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { Prisma } from '@prisma/client';

const serializeBigInt = (value: any): any => {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (value instanceof Prisma.Decimal) {
    return value.toString();
  }
  if (value === null || value === undefined) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(serializeBigInt);
  }
  if (typeof value === 'object') {
    const serialized: Record<string, any> = {};
    for (const [key, val] of Object.entries(value)) {
      serialized[key] = serializeBigInt(val);
    }
    return serialized;
  }
  return value;
};

export async function GET(request: Request, { params }: { params: { productId: string } }) {
  const { productId } = await params;

  try {
    const product = await prisma.store_products.findUnique({
      where: {
        id: productId,
      },
      include: {
        store_product_images: true,
        store_product_prices: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(serializeBigInt(product));
  } catch (error) {
    console.error('Error fetching product by ID in API:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}