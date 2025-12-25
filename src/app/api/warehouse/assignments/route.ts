import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/db';
import { getCurrentAdminId, getCurrentUserId } from '@/lib/auth/get-current-user';
import { checkWarehousePermission, WAREHOUSE_PERMISSIONS } from '@/lib/permissions/purchasing-permissions';
import { checkPurchasingPermission } from '@/lib/permissions/purchasing-permissions';

/**
 * GET /api/warehouse/assignments?warehouse_id=XXX&status=XXX
 * جلب أوامر الإسناد للمخازن
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[WarehouseAssignmentsAPI] GET request received');
    
    const adminId = await getCurrentAdminId(request);
    
    console.log('[WarehouseAssignmentsAPI] GET: Admin ID from request:', adminId);
    
    if (!adminId) {
      console.warn('[WarehouseAssignmentsAPI] GET: No admin ID found in request');
      return NextResponse.json(
        { error: 'يجب تسجيل الدخول أولاً' },
        { status: 401 }
      );
    }
    
    // التحقق من صلاحية عرض أوامر الإسناد
    console.log('[WarehouseAssignmentsAPI] GET: Checking permission for admin:', adminId);
    const hasPermission = await checkWarehousePermission(adminId, 'VIEW_ASSIGNMENTS');
    console.log('[WarehouseAssignmentsAPI] GET: Permission check result:', hasPermission);
    
    if (!hasPermission) {
      console.warn(`[WarehouseAssignmentsAPI] Admin ${adminId} does not have VIEW_ASSIGNMENTS permission`);
      return NextResponse.json(
        { error: 'ليس لديك صلاحية لعرض أوامر الإسناد' },
        { status: 403 }
      );
    }
    
    console.log('[WarehouseAssignmentsAPI] GET: Permission check passed for admin:', adminId);

    const searchParams = request.nextUrl.searchParams;
    const warehouseId = searchParams.get('warehouse_id');
    const status = searchParams.get('status');

    const where: Prisma.warehouse_assignmentsWhereInput = {};

    if (warehouseId) {
      where.warehouse_id = Number(warehouseId);
    }

    if (status && status !== 'all') {
      where.status = status as any;
    }

    const assignments = await prisma.warehouse_assignments.findMany({
      where,
      include: {
        warehouse_invoices: {
          include: {
            suppliers: { select: { name: true, name_ar: true } },
          },
        },
        warehouses: { select: { name: true } },
        warehouse_assignment_items: {
          include: {
            catalog_products: { select: { name: true, sku: true, images: true } },
            store_products: { select: { name_ar: true, name_en: true, sku: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const serialized = assignments.map((assignment) => ({
      id: assignment.id,
      invoice_id: assignment.invoice_id,
      invoice_number: assignment.warehouse_invoices?.invoice_number || null,
      supplier_name: assignment.warehouse_invoices?.suppliers?.name_ar || assignment.warehouse_invoices?.suppliers?.name || null,
      warehouse_id: assignment.warehouse_id,
      warehouse_name: assignment.warehouses?.name || null,
      expected_date: assignment.expected_date?.toISOString() || null,
      status: assignment.status,
      notes: assignment.notes,
      created_at: assignment.created_at?.toISOString() || null,
      updated_at: assignment.updated_at?.toISOString() || null,
      items: assignment.warehouse_assignment_items.map((item) => ({
        id: item.id,
        catalog_product_id: item.catalog_product_id?.toString() || null,
        product_id: item.product_id || null,
        sku: item.catalog_products?.sku || item.store_products?.sku || null,
        name: item.catalog_products?.name || item.store_products?.name_ar || item.store_products?.name_en || null,
        image_url: item.catalog_products?.images 
          ? (Array.isArray(item.catalog_products.images) ? item.catalog_products.images[0] : (typeof item.catalog_products.images === 'string' ? JSON.parse(item.catalog_products.images)[0] : null))
          : null,
        ordered_quantity: Number(item.ordered_quantity),
        received_quantity: item.received_quantity ? Number(item.received_quantity) : null,
        damaged_quantity: item.damaged_quantity ? Number(item.damaged_quantity) : null,
        status: item.status,
        notes: item.notes,
      })),
    }));

    return NextResponse.json({ assignments: serialized });
  } catch (error: any) {
    console.error('[WarehouseAssignmentsAPI] Error fetching assignments:', error);
    return NextResponse.json(
      { error: 'فشل في جلب أوامر الإسناد', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/warehouse/assignments
 * إنشاء أمر إسناد جديد (من إدارة المشتريات)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[WarehouseAssignmentsAPI] POST request received');
    
    const adminId = await getCurrentAdminId(request);
    
    console.log('[WarehouseAssignmentsAPI] POST: Admin ID from request:', adminId);
    
    if (!adminId) {
      console.warn('[WarehouseAssignmentsAPI] POST: No admin ID found in request');
      return NextResponse.json(
        { error: 'يجب تسجيل الدخول أولاً' },
        { status: 401 }
      );
    }
    
    // التحقق من صلاحية إنشاء أوامر الإسناد
    console.log('[WarehouseAssignmentsAPI] POST: Checking permission for admin:', adminId);
    const hasPermission = await checkPurchasingPermission(adminId, 'SEND_TO_WAREHOUSE');
    console.log('[WarehouseAssignmentsAPI] POST: Permission check result:', hasPermission);
    
    if (!hasPermission) {
      console.warn(`[WarehouseAssignmentsAPI] Admin ${adminId} does not have SEND_TO_WAREHOUSE permission`);
      return NextResponse.json(
        { error: 'ليس لديك صلاحية لإنشاء أوامر الإسناد' },
        { status: 403 }
      );
    }
    
    console.log('[WarehouseAssignmentsAPI] POST: Permission check passed for admin:', adminId);
    
    // الحصول على user_id من التوكن (لحقل assigned_by)
    const userId = await getCurrentUserId(request);
    console.log('[WarehouseAssignmentsAPI] POST: User ID from token:', userId);
    
    const body = await request.json();
    const { invoice_id, warehouse_id, expected_date, items, notes } = body;

    console.log('[WarehouseAssignmentsAPI] POST: Request body:', {
      invoice_id,
      warehouse_id,
      items_count: items?.length || 0,
      items: items,
    });

    // التحقق من البيانات المطلوبة مع رسائل خطأ أكثر تفصيلاً
    if (!invoice_id) {
      console.warn('[WarehouseAssignmentsAPI] POST: Missing invoice_id');
      return NextResponse.json(
        { error: 'بيانات ناقصة: معرف الفاتورة مطلوب' },
        { status: 400 }
      );
    }

    if (!warehouse_id) {
      console.warn('[WarehouseAssignmentsAPI] POST: Missing warehouse_id');
      return NextResponse.json(
        { error: 'بيانات ناقصة: معرف المخزن مطلوب' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items)) {
      console.warn('[WarehouseAssignmentsAPI] POST: Missing or invalid items array');
      return NextResponse.json(
        { error: 'بيانات ناقصة: قائمة البنود مطلوبة' },
        { status: 400 }
      );
    }

    if (items.length === 0) {
      console.warn('[WarehouseAssignmentsAPI] POST: Empty items array');
      return NextResponse.json(
        { error: 'بيانات ناقصة: يجب أن تحتوي الفاتورة على بنود على الأقل' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // إنشاء أمر الإسناد
      const assignment = await tx.warehouse_assignments.create({
        data: {
          invoice_id,
          warehouse_id: Number(warehouse_id),
          expected_date: expected_date ? new Date(expected_date) : null,
          status: 'pending',
          notes: notes || null,
          assigned_by: userId || null, // user_id من auth.users
        },
      });

      // إنشاء بنود الإسناد
      for (const item of items) {
        await tx.warehouse_assignment_items.create({
          data: {
            assignment_id: assignment.id,
            catalog_product_id: item.catalog_product_id ? BigInt(item.catalog_product_id) : null,
            product_id: item.product_id || null,
            ordered_quantity: new Prisma.Decimal(item.ordered_quantity || 0),
            status: 'pending',
            notes: item.notes || null,
          },
        });
      }

      // تحديث حالة الفاتورة
      await tx.warehouse_invoices.update({
        where: { id: invoice_id },
        data: { status: 'assigned_to_warehouse' },
      });

      return assignment;
    });

    return NextResponse.json({ id: result.id, message: 'تم إنشاء أمر الإسناد بنجاح' });
  } catch (error: any) {
    console.error('[WarehouseAssignmentsAPI] Error creating assignment:', error);
    return NextResponse.json(
      { error: 'فشل في إنشاء أمر الإسناد', details: error.message },
      { status: 500 }
    );
  }
}

