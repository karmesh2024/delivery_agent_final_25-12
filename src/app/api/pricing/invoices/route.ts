import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/db';
import { getCurrentAdminId } from '@/lib/auth/get-current-user';
import { checkPricingPermission } from '@/lib/permissions/purchasing-permissions';

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
      console.warn(`[PricingAPI] P1017 on attempt ${attempt}, retrying...`);
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      return retryPrismaQuery(queryFn, maxRetries, attempt + 1);
    }
    throw error;
  }
}

/**
 * GET /api/pricing/invoices
 * جلب الفواتير الواردة من المخازن (status = 'received') لإدارة التسعير
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[PricingAPI] GET request received');
    
    const adminId = await getCurrentAdminId(request);
    
    console.log('[PricingAPI] GET: Admin ID from request:', adminId);
    
    if (!adminId) {
      console.warn('[PricingAPI] GET: No admin ID found in request');
      return NextResponse.json(
        { error: 'يجب تسجيل الدخول أولاً' },
        { status: 401 }
      );
    }
    
    // التحقق من صلاحية عرض الفواتير
    console.log('[PricingAPI] GET: Checking permission for admin:', adminId);
    const hasPermission = await checkPricingPermission(adminId, 'VIEW_PRICING');
    console.log('[PricingAPI] GET: Permission check result:', hasPermission);
    
    if (!hasPermission) {
      console.warn(`[PricingAPI] Admin ${adminId} does not have VIEW_PRICING permission`);
      return NextResponse.json(
        { error: 'ليس لديك صلاحية لعرض فواتير التسعير' },
        { status: 403 }
      );
    }
    
    console.log('[PricingAPI] GET: Permission check passed for admin:', adminId);

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'received'; // Default: received invoices
    const warehouseId = searchParams.get('warehouse_id');

    // بناء استعلام
    const where: any = {};
    
    if (status && status !== 'all') {
      where.status = status;
    }

    if (warehouseId) {
      where.warehouse_id = parseInt(warehouseId);
    }

    // جلب الفواتير مع العلاقات مع retry logic
    // نبدأ بجلب الفواتير بدون العلاقات المعقدة أولاً
    const invoices = await retryPrismaQuery(async () => {
      try {
        return await prisma.warehouse_invoices.findMany({
          where,
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
          orderBy: {
            created_at: 'desc',
          },
          take: 100, // Limit to 100 invoices for performance
        });
      } catch (queryError) {
        console.error('Prisma query error:', queryError);
        if (queryError instanceof Prisma.PrismaClientKnownRequestError) {
          console.error('Prisma error code:', queryError.code);
          console.error('Prisma error meta:', queryError.meta);
        }
        throw queryError;
      }
    });

    // جلب تفاصيل المنتجات بشكل منفصل لتجنب مشاكل العلاقات
    const invoiceItemIds = invoices.flatMap(inv => 
      inv.warehouse_invoice_items.map(item => item.id)
    );

    // جلب product_pricing للعناصر
    const pricings = invoiceItemIds.length > 0 
      ? await retryPrismaQuery(() => prisma.product_pricing.findMany({
          where: {
            invoice_item_id: { in: invoiceItemIds },
          },
          select: {
            id: true,
            invoice_item_id: true,
            customer_type: true,
            selling_price: true,
            status: true,
          },
        }))
      : [];

    // تجميع الأسعار حسب invoice_item_id
    const pricingsByItemId = new Map<string, typeof pricings>();
    pricings.forEach(pricing => {
      const itemId = pricing.invoice_item_id;
      if (!pricingsByItemId.has(itemId)) {
        pricingsByItemId.set(itemId, []);
      }
      pricingsByItemId.get(itemId)!.push(pricing);
    });

    // جلب catalog_products
    const catalogProductIds = invoices.flatMap(inv =>
      inv.warehouse_invoice_items
        .filter(item => item.catalog_product_id !== null)
        .map(item => item.catalog_product_id!)
    );

    const catalogProducts = catalogProductIds.length > 0
      ? await retryPrismaQuery(() => prisma.catalog_products.findMany({
          where: {
            id: { in: catalogProductIds },
          },
          select: {
            id: true,
            name: true,
            sku: true,
          },
        }))
      : [];

    const catalogProductsMap = new Map(catalogProducts.map(p => [p.id.toString(), p]));

    // جلب store_products
    const storeProductIds = invoices.flatMap(inv =>
      inv.warehouse_invoice_items
        .filter(item => item.product_id !== null)
        .map(item => item.product_id!)
    );

    const storeProducts = storeProductIds.length > 0
      ? await retryPrismaQuery(() => prisma.store_products.findMany({
          where: {
            id: { in: storeProductIds },
          },
          select: {
            id: true,
            name_ar: true,
            name_en: true,
            sku: true,
          },
        }))
      : [];

    const storeProductsMap = new Map(storeProducts.map(p => [p.id, p]));

    // Helper function to serialize BigInt and Decimal values
    const serializeValue = (value: any): any => {
      if (value === null || value === undefined) return value;
      if (typeof value === 'bigint') return value.toString();
      if (value && typeof value === 'object' && 'toString' in value && typeof value.toString === 'function') {
        // Handle Prisma Decimal
        if (value.constructor && value.constructor.name === 'Decimal') {
          return value.toString();
        }
      }
      if (Array.isArray(value)) return value.map(serializeValue);
      if (typeof value === 'object') {
        const serialized: any = {};
        for (const [key, val] of Object.entries(value)) {
          serialized[key] = serializeValue(val);
        }
        return serialized;
      }
      return value;
    };

    // تحويل Decimal و BigInt إلى string وربط البيانات
    const serializedInvoices = invoices.map((invoice) => {
      return {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        warehouse_id: invoice.warehouse_id,
        supplier_id: invoice.supplier_id,
        invoice_date: invoice.invoice_date.toISOString(),
        received_date: invoice.received_date?.toISOString() || null,
        total_amount: invoice.total_amount.toString(),
        status: invoice.status,
        notes: invoice.notes,
        created_by: invoice.created_by,
        created_at: invoice.created_at?.toISOString() || null,
        updated_at: invoice.updated_at?.toISOString() || null,
        warehouses: invoice.warehouses,
        suppliers: invoice.suppliers,
        warehouse_invoice_items: invoice.warehouse_invoice_items.map((item) => {
          const catalogProduct = item.catalog_product_id 
            ? catalogProductsMap.get(item.catalog_product_id.toString())
            : null;
          const storeProduct = item.product_id
            ? storeProductsMap.get(item.product_id)
            : null;
          const itemPricings = pricingsByItemId.get(item.id) || [];

          return {
            ...item,
            id: item.id,
            invoice_id: item.invoice_id,
            product_id: item.product_id,
            catalog_product_id: item.catalog_product_id?.toString() || null,
            quantity: item.quantity.toString(),
            unit_price: item.unit_price.toString(),
            total_price: item.total_price.toString(),
            measurement_unit: item.measurement_unit,
            batch_number: item.batch_number,
            expiry_date: item.expiry_date?.toISOString() || null,
            notes: item.notes,
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
              customer_type: p.customer_type,
              selling_price: p.selling_price.toString(),
              status: p.status,
            })),
          };
        }),
      };
    });

    // حساب الإحصائيات
    const stats = {
      pending: invoices.filter((inv) => inv.status === 'pending').length,
      received: invoices.filter((inv) => inv.status === 'received').length,
      priced: invoices.filter((inv) => inv.status === 'priced').length,
      total: invoices.length,
    };

    return NextResponse.json({
      invoices: serializedInvoices,
      stats,
    });
  } catch (error) {
    console.error('Error fetching invoices for pricing:', error);
    
    // Log more details for debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json(
      {
        error: 'فشل في جلب الفواتير',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

