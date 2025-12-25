import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/db';
import { getCurrentAdminId } from '@/lib/auth/get-current-user';
import { checkPurchasingPermission, PURCHASING_PERMISSIONS } from '@/lib/permissions/purchasing-permissions';

const allowedStatuses = [
  'draft',
  'pending',
  'pending_approval',
  'approved',
  'assigned_to_warehouse',
  'partially_received',
  'received_in_warehouse',
  'ready_for_pricing',
  'received',
  'priced',
  'rejected',
  'cancelled',
];

async function retryPrismaQuery<T>(queryFn: () => Promise<T>, attempt = 1): Promise<T> {
  try {
    return await queryFn();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P1017' && attempt < 3) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
      return retryPrismaQuery(queryFn, attempt + 1);
    }
    throw error;
  }
}

const serializeInvoice = (invoice: any) => {
  const serialized = {
    id: invoice.id,
    invoice_number: invoice.invoice_number,
    supplier_id: invoice.supplier_id,
    supplier_name: invoice.suppliers?.name_ar || invoice.suppliers?.name || null,
    warehouse_id: invoice.warehouse_id,
    warehouse_name: invoice.warehouses?.name || null,
    status: invoice.status,
    invoice_date: invoice.invoice_date?.toISOString?.() || invoice.invoice_date,
    received_date: invoice.received_date?.toISOString?.() || invoice.received_date,
    purchase_order_id: invoice.purchase_order_id,
    assigned_to_pricing_at: invoice.assigned_to_pricing_at?.toISOString?.() || invoice.assigned_to_pricing_at,
    priced_at: invoice.priced_at?.toISOString?.() || invoice.priced_at,
    pricing_approved_by: invoice.pricing_approved_by,
    total_amount: Number(invoice.total_amount || 0),
    notes: invoice.notes,
    created_at: invoice.created_at?.toISOString?.() || invoice.created_at,
    updated_at: invoice.updated_at?.toISOString?.() || invoice.updated_at,
    items: invoice.warehouse_invoice_items?.map((item: any) => ({
      id: item.id,
      product_id: item.product_id,
      catalog_product_id: item.catalog_product_id?.toString() || null,
      sku: item.catalog_products?.sku || item.store_products?.sku || null,
      name: item.catalog_products?.name || item.store_products?.name_ar || item.store_products?.name_en || item.notes || null,
      quantity: Number(item.quantity || 0),
      unit_price: Number(item.unit_price || 0),
      total_price: Number(item.total_price || 0),
      measurement_unit: item.measurement_unit,
      discount_value: item.notes ? Number(item.notes) || 0 : 0,
      notes: item.notes || null,
    })) || [],
  };

  console.log('[serializeInvoice] Serialized invoice:', {
    id: serialized.id,
    warehouse_id: serialized.warehouse_id,
    items_count: serialized.items.length,
  });

  return serialized;
};

