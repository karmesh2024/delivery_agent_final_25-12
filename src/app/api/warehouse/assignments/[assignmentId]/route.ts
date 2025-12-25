import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/db';
import { getCurrentAdminId } from '@/lib/auth/get-current-user';
import { checkWarehousePermission, WAREHOUSE_PERMISSIONS } from '@/lib/permissions/purchasing-permissions';
import inventoryService from '@/domains/warehouse-management/services/inventoryService';

/**
 * GET /api/warehouse/assignments/[assignmentId]
 * جلب تفاصيل أمر إسناد
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    console.log('[WarehouseAssignmentsAPI] GET [assignmentId] request received');
    
    const adminId = await getCurrentAdminId(request);
    
    console.log('[WarehouseAssignmentsAPI] GET [assignmentId]: Admin ID from request:', adminId);
    
    if (!adminId) {
      console.warn('[WarehouseAssignmentsAPI] GET [assignmentId]: No admin ID found in request');
      return NextResponse.json(
        { error: 'يجب تسجيل الدخول أولاً' },
        { status: 401 }
      );
    }
    
    // التحقق من صلاحية عرض أوامر الإسناد
    console.log('[WarehouseAssignmentsAPI] GET [assignmentId]: Checking permission for admin:', adminId);
    const hasPermission = await checkWarehousePermission(adminId, 'VIEW_ASSIGNMENTS');
    console.log('[WarehouseAssignmentsAPI] GET [assignmentId]: Permission check result:', hasPermission);
    
    if (!hasPermission) {
      console.warn(`[WarehouseAssignmentsAPI] Admin ${adminId} does not have VIEW_ASSIGNMENTS permission`);
      return NextResponse.json(
        { error: 'ليس لديك صلاحية لعرض أوامر الإسناد' },
        { status: 403 }
      );
    }
    
    console.log('[WarehouseAssignmentsAPI] GET [assignmentId]: Permission check passed for admin:', adminId);

    const { assignmentId } = await params;
    const assignment = await prisma.warehouse_assignments.findUnique({
      where: { id: assignmentId },
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
    });

    if (!assignment) {
      return NextResponse.json({ error: 'أمر الإسناد غير موجود' }, { status: 404 });
    }

    const serialized = {
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
    };

    return NextResponse.json({ assignment: serialized });
  } catch (error: any) {
    console.error('[WarehouseAssignmentsAPI] Error fetching assignment:', error);
    return NextResponse.json(
      { error: 'فشل في جلب أمر الإسناد', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/warehouse/assignments/[assignmentId]
 * تحديث أمر الإسناد (تسجيل الكميات المستلمة)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    console.log('[WarehouseAssignmentsAPI] PATCH [assignmentId] request received');
    
    const adminId = await getCurrentAdminId(request);
    
    console.log('[WarehouseAssignmentsAPI] PATCH [assignmentId]: Admin ID from request:', adminId);
    
    if (!adminId) {
      console.warn('[WarehouseAssignmentsAPI] PATCH [assignmentId]: No admin ID found in request');
      return NextResponse.json(
        { error: 'يجب تسجيل الدخول أولاً' },
        { status: 401 }
      );
    }
    
    // التحقق من صلاحية تحديث أوامر الإسناد
    console.log('[WarehouseAssignmentsAPI] PATCH [assignmentId]: Checking permission for admin:', adminId);
    const hasPermission = await checkWarehousePermission(adminId, 'UPDATE_ASSIGNMENT');
    console.log('[WarehouseAssignmentsAPI] PATCH [assignmentId]: Permission check result:', hasPermission);
    
    if (!hasPermission) {
      console.warn(`[WarehouseAssignmentsAPI] Admin ${adminId} does not have UPDATE_ASSIGNMENT permission`);
      return NextResponse.json(
        { error: 'ليس لديك صلاحية لتحديث أوامر الإسناد' },
        { status: 403 }
      );
    }
    
    console.log('[WarehouseAssignmentsAPI] PATCH [assignmentId]: Permission check passed for admin:', adminId);

    const { assignmentId } = await params;
    const body = await request.json();

    const result = await prisma.$transaction(async (tx) => {
      // تحديث بنود الإسناد
      if (body.items && Array.isArray(body.items)) {
        for (const item of body.items) {
          const updateData: Prisma.warehouse_assignment_itemsUpdateInput = {
            updated_at: new Date(),
          };

          if (item.received_quantity !== undefined) {
            updateData.received_quantity = new Prisma.Decimal(item.received_quantity);
          }
          if (item.damaged_quantity !== undefined) {
            updateData.damaged_quantity = new Prisma.Decimal(item.damaged_quantity);
          }
          if (item.status) {
            updateData.status = item.status as any;
          }
          if (item.notes !== undefined) {
            updateData.notes = item.notes || null;
          }

          await tx.warehouse_assignment_items.update({
            where: { id: item.id },
            data: updateData,
          });
        }
      }

      // تحديث حالة أمر الإسناد
      const assignment = await tx.warehouse_assignments.findUnique({
        where: { id: assignmentId },
        include: {
          warehouse_assignment_items: true,
        },
      });

      if (!assignment) {
        throw new Error('أمر الإسناد غير موجود');
      }

      // تحديد الحالة بناءً على البنود
      const allItems = assignment.warehouse_assignment_items;
      const allReceived = allItems.every((item) => item.status === 'received');
      const someReceived = allItems.some((item) => item.status === 'received');
      const hasShortage = allItems.some((item) => item.status === 'shortage');
      const hasDamaged = allItems.some((item) => item.status === 'damaged');

      let newStatus: 'pending' | 'partial' | 'completed' | 'cancelled' = 'pending';
      if (allReceived) {
        newStatus = 'completed';
      } else if (someReceived || hasShortage || hasDamaged) {
        newStatus = 'partial';
      }

      const updateData: Prisma.warehouse_assignmentsUpdateInput = {
        status: newStatus,
        updated_at: new Date(),
      };

      if (body.status === 'completed' && !assignment.received_at) {
        updateData.received_at = new Date();
        updateData.received_by = adminId || null;
      }

      if (body.notes !== undefined) {
        updateData.notes = body.notes || null;
      }

      const updated = await tx.warehouse_assignments.update({
        where: { id: assignmentId },
        data: updateData,
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
      });

      // تحديث حالة الفاتورة إذا تم استلام كل شيء
      if (newStatus === 'completed') {
        await tx.warehouse_invoices.update({
          where: { id: assignment.invoice_id! },
          data: { status: 'received_in_warehouse' },
        });
      } else if (newStatus === 'partial') {
        await tx.warehouse_invoices.update({
          where: { id: assignment.invoice_id! },
          data: { status: 'partially_received' },
        });
      }

      return { updated, assignment };
    });

    // تحديث المخزون بعد نجاح المعاملة
    // نحتاج إلى جلب البيانات الكاملة للبنود مع warehouse_invoice_items للحصول على measurement_unit
    const assignmentWithInvoiceItems = await prisma.warehouse_assignments.findUnique({
      where: { id: assignmentId },
      include: {
        warehouse_invoices: {
          include: {
            warehouse_invoice_items: {
              select: {
                id: true,
                product_id: true,
                catalog_product_id: true,
                measurement_unit: true,
              },
            },
          },
        },
        warehouse_assignment_items: {
          include: {
            catalog_products: { select: { id: true } },
            store_products: { select: { id: true } },
          },
        },
      },
    });

    if (assignmentWithInvoiceItems && body.items && Array.isArray(body.items)) {
      const inventoryUpdates: Promise<boolean>[] = [];

      for (const updatedItem of body.items) {
        // البحث عن البند في warehouse_assignment_items
        const assignmentItem = assignmentWithInvoiceItems.warehouse_assignment_items.find(
          (item) => item.id === updatedItem.id
        );

        if (!assignmentItem) continue;

        // الحصول على received_quantity (الكمية المستلمة فقط، وليس التالفة)
        // نستخدم القيمة من body.items أولاً (القيمة الجديدة)، ثم من قاعدة البيانات
        const receivedQuantity = updatedItem.received_quantity !== undefined && updatedItem.received_quantity !== null
          ? Number(updatedItem.received_quantity) 
          : (assignmentItem.received_quantity ? Number(assignmentItem.received_quantity) : 0);

        // إذا لم يتم استلام أي كمية، تخطي هذا البند
        if (receivedQuantity <= 0) {
          console.log(`[WarehouseAssignmentsAPI] Skipping inventory update for item ${updatedItem.id}: received_quantity is ${receivedQuantity}`);
          continue;
        }

        console.log(`[WarehouseAssignmentsAPI] Updating inventory for item ${updatedItem.id}: quantity=${receivedQuantity}`);

        // البحث عن measurement_unit من warehouse_invoice_items
        let measurementUnit: string | null = null;
        if (assignmentItem.catalog_product_id) {
          const invoiceItem = assignmentWithInvoiceItems.warehouse_invoices?.warehouse_invoice_items?.find(
            (item) => item.catalog_product_id?.toString() === assignmentItem.catalog_product_id?.toString()
          );
          measurementUnit = invoiceItem?.measurement_unit || null;
        } else if (assignmentItem.product_id) {
          const invoiceItem = assignmentWithInvoiceItems.warehouse_invoices?.warehouse_invoice_items?.find(
            (item) => item.product_id === assignmentItem.product_id
          );
          measurementUnit = invoiceItem?.measurement_unit || null;
        }

        // تحديث المخزون
        const updatePromise = inventoryService.recordInMovement({
          warehouse_id: assignmentWithInvoiceItems.warehouse_id,
          product_id: assignmentItem.product_id || null,
          catalog_product_id: assignmentItem.catalog_product_id?.toString() || null,
          quantity: receivedQuantity,
          unit: measurementUnit || null,
          price: null, // السعر يتم تحديده في إدارة التسعير
          source_type: 'warehouse_assignment',
          source_id: assignmentId,
        }).catch((error) => {
          console.error(`[WarehouseAssignmentsAPI] Error updating inventory for item ${updatedItem.id}:`, error);
          // لا نرمي الخطأ هنا حتى لا نلغي المعاملة، لكن نسجله
          return false;
        });

        inventoryUpdates.push(updatePromise);
      }

      // انتظار تحديث جميع المخزونات
      await Promise.allSettled(inventoryUpdates);
      console.log(`[WarehouseAssignmentsAPI] Inventory updates completed for ${inventoryUpdates.length} items`);
    }

    const { updated } = result;

    const serialized = {
      id: updated.id,
      invoice_id: updated.invoice_id,
      invoice_number: updated.warehouse_invoices?.invoice_number || null,
      supplier_name: updated.warehouse_invoices?.suppliers?.name_ar || updated.warehouse_invoices?.suppliers?.name || null,
      warehouse_id: updated.warehouse_id,
      warehouse_name: updated.warehouses?.name || null,
      expected_date: updated.expected_date?.toISOString() || null,
      status: updated.status,
      notes: updated.notes,
      created_at: updated.created_at?.toISOString() || null,
      updated_at: updated.updated_at?.toISOString() || null,
      items: updated.warehouse_assignment_items.map((item) => ({
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
    };

    return NextResponse.json({ assignment: serialized });
  } catch (error: any) {
    console.error('[WarehouseAssignmentsAPI] Error updating assignment:', error);
    return NextResponse.json(
      { error: 'فشل في تحديث أمر الإسناد', details: error.message },
      { status: 500 }
    );
  }
}

