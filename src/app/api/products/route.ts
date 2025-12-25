import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

const serializeBigInt = (value: any): any => {
  if (typeof value === 'bigint') {
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

export async function GET() {
  try {
    const products = await prisma.store_products.findMany({
      include: {
        store_product_images: true,
        store_product_prices: true,
      },
    });

    const serializedProducts = serializeBigInt(products);

    return NextResponse.json(serializedProducts);
  } catch (error) {
    console.error('Error fetching products in API:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}