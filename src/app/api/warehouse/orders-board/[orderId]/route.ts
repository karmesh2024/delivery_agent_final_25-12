import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

/**
 * PATCH /api/warehouse/orders-board/[orderId]
 * تحديث حالة التجميع للطلب
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const body = await request.json();
    const { fulfillment_status } = body;

    // التحقق من صحة الحالة
    const validStatuses = ['pending', 'collecting', 'verifying', 'packaging', 'ready', 'completed'];
    if (!fulfillment_status || !validStatuses.includes(fulfillment_status)) {
      return NextResponse.json(
        { error: 'حالة التجميع غير صحيحة', validStatuses },
        { status: 400 }
      );
    }

    // تحديد حالة الطلب العامة بناءً على حالة التجميع
    let orderStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | 'completed' = 'pending';
    
    switch (fulfillment_status) {
      case 'pending':
        orderStatus = 'pending';
        break;
      case 'collecting':
      case 'verifying':
      case 'packaging':
        orderStatus = 'processing'; // الطلب قيد المعالجة في المخزن
        break;
      case 'ready':
        orderStatus = 'shipped'; // جاهز للتسليم = تم الشحن
        break;
      case 'completed':
        orderStatus = 'delivered'; // تم التسليم
        break;
    }

    // جلب الطلب الحالي للتحقق من التوقيتات الموجودة
    const currentOrder = await prisma.store_orders.findUnique({
      where: { id: orderId },
      select: {
        pending_at: true,
        collecting_at: true,
        verifying_at: true,
        packaging_at: true,
        ready_at: true,
        completed_at: true,
      },
    });

    // تحديد الحقل الذي يجب تحديثه بناءً على الحالة الجديدة
    const timestampField = {
      pending: 'pending_at',
      collecting: 'collecting_at',
      verifying: 'verifying_at',
      packaging: 'packaging_at',
      ready: 'ready_at',
      completed: 'completed_at',
    }[fulfillment_status];

    // بناء بيانات التحديث مع تسجيل الوقت
    const updateData: any = {
      fulfillment_status: fulfillment_status as any,
      status: orderStatus as any,
      updated_at: new Date(),
    };

    // تسجيل الوقت فقط إذا لم يتم تسجيله من قبل
    if (timestampField && currentOrder && !currentOrder[timestampField as keyof typeof currentOrder]) {
      updateData[timestampField] = new Date();
    }

    // تحديث حالة التجميع وحالة الطلب العامة معاً
    const updatedOrder = await prisma.store_orders.update({
      where: { id: orderId },
      data: updateData,
      include: {
        store_order_items: {
          include: {
            store_products: {
              select: {
                id: true,
                name_ar: true,
                name_en: true,
                sku: true,
              },
            },
          },
        },
        store_shops: {
          select: {
            id: true,
            name_ar: true,
            name_en: true,
          },
        },
      },
    });

    // تم تحديث الحالتين معاً في الاستعلام أعلاه

    // تحويل BigInt و Decimal إلى strings
    const serializedOrder = {
      ...updatedOrder,
      final_amount: updatedOrder.final_amount.toString(),
      created_at: updatedOrder.created_at?.toISOString() || null,
      updated_at: updatedOrder.updated_at?.toISOString() || null,
      // Fulfillment stage timestamps
      pending_at: (updatedOrder as any).pending_at?.toISOString() || null,
      collecting_at: (updatedOrder as any).collecting_at?.toISOString() || null,
      verifying_at: (updatedOrder as any).verifying_at?.toISOString() || null,
      packaging_at: (updatedOrder as any).packaging_at?.toISOString() || null,
      ready_at: (updatedOrder as any).ready_at?.toISOString() || null,
      completed_at: (updatedOrder as any).completed_at?.toISOString() || null,
      items: updatedOrder.store_order_items.map((item) => ({
        ...item,
        unit_price: item.unit_price.toString(),
        created_at: item.created_at?.toISOString() || null,
      })),
    };

    return NextResponse.json(serializedOrder);
  } catch (error) {
    console.error('Error updating order fulfillment status:', error);
    return NextResponse.json(
      { error: 'فشل في تحديث حالة التجميع', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