export async function GET(
  request: NextRequest,
  { params }: { params: { invoiceId: string } }
) {
  try {
    // تسجيل تفصيلي للطلب
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    console.log('[PurchasingAPI] GET [invoiceId]: Auth header exists:', !!authHeader);
    
    const adminId = await getCurrentAdminId(request);
    console.log('[PurchasingAPI] GET [invoiceId]: Admin ID:', adminId);
    
    if (!adminId) {
      console.warn('[PurchasingAPI] GET [invoiceId]: No admin ID found');
      return NextResponse.json(
        { error: 'يجب تسجيل الدخول أولاً. يرجى التأكد من إرسال Authorization header مع التوكن.' },
        { status: 401 }
      );
    }
    
    // التحقق من صلاحية عرض الفواتير
    console.log('[PurchasingAPI] GET [invoiceId]: Checking permission for admin:', adminId);
    const hasPermission = await checkPurchasingPermission(adminId, 'VIEW_INVOICES');
    console.log('[PurchasingAPI] GET [invoiceId]: Permission check result:', hasPermission);
    
    if (!hasPermission) {
      console.warn(`[PurchasingAPI] Admin ${adminId} does not have VIEW_INVOICES permission`);
      return NextResponse.json(
        { error: 'ليس لديك صلاحية لعرض فواتير المشتريات' },
        { status: 403 }
      );
    }
    
    console.log('[PurchasingAPI] GET [invoiceId]: Permission check passed');

    const { invoiceId } = await params;
    const invoice = await retryPrismaQuery(() =>
      prisma.warehouse_invoices.findUnique({
        where: { id: invoiceId },
        include: {
          suppliers: { select: { name: true, name_ar: true } },
          warehouses: { select: { name: true } },
          warehouse_invoice_items: {
            include: {
              store_products: { select: { name_ar: true, name_en: true, sku: true } },
              catalog_products: { select: { name: true, sku: true } },
            },
          },
        },
      })
    );

    if (!invoice) {
      return NextResponse.json({ error: 'الفاتورة غير موجودة' }, { status: 404 });
    }

    return NextResponse.json({ invoice: serializeInvoice(invoice) });
  } catch (error) {
    console.error('[PurchasingAPI] Error fetching invoice', error);
    return NextResponse.json({ error: 'فشل في تحميل الفاتورة' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { invoiceId: string } }
) {
  try {
    const adminId = await getCurrentAdminId(request);
    
    if (!adminId) {
      return NextResponse.json(
        { error: 'يجب تسجيل الدخول أولاً' },
        { status: 401 }
      );
    }
    
    const { invoiceId } = await params;
    const body = await request.json();
    
    // إذا كان التحديث للحالة فقط
    if (body.status && allowedStatuses.includes(body.status)) {
      // التحقق من الصلاحيات حسب الحالة
      let requiredPermission: keyof typeof PURCHASING_PERMISSIONS = 'EDIT_INVOICE';
      
      if (body.status === 'assigned_to_warehouse') {
        requiredPermission = 'SEND_TO_WAREHOUSE';
      } else if (body.status === 'ready_for_pricing') {
        requiredPermission = 'SEND_TO_PRICING';
      } else if (['approved', 'pending_approval'].includes(body.status)) {
        requiredPermission = 'APPROVE_INVOICE';
      }
      
      const hasPermission = await checkPurchasingPermission(adminId, requiredPermission);
      if (!hasPermission) {
        return NextResponse.json(
          { error: `ليس لديك صلاحية ${requiredPermission}` },
          { status: 403 }
        );
      }
      const existing = await retryPrismaQuery(() =>
        prisma.warehouse_invoices.findUnique({
          where: { id: invoiceId },
          select: { assigned_to_pricing_at: true, priced_at: true, status: true },
        })
      );

      if (!existing) {
        return NextResponse.json({ error: 'الفاتورة غير موجودة' }, { status: 404 });
      }

      // منع تعديل الفواتير المعتمدة أو المرسلة
      if (existing.status !== 'draft' && body.status === 'draft') {
        return NextResponse.json({ error: 'لا يمكن إرجاع الفاتورة إلى مسودة بعد اعتمادها' }, { status: 400 });
      }

      const data: Prisma.warehouse_invoicesUpdateInput = {
        status: body.status,
        updated_at: new Date(),
      };

      if (body.status === 'ready_for_pricing' && !existing.assigned_to_pricing_at) {
        data.assigned_to_pricing_at = new Date();
      }

      if (body.status === 'priced') {
        data.priced_at = existing.priced_at ?? new Date();
      }

      const updated = await retryPrismaQuery(() =>
        prisma.warehouse_invoices.update({
          where: { id: invoiceId },
          data,
          include: {
            suppliers: { select: { name: true, name_ar: true } },
            warehouses: { select: { name: true } },
            warehouse_invoice_items: {
              include: { 
                store_products: { select: { name_ar: true, name_en: true, sku: true } },
                catalog_products: { select: { name: true, sku: true } },
              },
            },
          },
        })
      );

      return NextResponse.json(serializeInvoice(updated));
    }

    // إذا كان التحديث للبيانات الكاملة (تعديل الفاتورة)
    if (body.items || body.supplier_id !== undefined || body.notes !== undefined) {
      // التحقق من صلاحية التعديل
      const hasPermission = await checkPurchasingPermission(adminId, 'EDIT_INVOICE');
      if (!hasPermission) {
        return NextResponse.json(
          { error: 'ليس لديك صلاحية لتعديل فواتير المشتريات' },
          { status: 403 }
        );
      }

      const existing = await retryPrismaQuery(() =>
        prisma.warehouse_invoices.findUnique({
          where: { id: invoiceId },
          select: { status: true },
        })
      );

      if (!existing) {
        return NextResponse.json({ error: 'الفاتورة غير موجودة' }, { status: 404 });
      }

      // السماح بالتعديل فقط في حالة draft
      if (existing.status !== 'draft') {
        return NextResponse.json({ error: 'يمكن تعديل الفاتورة فقط في حالة المسودة' }, { status: 400 });
      }

      const updated = await retryPrismaQuery(async () => {
        return await prisma.$transaction(async (tx) => {
          // تحديث بيانات الفاتورة
          const updateData: Prisma.warehouse_invoicesUpdateInput = {
            updated_at: new Date(),
          };

          if (body.supplier_id !== undefined) {
            updateData.supplier_id = body.supplier_id ? Number(body.supplier_id) : null;
          }
          if (body.notes !== undefined) {
            updateData.notes = body.notes || null;
          }

          // إذا كانت هناك بنود جديدة، حذف القديمة وإنشاء جديدة
          if (body.items && Array.isArray(body.items)) {
            // حذف البنود القديمة
            await tx.warehouse_invoice_items.deleteMany({
              where: { invoice_id: invoiceId },
            });

            // حساب الإجمالي الجديد
            let totalAmount = 0;
            for (const item of body.items) {
              const quantity = Number(item.quantity) || 0;
              const unitPrice = Number(item.unit_price) || 0;
              const discount = Number(item.discount_value) || 0;
              const itemTotalPrice = item.total_price 
                ? Number(item.total_price) 
                : (quantity * unitPrice - discount);
              
              totalAmount += itemTotalPrice;

              // التحقق من وجود product_id أو catalog_product_id
              const productId = item.product_id && item.product_id !== '' ? item.product_id : null;
              const catalogProductId = item.catalog_product_id && item.catalog_product_id !== '' 
                ? BigInt(item.catalog_product_id) 
                : null;

              await tx.warehouse_invoice_items.create({
                data: {
                  invoice_id: invoiceId,
                  product_id: productId,
                  catalog_product_id: catalogProductId,
                  quantity: new Prisma.Decimal(quantity),
                  unit_price: new Prisma.Decimal(unitPrice),
                  total_price: new Prisma.Decimal(itemTotalPrice),
                  measurement_unit: item.measurement_unit || 'piece',
                  notes: item.discount_value ? Number(item.discount_value).toString() : null,
                },
              });
            }

            updateData.total_amount = new Prisma.Decimal(totalAmount);
          }

          const result = await tx.warehouse_invoices.update({
            where: { id: invoiceId },
            data: updateData,
            include: {
              suppliers: { select: { name: true, name_ar: true } },
              warehouses: { select: { name: true } },
              warehouse_invoice_items: {
                include: { 
                  store_products: { select: { name_ar: true, name_en: true, sku: true } },
                  catalog_products: { select: { name: true, sku: true } },
                },
              },
            },
          });

          return result;
        });
      });

      return NextResponse.json(serializeInvoice(updated));
    }

    return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });
  } catch (error) {
    console.error('[PurchasingAPI] Error updating invoice', error);
    return NextResponse.json({ error: 'فشل في تحديث الفاتورة' }, { status: 500 });
  }
}
