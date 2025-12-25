import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/db';
import { getCurrentAdminId, getCurrentUserId } from '@/lib/auth/get-current-user';
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

const serializeInvoice = (invoice: any) => ({
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
    sku: item.store_products?.sku || null,
    name: item.store_products?.name_ar || item.store_products?.name_en || null,
    quantity: Number(item.quantity),
    unit_price: Number(item.unit_price),
    total_price: Number(item.total_price),
    measurement_unit: item.measurement_unit,
    discount_value: item.notes ? Number(item.notes) || 0 : 0,
  })) || [],
});

export async function GET(request: NextRequest) {
  try {
    // تسجيل تفصيلي للطلب
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    const hasAuthHeader = !!authHeader;
    const cookieHeader = request.headers.get('cookie');
    const hasCookies = !!cookieHeader;
    
    console.log('[PurchasingAPI] GET request received:', {
      hasAuthHeader,
      hasCookies,
      authHeaderLength: authHeader?.length || 0,
      cookieHeaderLength: cookieHeader?.length || 0,
    });
    
    const adminId = await getCurrentAdminId(request);
    
    console.log('[PurchasingAPI] GET: Admin ID from request:', adminId);
    
    // التحقق من صلاحية عرض الفواتير
    if (!adminId) {
      console.warn('[PurchasingAPI] GET: No admin ID found in request', {
        hasAuthHeader,
        hasCookies,
      });
      return NextResponse.json(
        { error: 'يجب تسجيل الدخول أولاً. يرجى التأكد من إرسال Authorization header مع التوكن.' },
        { status: 401 }
      );
    }
    
    console.log('[PurchasingAPI] GET: Checking permission for admin:', adminId);
    const hasPermission = await checkPurchasingPermission(adminId, 'VIEW_INVOICES');
    console.log('[PurchasingAPI] GET: Permission check result:', hasPermission);
    
    if (!hasPermission) {
      console.warn(`[PurchasingAPI] Admin ${adminId} does not have VIEW_INVOICES permission`);
      return NextResponse.json(
        { error: 'ليس لديك صلاحية لعرض فواتير المشتريات. يرجى التواصل مع المسؤول.' },
        { status: 403 }
      );
    }
    
    console.log('[PurchasingAPI] GET: Permission check passed for admin:', adminId);

    const status = request.nextUrl.searchParams.get('status');
    const supplierParam = request.nextUrl.searchParams.get('supplierId');
    const where: Prisma.warehouse_invoicesWhereInput = {};

    if (status && status !== 'all' && allowedStatuses.includes(status)) {
      where.status = status as any;
    }
    if (supplierParam) {
      where.supplier_id = Number(supplierParam);
    }

    const invoices = await retryPrismaQuery(() =>
      prisma.warehouse_invoices.findMany({
        where,
        include: {
          suppliers: { select: { name: true, name_ar: true } },
          warehouses: { select: { name: true } },
          warehouse_invoice_items: {
            include: {
              store_products: {
                select: { name_ar: true, name_en: true, sku: true },
              },
            },
          },
        },
        orderBy: { created_at: 'desc' },
      })
    );

    console.log('[PurchasingAPI] GET: Successfully fetched', invoices.length, 'invoices');
    return NextResponse.json({ invoices: invoices.map(serializeInvoice) });
  } catch (error) {
    console.error('[PurchasingAPI] Error fetching invoices:', error);
    
    // إرجاع رسالة خطأ أكثر تفصيلاً
    const errorMessage = error instanceof Error ? error.message : 'فشل في جلب فواتير المشتريات';
    console.error('[PurchasingAPI] Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return NextResponse.json(
      { 
        error: 'فشل في جلب فواتير المشتريات',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // تسجيل تفصيلي للطلب
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    const hasAuthHeader = !!authHeader;
    const cookieHeader = request.headers.get('cookie');
    const hasCookies = !!cookieHeader;
    
    console.log('[PurchasingAPI] POST request received:', {
      hasAuthHeader,
      hasCookies,
      authHeaderLength: authHeader?.length || 0,
      cookieHeaderLength: cookieHeader?.length || 0,
    });
    
    const adminId = await getCurrentAdminId(request);
    
    if (!adminId) {
      console.warn('[PurchasingAPI] POST: No admin ID found in request', {
        hasAuthHeader,
        hasCookies,
      });
      return NextResponse.json(
        { error: 'يجب تسجيل الدخول أولاً. يرجى التأكد من إرسال Authorization header مع التوكن.' },
        { status: 401 }
      );
    }
    
    console.log('[PurchasingAPI] POST: Admin ID found:', adminId);
    
    // التحقق من صلاحية إنشاء الفواتير
    const hasPermission = await checkPurchasingPermission(adminId, 'CREATE_INVOICE');
    if (!hasPermission) {
      console.warn(`[PurchasingAPI] Admin ${adminId} does not have CREATE_INVOICE permission`);
      return NextResponse.json(
        { error: 'ليس لديك صلاحية لإنشاء فواتير المشتريات. يرجى التواصل مع المسؤول.' },
        { status: 403 }
      );
    }
    
    console.log('[PurchasingAPI] POST: Permission check passed for admin:', adminId);

    // الحصول على user_id من التوكن (لحقل created_by)
    const userId = await getCurrentUserId(request);
    console.log('[PurchasingAPI] POST: User ID from token:', userId);

    const body = await request.json();
    if (!body?.warehouse_id || !body?.invoice_date || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'بيانات ناقصة. يرجى إدخال المخزن، تاريخ الفاتورة والبنود.' },
        { status: 400 }
      );
    }

    const invoiceNumber =
      body.invoice_number ||
      `PO-${new Date().getFullYear()}-${Math.floor(Math.random() * 1_000_000)
        .toString()
        .padStart(6, '0')}`;

    const result = await retryPrismaQuery(() =>
      prisma.$transaction(async (tx) => {
        const invoice = await tx.warehouse_invoices.create({
          data: {
            invoice_number: invoiceNumber,
            warehouse_id: Number(body.warehouse_id),
            supplier_id: body.supplier_id ? Number(body.supplier_id) : null,
            invoice_date: new Date(body.invoice_date),
            received_date: body.received_date ? new Date(body.received_date) : null,
            total_amount: 0,
            status: 'pending',
            notes: body.notes || null,
            created_by: userId || null, // user_id من auth.users
          },
        });

        let totalAmount = 0;

        for (const item of body.items) {
          const quantity = Number(item.quantity) || 0;
          const unitPrice = Number(item.unit_price) || 0;
          // استخدام total_price إذا كان موجوداً، وإلا حساب من الكمية × السعر - الخصم
          const itemTotalPrice = item.total_price 
            ? Number(item.total_price) 
            : (quantity * unitPrice - (Number(item.discount_value) || 0));
          
          totalAmount += itemTotalPrice;

          // التحقق من وجود product_id أو catalog_product_id
          const productId = item.product_id && item.product_id !== '' ? item.product_id : null;
          const catalogProductId = item.catalog_product_id && item.catalog_product_id !== '' 
            ? BigInt(item.catalog_product_id) 
            : null;
          
          console.log('[PurchasingAPI] Creating invoice item:', {
            invoice_id: invoice.id,
            product_id: productId,
            catalog_product_id: catalogProductId?.toString(),
            quantity,
            unitPrice,
          });

          await tx.warehouse_invoice_items.create({
            data: {
              invoice_id: invoice.id,
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

        const updated = await tx.warehouse_invoices.update({
          where: { id: invoice.id },
          data: { total_amount: new Prisma.Decimal(totalAmount) },
          include: {
            suppliers: { select: { name: true, name_ar: true } },
            warehouses: { select: { name: true } },
            warehouse_invoice_items: {
              include: { store_products: { select: { sku: true, name_ar: true, name_en: true } } },
            },
          },
        });

        return updated;
      })
    );

    return NextResponse.json(serializeInvoice(result));
  } catch (error) {
    console.error('[PurchasingAPI] Error creating invoice', error);
    return NextResponse.json({ error: 'فشل في إنشاء فاتورة المشتريات' }, { status: 500 });
  }
}


