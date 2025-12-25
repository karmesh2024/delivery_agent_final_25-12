import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET() {
  try {
    const productTypes = await prisma.product_types.findMany();
    return NextResponse.json(productTypes);
  } catch (error) {
    console.error('Error fetching product types:', error);
    return NextResponse.json({ message: 'Failed to fetch product types', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name_ar, name_en, schema_template } = body;

    if (!name_ar || !schema_template) {
      return NextResponse.json({ message: 'Name (Arabic) and Schema Template are required' }, { status: 400 });
    }

    const newProductType = await prisma.product_types.create({
      data: {
        name_ar,
        name_en: name_en || null,
        schema_template: schema_template as Prisma.JsonObject,
      },
    });

    return NextResponse.json(newProductType, { status: 201 });
  } catch (error) {
    console.error('Error adding product type:', error);
    return NextResponse.json({ message: 'Failed to add product type', error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'Product type ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { name_ar, name_en, schema_template } = body;

    const updatedProductType = await prisma.product_types.update({
      where: { id },
      data: {
        name_ar: name_ar || undefined,
        name_en: name_en || undefined,
        schema_template: schema_template ? (schema_template as Prisma.JsonObject) : undefined,
      },
    });

    return NextResponse.json(updatedProductType, { status: 200 });
  } catch (error) {
    console.error('Error updating product type:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ message: 'Product type not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Failed to update product type', error: (error as Error).message }, { status: 500 });
  }
}
 