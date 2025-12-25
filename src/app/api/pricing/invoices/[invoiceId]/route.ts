import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/db';
import { getCurrentAdminId } from '@/lib/auth/get-current-user';
import { checkPricingPermission, PRICING_PERMISSIONS } from '@/lib/permissions/purchasing-permissions';

// Helper function to retry Prisma queries on connection errors
async function retryPrismaQuery<T>(
  queryFn: () => Promise<T>,
  maxRetries = 3,
  attempt = 1
): Promise<T> {
  try {
    return await queryFn();
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P1017' &&
      attempt < maxRetries
    ) {
      console.warn(`[InvoiceDetailsAPI] P1017 on attempt ${attempt}, retrying...`);
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      return retryPrismaQuery(queryFn, maxRetries, attempt + 1);
    }
    throw error;
  }
}

/**
 * GET /api/pricing/invoices/[invoiceId]
 * جلب تفاصيل فاتورة معينة مع عناصرها
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    console.log('[PricingInvoiceDetailsAPI] GET request received');
    
    const adminId = await getCurrentAdminId(request);
    
    console.log('[PricingInvoiceDetailsAPI] GET: Admin ID from request:', adminId);
    
    if (!adminId) {
      console.warn('[PricingInvoiceDetailsAPI] GET: No admin ID found in request');
      return NextResponse.json(
        { error: 'يجب تسجيل الدخول أولاً' },
        { status: 401 }
      );
    }
    
    // التحقق من صلاحية عرض الفواتير
    console.log('[PricingInvoiceDetailsAPI] GET: Checking permission for admin:', adminId);
    const hasPermission = await checkPricingPermission(adminId, 'VIEW_PRICING');
    console.log('[PricingInvoiceDetailsAPI] GET: Permission check result:', hasPermission);
    
    if (!hasPermission) {
      console.warn(`[PricingInvoiceDetailsAPI] Admin ${adminId} does not have VIEW_PRICING permission`);
      return NextResponse.json(
        { error: 'ليس لديك صلاحية لعرض فواتير التسعير' },
        { status: 403 }
      );
    }
    
    console.log('[PricingInvoiceDetailsAPI] GET: Permission check passed for admin:', adminId);

    const { invoiceId } = await params;

    const invoice = await retryPrismaQuery(() => prisma.warehouse_invoices.findUnique({
      where: { id: invoiceId },
      include: {
        warehouses: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
        suppliers: {
          select: {
            id: true,
            name: true,
            name_ar: true,
            supplier_code: true,
            contact_phone: true,
            email: true,
          },
        },
        warehouse_invoice_items: {
          select: {
            id: true,
            invoice_id: true,
            product_id: true,
            catalog_product_id: true,
            quantity: true,
            unit_price: true,
            total_price: true,
            measurement_unit: true,
            batch_number: true,
            expiry_date: true,
            notes: true,
            created_at: true,
            updated_at: true,
          },
        },
      },
    }));

    if (!invoice) {
      return NextResponse.json(
        { error: 'الفاتورة غير موجودة' },
        { status: 404 }
      );
    }

    // جلب تفاصيل المنتجات والأسعار بشكل منفصل
    const invoiceItemIds = invoice.warehouse_invoice_items.map(item => item.id);
    
    // جلب catalog_products
    const catalogProductIds = invoice.warehouse_invoice_items
      .filter(item => item.catalog_product_id !== null)
      .map(item => {
        const id = item.catalog_product_id!;
        return typeof id === 'bigint' ? id : BigInt(id);
      });
    
    const catalogProducts = catalogProductIds.length > 0
      ? await retryPrismaQuery(() => prisma.catalog_products.findMany({
          where: { 
            id: { 
              in: catalogProductIds
            } 
          },
          select: { id: true, name: true, sku: true },
        }))
      : [];
    
    console.log('[PricingInvoiceDetailsAPI] Catalog products found:', {
      requestedIds: catalogProductIds.map(id => id.toString()),
      foundCount: catalogProducts.length,
      foundProducts: catalogProducts.map(p => ({ id: p.id.toString(), name: p.name, sku: p.sku })),
    });
    
    const catalogProductsMap = new Map(catalogProducts.map(p => [p.id.toString(), p]));

    // جلب store_products
    const storeProductIds = invoice.warehouse_invoice_items
      .filter(item => item.product_id !== null)
      .map(item => item.product_id!);
    
    const storeProducts = storeProductIds.length > 0
      ? await retryPrismaQuery(() => prisma.store_products.findMany({
          where: { id: { in: storeProductIds } },
          select: { id: true, name_ar: true, name_en: true, sku: true },
        }))
      : [];
    
    console.log('[PricingInvoiceDetailsAPI] Store products found:', {
      requestedIds: storeProductIds,
      foundCount: storeProducts.length,
      foundProducts: storeProducts.map(p => ({ id: p.id, name_ar: p.name_ar, sku: p.sku })),
    });
    
    const storeProductsMap = new Map(storeProducts.map(p => [p.id, p]));

    // جلب product_pricing
    const pricings = invoiceItemIds.length > 0
      ? await retryPrismaQuery(() => prisma.product_pricing.findMany({
          where: { invoice_item_id: { in: invoiceItemIds } },
          select: {
            id: true,
            invoice_item_id: true,
            customer_type: true,
            cost_price: true,
            selling_price: true,
            markup_percentage: true,
            profit_margin: true,
            status: true,
          },
          orderBy: { created_at: 'desc' },
        }))
      : [];
    
    const pricingsByItemId = new Map<string, typeof pricings>();
    pricings.forEach(pricing => {
      const itemId = pricing.invoice_item_id;
      if (!pricingsByItemId.has(itemId)) {
        pricingsByItemId.set(itemId, []);
      }
      pricingsByItemId.get(itemId)!.push(pricing);
    });

    // تحويل Decimal إلى string وربط البيانات
    const serializedInvoice = {
      ...invoice,
      total_amount: invoice.total_amount.toString(),
      invoice_date: invoice.invoice_date.toISOString(),
      received_date: invoice.received_date?.toISOString() || null,
      created_at: invoice.created_at?.toISOString() || null,
      updated_at: invoice.updated_at?.toISOString() || null,
      warehouse_invoice_items: invoice.warehouse_invoice_items.map((item) => {
        // تحويل catalog_product_id إلى string للبحث في Map
        const catalogProductIdStr = item.catalog_product_id?.toString() || null;
        const catalogProduct = catalogProductIdStr
          ? catalogProductsMap.get(catalogProductIdStr)
          : null;
        const storeProduct = item.product_id
          ? storeProductsMap.get(item.product_id)
          : null;
        const itemPricings = pricingsByItemId.get(item.id) || [];

        console.log('[PricingInvoiceDetailsAPI] Item mapping:', {
          itemId: item.id,
          catalog_product_id: item.catalog_product_id,
          catalog_product_id_str: catalogProductIdStr,
          product_id: item.product_id,
          catalogProductFound: !!catalogProduct,
          storeProductFound: !!storeProduct,
          catalogProductName: catalogProduct?.name,
          storeProductName: storeProduct?.name_ar,
        });

        return {
          ...item,
          catalog_product_id: catalogProductIdStr,
          quantity: item.quantity.toString(),
          unit_price: item.unit_price.toString(),
          total_price: item.total_price.toString(),
          expiry_date: item.expiry_date?.toISOString() || null,
          created_at: item.created_at?.toISOString() || null,
          updated_at: item.updated_at?.toISOString() || null,
          catalog_products: catalogProduct ? {
            id: catalogProduct.id.toString(),
            name: catalogProduct.name,
            sku: catalogProduct.sku,
          } : null,
          store_products: storeProduct ? {
            id: storeProduct.id,
            name_ar: storeProduct.name_ar,
            name_en: storeProduct.name_en,
            sku: storeProduct.sku,
          } : null,
          product_pricing: itemPricings.map(p => ({
            id: p.id,
            invoice_item_id: p.invoice_item_id,
            customer_type: p.customer_type,
            cost_price: p.cost_price.toString(),
            selling_price: p.selling_price.toString(),
            markup_percentage: p.markup_percentage.toString(),
            profit_margin: p.profit_margin.toString(),
            status: p.status,
          })),
        };
      }),
    };

    console.log('[PricingInvoiceDetailsAPI] Serialized invoice items:', 
      serializedInvoice.warehouse_invoice_items.map(item => ({
        id: item.id,
        catalog_product_id: item.catalog_product_id,
        product_id: item.product_id,
        catalog_products: item.catalog_products,
        store_products: item.store_products,
      }))
    );

    return NextResponse.json(serializedInvoice);
  } catch (error) {
    console.error('Error fetching invoice details:', error);
    return NextResponse.json(
      {
        error: 'فشل في جلب تفاصيل الفاتورة',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/pricing/invoices/[invoiceId]
 * تحديث حالة الفاتورة بعد التسعير
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    console.log('[PricingInvoiceDetailsAPI] PATCH request received');
    
    const adminId = await getCurrentAdminId(request);
    
    console.log('[PricingInvoiceDetailsAPI] PATCH: Admin ID from request:', adminId);
    
    if (!adminId) {
      console.warn('[PricingInvoiceDetailsAPI] PATCH: No admin ID found in request');
      return NextResponse.json(
        { error: 'يجب تسجيل الدخول أولاً' },
        { status: 401 }
      );
    }
    
    // التحقق من صلاحية تحديث حالة الفاتورة
    console.log('[PricingInvoiceDetailsAPI] PATCH: Checking permission for admin:', adminId);
    const hasPermission = await checkPricingPermission(adminId, 'SET_PRICING');
    console.log('[PricingInvoiceDetailsAPI] PATCH: Permission check result:', hasPermission);
    
    if (!hasPermission) {
      console.warn(`[PricingInvoiceDetailsAPI] Admin ${adminId} does not have SET_PRICING permission`);
      return NextResponse.json(
        { error: 'ليس لديك صلاحية لتحديث حالة الفاتورة' },
        { status: 403 }
      );
    }
    
    console.log('[PricingInvoiceDetailsAPI] PATCH: Permission check passed for admin:', adminId);

    const { invoiceId } = await params;
    const body = await request.json();
    const { status } = body;

    const validStatuses = ['pending', 'received', 'priced', 'approved', 'rejected'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'حالة غير صحيحة', validStatuses },
        { status: 400 }
      );
    }

    const updatedInvoice = await prisma.warehouse_invoices.update({
      where: { id: invoiceId },
      data: {
        status: status as any,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      ...updatedInvoice,
      total_amount: updatedInvoice.total_amount.toString(),
    });
  } catch (error) {
    console.error('Error updating invoice status:', error);
    return NextResponse.json(
      {
        error: 'فشل في تحديث حالة الفاتورة',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

