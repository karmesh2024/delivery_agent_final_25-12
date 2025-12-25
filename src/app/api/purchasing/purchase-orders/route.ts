import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/db';
import { getCurrentAdminId, getCurrentUserId } from '@/lib/auth/get-current-user';
import { checkPurchasingPermission } from '@/lib/permissions/purchasing-permissions';

/**
 * GET /api/purchasing/purchase-orders
 * جلب قائمة أوامر الشراء
 */
export async function GET(request: NextRequest) {
  try {
    const adminId = await getCurrentAdminId(request);
    
    if (!adminId) {
      return NextResponse.json(
        { error: 'يجب تسجيل الدخول أولاً' },
        { status: 401 }
      );
    }
    
    const hasPermission = await checkPurchasingPermission(adminId, 'VIEW_INVOICES');
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'ليس لديك صلاحية لعرض أوامر الشراء' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const supplierId = searchParams.get('supplierId');
    const warehouseId = searchParams.get('warehouseId');

    const where: Prisma.purchase_ordersWhereInput = {};
    
    if (status && status !== 'all') {
      where.status = status as any;
    }
    
    if (supplierId) {
      where.supplier_id = parseInt(supplierId);
    }
    
    if (warehouseId) {
      where.warehouse_id = parseInt(warehouseId);
    }

    const orders = await prisma.purchase_orders.findMany({
      where,
      include: {
        suppliers: { select: { name: true, name_ar: true } },
        warehouses: { select: { name: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    const serialized = orders.map((order) => ({
      id: order.id,
      supplier_id: order.supplier_id,
      supplier_name: order.suppliers?.name_ar || order.suppliers?.name || null,
      warehouse_id: order.warehouse_id,
      warehouse_name: order.warehouses?.name || null,
      expected_delivery_date: order.expected_delivery_date?.toISOString() || null,
      total_amount: Number(order.total_amount || 0),
      status: order.status,
      notes: order.notes,
      created_at: order.created_at?.toISOString() || null,
      updated_at: order.updated_at?.toISOString() || null,
    }));

    return NextResponse.json({ orders: serialized });
  } catch (error: any) {
    console.error('[PurchaseOrdersAPI] Error fetching orders:', error);
    return NextResponse.json(
      { error: 'فشل في جلب أوامر الشراء', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/purchasing/purchase-orders
 * إنشاء أمر شراء جديد
 */
export async function POST(request: NextRequest) {
  try {
    const adminId = await getCurrentAdminId(request);
    const userId = await getCurrentUserId(request);
    
    if (!adminId) {
      return NextResponse.json(
        { error: 'يجب تسجيل الدخول أولاً' },
        { status: 401 }
      );
    }
    
    const hasPermission = await checkPurchasingPermission(adminId, 'CREATE_INVOICE');
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'ليس لديك صلاحية لإنشاء أوامر الشراء' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      supplier_id,
      warehouse_id,
      expected_delivery_date,
      total_amount,
      notes,
      items,
    } = body;

    if (!supplier_id || !warehouse_id) {
      return NextResponse.json(
        { error: 'يجب تحديد المورد والمخزن' },
        { status: 400 }
      );
    }

    // حساب المبلغ الإجمالي من البنود إذا كانت موجودة
    let calculatedTotal = total_amount ? new Prisma.Decimal(total_amount) : new Prisma.Decimal(0);
    if (items && Array.isArray(items) && items.length > 0) {
      calculatedTotal = items.reduce((sum, item) => {
        const itemTotal = (item.quantity || 0) * (item.unit_price || 0);
        return sum + itemTotal;
      }, 0);
    }

    const order = await prisma.purchase_orders.create({
      data: {
        supplier_id: parseInt(supplier_id),
        warehouse_id: parseInt(warehouse_id),
        expected_delivery_date: expected_delivery_date ? new Date(expected_delivery_date) : null,
        total_amount: calculatedTotal,
        status: 'draft',
        notes: notes || null,
        created_by: userId || null,
        purchase_order_items: items && Array.isArray(items) && items.length > 0 ? {
          create: items.map((item: any) => ({
            catalog_product_id: item.catalog_product_id ? BigInt(item.catalog_product_id) : null,
            catalog_waste_id: item.catalog_waste_id ? BigInt(item.catalog_waste_id) : null,
            product_id: item.product_id || null,
            sku: item.sku || null,
            name: item.name,
            quantity: new Prisma.Decimal(item.quantity || 1),
            unit_price: new Prisma.Decimal(item.unit_price || 0),
            total_price: new Prisma.Decimal((item.quantity || 1) * (item.unit_price || 0)),
            measurement_unit: item.measurement_unit || null,
            notes: item.notes || null,
          })),
        } : undefined,
      },
      include: {
        purchase_order_items: true,
      },
    });

    return NextResponse.json({
      id: order.id,
      message: 'تم إنشاء أمر الشراء بنجاح',
    });
  } catch (error: any) {
    console.error('[PurchaseOrdersAPI] Error creating order:', error);
    return NextResponse.json(
      { error: 'فشل في إنشاء أمر الشراء', details: error.message },
      { status: 500 }
    );
  }
}

