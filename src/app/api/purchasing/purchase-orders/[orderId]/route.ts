import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/db';
import { getCurrentAdminId, getCurrentUserId } from '@/lib/auth/get-current-user';
import { checkPurchasingPermission } from '@/lib/permissions/purchasing-permissions';

/**
 * GET /api/purchasing/purchase-orders/[orderId]
 * جلب تفاصيل أمر شراء
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
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
        { error: 'ليس لديك صلاحية لعرض أمر الشراء' },
        { status: 403 }
      );
    }

    const { orderId } = await params;

    const order = await prisma.purchase_orders.findUnique({
      where: { id: orderId },
      include: {
        suppliers: { select: { name: true, name_ar: true, supplier_code: true } },
        warehouses: { select: { name: true } },
        created_by_user: { select: { email: true } },
        approved_by_user: { select: { email: true } },
        purchase_order_items: {
          orderBy: { created_at: 'asc' },
        },
        warehouse_invoices: {
          select: {
            id: true,
            invoice_number: true,
            total_amount: true,
            status: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'أمر الشراء غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      order: {
        id: order.id,
        supplier_id: order.supplier_id,
        supplier_name: order.suppliers?.name_ar || order.suppliers?.name || null,
        supplier_code: order.suppliers?.supplier_code || null,
        warehouse_id: order.warehouse_id,
        warehouse_name: order.warehouses?.name || null,
        expected_delivery_date: order.expected_delivery_date?.toISOString() || null,
        total_amount: Number(order.total_amount || 0),
        status: order.status,
        notes: order.notes,
        created_by: order.created_by,
        created_by_email: order.created_by_user?.email || null,
        approved_by: order.approved_by,
        approved_by_email: order.approved_by_user?.email || null,
        created_at: order.created_at?.toISOString() || null,
        updated_at: order.updated_at?.toISOString() || null,
        items: order.purchase_order_items.map((item) => ({
          id: item.id,
          catalog_product_id: item.catalog_product_id?.toString() || null,
          catalog_waste_id: item.catalog_waste_id?.toString() || null,
          product_id: item.product_id || null,
          sku: item.sku || null,
          name: item.name,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price || 0),
          total_price: Number(item.total_price || 0),
          measurement_unit: item.measurement_unit || null,
          notes: item.notes || null,
        })),
        invoices: order.warehouse_invoices.map((inv) => ({
          id: inv.id,
          invoice_number: inv.invoice_number,
          total_amount: Number(inv.total_amount),
          status: inv.status,
        })),
      },
    });
  } catch (error: any) {
    console.error('[PurchaseOrderAPI] Error fetching order:', error);
    return NextResponse.json(
      { error: 'فشل في جلب أمر الشراء', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/purchasing/purchase-orders/[orderId]
 * تحديث أمر شراء
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const adminId = await getCurrentAdminId(request);
    const userId = await getCurrentUserId(request);
    
    if (!adminId) {
      return NextResponse.json(
        { error: 'يجب تسجيل الدخول أولاً' },
        { status: 401 }
      );
    }
    
    const hasPermission = await checkPurchasingPermission(adminId, 'EDIT_INVOICE');
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'ليس لديك صلاحية لتعديل أمر الشراء' },
        { status: 403 }
      );
    }

    const { orderId } = await params;
    const body = await request.json();
    
    const {
      supplier_id,
      warehouse_id,
      expected_delivery_date,
      total_amount,
      status,
      notes,
      items,
    } = body;

    // التحقق من وجود الأمر
    const existingOrder = await prisma.purchase_orders.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'أمر الشراء غير موجود' },
        { status: 404 }
      );
    }

    // التحقق من إمكانية التعديل (لا يمكن تعديل أمر معتمد أو ملغى)
    if (existingOrder.status === 'approved' || existingOrder.status === 'cancelled') {
      return NextResponse.json(
        { error: 'لا يمكن تعديل أمر شراء معتمد أو ملغى' },
        { status: 400 }
      );
    }

    // حساب المبلغ الإجمالي من البنود إذا كانت موجودة
    let calculatedTotal = total_amount !== undefined ? new Prisma.Decimal(total_amount || 0) : undefined;
    if (items && Array.isArray(items) && items.length > 0) {
      calculatedTotal = items.reduce((sum, item) => {
        const itemTotal = (item.quantity || 0) * (item.unit_price || 0);
        return sum + itemTotal;
      }, 0);
    }

    // تحديث البيانات
    const updateData: any = {
      updated_at: new Date(),
    };

    if (supplier_id !== undefined) {
      updateData.supplier_id = parseInt(supplier_id);
    }
    if (warehouse_id !== undefined) {
      updateData.warehouse_id = parseInt(warehouse_id);
    }
    if (expected_delivery_date !== undefined) {
      updateData.expected_delivery_date = expected_delivery_date ? new Date(expected_delivery_date) : null;
    }
    if (calculatedTotal !== undefined) {
      updateData.total_amount = calculatedTotal;
    } else if (total_amount !== undefined) {
      updateData.total_amount = new Prisma.Decimal(total_amount || 0);
    }
    if (status !== undefined) {
      updateData.status = status;
      // إذا تم الموافقة، سجل المستخدم الذي وافق
      if (status === 'approved' && !existingOrder.approved_by) {
        updateData.approved_by = userId;
      }
    }
    if (notes !== undefined) {
      updateData.notes = notes || null;
    }

    // تحديث البنود إذا كانت موجودة
    if (items && Array.isArray(items)) {
      // حذف البنود القديمة
      await prisma.purchase_order_items.deleteMany({
        where: { purchase_order_id: orderId },
      });

      // إضافة البنود الجديدة
      if (items.length > 0) {
        updateData.purchase_order_items = {
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
        };
      }
    }

    const updated = await prisma.purchase_orders.update({
      where: { id: orderId },
      data: updateData,
      include: {
        suppliers: { select: { name: true, name_ar: true } },
        warehouses: { select: { name: true } },
        purchase_order_items: {
          orderBy: { created_at: 'asc' },
        },
      },
    });

    return NextResponse.json({
      order: {
        id: updated.id,
        supplier_id: updated.supplier_id,
        supplier_name: updated.suppliers?.name_ar || updated.suppliers?.name || null,
        warehouse_id: updated.warehouse_id,
        warehouse_name: updated.warehouses?.name || null,
        expected_delivery_date: updated.expected_delivery_date?.toISOString() || null,
        total_amount: Number(updated.total_amount || 0),
        status: updated.status,
        notes: updated.notes,
        updated_at: updated.updated_at?.toISOString() || null,
        items: updated.purchase_order_items.map((item) => ({
          id: item.id,
          catalog_product_id: item.catalog_product_id?.toString() || null,
          catalog_waste_id: item.catalog_waste_id?.toString() || null,
          product_id: item.product_id || null,
          sku: item.sku || null,
          name: item.name,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price || 0),
          total_price: Number(item.total_price || 0),
          measurement_unit: item.measurement_unit || null,
          notes: item.notes || null,
        })),
      },
      message: 'تم تحديث أمر الشراء بنجاح',
    });
  } catch (error: any) {
    console.error('[PurchaseOrderAPI] Error updating order:', error);
    return NextResponse.json(
      { error: 'فشل في تحديث أمر الشراء', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/purchasing/purchase-orders/[orderId]
 * حذف أمر شراء
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const adminId = await getCurrentAdminId(request);
    
    if (!adminId) {
      return NextResponse.json(
        { error: 'يجب تسجيل الدخول أولاً' },
        { status: 401 }
      );
    }
    
    const hasPermission = await checkPurchasingPermission(adminId, 'EDIT_INVOICE');
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'ليس لديك صلاحية لحذف أمر الشراء' },
        { status: 403 }
      );
    }

    const { orderId } = await params;

    // التحقق من وجود الأمر
    const existingOrder = await prisma.purchase_orders.findUnique({
      where: { id: orderId },
      include: {
        warehouse_invoices: {
          select: { id: true },
        },
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'أمر الشراء غير موجود' },
        { status: 404 }
      );
    }

    // التحقق من إمكانية الحذف (فقط المسودات يمكن حذفها)
    if (existingOrder.status !== 'draft') {
      return NextResponse.json(
        { error: 'لا يمكن حذف أمر شراء غير مسودة' },
        { status: 400 }
      );
    }

    // التحقق من عدم وجود فواتير مرتبطة
    if (existingOrder.warehouse_invoices.length > 0) {
      return NextResponse.json(
        { error: 'لا يمكن حذف أمر شراء مرتبط بفاتورة' },
        { status: 400 }
      );
    }

    await prisma.purchase_orders.delete({
      where: { id: orderId },
    });

    return NextResponse.json({
      message: 'تم حذف أمر الشراء بنجاح',
    });
  } catch (error: any) {
    console.error('[PurchaseOrderAPI] Error deleting order:', error);
    return NextResponse.json(
      { error: 'فشل في حذف أمر الشراء', details: error.message },
      { status: 500 }
    );
  }
}

