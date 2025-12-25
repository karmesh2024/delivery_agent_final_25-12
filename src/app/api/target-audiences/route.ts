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

const fetchTargetAudiences = async (shopId: string, attempt = 1): Promise<any[]> => {
  try {
    return await prisma.store_target_audiences.findMany({
      where: { shop_id: shopId },
      include: {
        store_target_audience_geographic_zones: {
          include: {
            geographic_zones: true,
          },
        },
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P1017' &&
      attempt < 3
    ) {
      console.warn(`[TargetAudiencesAPI] P1017 on attempt ${attempt}, retrying...`);
      await prisma.$disconnect();
      return fetchTargetAudiences(shopId, attempt + 1);
    }
    throw error;
  }
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shop_id');

    if (!shopId) {
      return NextResponse.json({ message: 'Shop ID is required' }, { status: 400 });
    }

    const targetAudiences = await fetchTargetAudiences(shopId);
    return NextResponse.json(serializeBigInt(targetAudiences));
  } catch (error) {
    console.error('Error fetching target audiences:', error);
    return NextResponse.json({ message: 'Failed to fetch target audiences' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { shop_id, name_ar, name_en, description_ar, description_en, discount_percentage, markup_percentage, min_order_amount, max_discount_amount, is_active, priority, audience_type, payment_terms_days, geographic_zone_ids } = body;

    if (!shop_id || !name_ar) {
      return NextResponse.json({ message: 'Shop ID and Arabic name are required' }, { status: 400 });
    }

    const newTargetAudience = await prisma.store_target_audiences.create({
      data: {
        shop_id,
        name_ar,
        ...(name_en !== undefined && { name_en }),
        ...(description_ar !== undefined && { description_ar }),
        ...(description_en !== undefined && { description_en }),
        ...(discount_percentage !== undefined && discount_percentage !== null ? { discount_percentage: new Prisma.Decimal(discount_percentage) } : {}),
        ...(markup_percentage !== undefined && markup_percentage !== null ? { markup_percentage: new Prisma.Decimal(markup_percentage) } : {}),
        ...(min_order_amount !== undefined && min_order_amount !== null ? { min_order_amount: new Prisma.Decimal(min_order_amount) } : {}),
        ...(max_discount_amount !== undefined ? { max_discount_amount: max_discount_amount !== null ? new Prisma.Decimal(max_discount_amount) : null } : {}),
        ...(is_active !== undefined ? { is_active } : {}),
        ...(priority !== undefined ? { priority } : {}),
        ...(audience_type !== undefined ? { audience_type } : {}),
        ...(payment_terms_days !== undefined ? { payment_terms_days } : {}),
        ...(geographic_zone_ids && geographic_zone_ids.length > 0 && {
          store_target_audience_geographic_zones: {
            createMany: {
              data: geographic_zone_ids.map((zoneId: string) => ({
                geographic_zone_id: zoneId,
              })),
            },
          },
        }),
      },
      include: {
        store_target_audience_geographic_zones: {
          include: {
            geographic_zones: true,
          },
        },
      },
    });
    return NextResponse.json(serializeBigInt(newTargetAudience), { status: 201 });
  } catch (error) {
    console.error('Error creating target audience:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ message: 'Target audience with this name already exists for this shop.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Failed to create target audience' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, shop_id, name_ar, name_en, description_ar, description_en, discount_percentage, markup_percentage, min_order_amount, max_discount_amount, is_active, priority, audience_type, payment_terms_days, geographic_zone_ids } = body;

    if (!id || !shop_id || !name_ar) {
      return NextResponse.json({ message: 'ID, Shop ID and Arabic name are required for update' }, { status: 400 });
    }

    // Handle geographic zones update
    if (geographic_zone_ids !== undefined) {
      const existingGeographicZones = await prisma.store_target_audience_geographic_zones.findMany({
        where: { store_target_audience_id: id },
        select: { geographic_zone_id: true },
      });

      const existingZoneIds = new Set(existingGeographicZones.map(z => z.geographic_zone_id));
      const newZoneIds = new Set(geographic_zone_ids);

      const zonesToAdd = geographic_zone_ids.filter((zoneId: string) => !existingZoneIds.has(zoneId));
      const zonesToRemove = existingGeographicZones.filter(z => !newZoneIds.has(z.geographic_zone_id)).map(z => z.geographic_zone_id);

      if (zonesToRemove.length > 0) {
        await prisma.store_target_audience_geographic_zones.deleteMany({
          where: {
            store_target_audience_id: id,
            geographic_zone_id: { in: zonesToRemove },
          },
        });
      }

      if (zonesToAdd.length > 0) {
        await prisma.store_target_audience_geographic_zones.createMany({
          data: zonesToAdd.map((zoneId: string) => ({
            store_target_audience_id: id,
            geographic_zone_id: zoneId,
          })),
        });
      }
    }

    const updatedTargetAudience = await prisma.store_target_audiences.update({
      where: { id },
      data: {
        ...(shop_id !== undefined ? { shop_id } : {}),
        ...(name_ar !== undefined ? { name_ar } : {}),
        ...(name_en !== undefined && { name_en }),
        ...(description_ar !== undefined && { description_ar }),
        ...(description_en !== undefined && { description_en }),
        ...(discount_percentage !== undefined && discount_percentage !== null ? { discount_percentage: new Prisma.Decimal(discount_percentage) } : {}),
        ...(markup_percentage !== undefined && markup_percentage !== null ? { markup_percentage: new Prisma.Decimal(markup_percentage) } : {}),
        ...(min_order_amount !== undefined && min_order_amount !== null ? { min_order_amount: new Prisma.Decimal(min_order_amount) } : {}),
        ...(max_discount_amount !== undefined ? { max_discount_amount: max_discount_amount !== null ? new Prisma.Decimal(max_discount_amount) : null } : {}),
        ...(is_active !== undefined ? { is_active } : {}),
        ...(priority !== undefined ? { priority } : {}),
        ...(audience_type !== undefined ? { audience_type } : {}),
        ...(payment_terms_days !== undefined ? { payment_terms_days } : {}),
      },
      include: { // Include linked geographic zones in the response
        store_target_audience_geographic_zones: {
          include: {
            geographic_zones: true,
          },
        },
      },
    });
    return NextResponse.json(serializeBigInt(updatedTargetAudience));
  } catch (error) {
    console.error('Error updating target audience:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ message: 'Target audience with this name already exists for this shop.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Failed to update target audience' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'Target Audience ID is required' }, { status: 400 });
    }

    await prisma.store_target_audiences.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Target audience deleted successfully' }, { status: 204 });
  } catch (error) {
    console.error('Error deleting target audience:', error);
    return NextResponse.json({ message: 'Failed to delete target audience' }, { status: 500 });
  }
} 