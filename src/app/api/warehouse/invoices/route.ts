import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/db';

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
      console.warn(`[WarehouseInvoiceAPI] P1017 on attempt ${attempt}, retrying...`);
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      return retryPrismaQuery(queryFn, maxRetries, attempt + 1);
    }
    throw error;
  }
}

/**
 * POST /api/warehouse/invoices
 * إنشاء فاتورة واردة جديدة مع عناصرها (من إدارة المخازن)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      warehouse_id,
      supplier_id,
      invoice_number,
      invoice_date,
      items, // Array of { product_id?, catalog_product_id?, quantity, unit_price, measurement_unit, batch_number?, expiry_date?, notes? }
      notes,
      created_by,
    } = body;

    // التحقق من البيانات المطلوبة
    if (!warehouse_id || !invoice_number || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'بيانات ناقصة: warehouse_id, invoice_number, items مطلوبة' },
        { status: 400 }
      );
    }

    // حساب إجمالي الفاتورة (إذا كان unit_price موجود، وإلا 0)
    const totalAmount = items.reduce((sum: number, item: any) => {
      const quantity = parseFloat(item.quantity || 0);
      const unitPrice = item.unit_price ? parseFloat(item.unit_price) : 0;
      return sum + (quantity * unitPrice);
    }, 0);

    // إنشاء الفاتورة والعناصر في transaction
    const result = await retryPrismaQuery(async () => {
      return await prisma.$transaction(async (tx) => {
        // إنشاء الفاتورة
        const invoice = await tx.warehouse_invoices.create({
          data: {
            invoice_number,
            warehouse_id: parseInt(warehouse_id),
            supplier_id: supplier_id ? parseInt(supplier_id) : null,
            invoice_date: invoice_date ? new Date(invoice_date) : new Date(),
            received_date: new Date(), // تاريخ الاستلام = الآن
            total_amount: totalAmount,
            status: 'received', // حالة: مستلمة (جاهزة للتسعير)
            notes: notes || null,
            created_by: created_by || null,
          },
        });

        // إنشاء عناصر الفاتورة
        const invoiceItems = await Promise.all(
          items.map(async (item: any) => {
            const quantity = parseFloat(item.quantity || 0);
            const unitPrice = item.unit_price ? parseFloat(item.unit_price) : 0; // يمكن أن يكون null
            const totalPrice = unitPrice > 0 ? quantity * unitPrice : 0;

            // تحديد product_id أو catalog_product_id
            const productId = item.product_id || null;
            const catalogProductId = item.catalog_product_id 
              ? (typeof item.catalog_product_id === 'bigint' 
                  ? item.catalog_product_id 
                  : BigInt(item.catalog_product_id))
              : null;

            if (!productId && !catalogProductId) {
              throw new Error('يجب تحديد product_id أو catalog_product_id');
            }

            return await tx.warehouse_invoice_items.create({
              data: {
                invoice_id: invoice.id,
                product_id: productId,
                catalog_product_id: catalogProductId,
                quantity: quantity,
                unit_price: unitPrice > 0 ? unitPrice : 0, // يمكن أن يكون 0 إذا لم يتم إدخاله بعد
                total_price: totalPrice,
                measurement_unit: item.measurement_unit || 'piece',
                batch_number: item.batch_number || null,
                expiry_date: item.expiry_date ? new Date(item.expiry_date) : null,
                notes: item.notes || null,
              },
            });
          })
        );

        return { invoice, items: invoiceItems };
      });
    });

    // تسجيل حركات المخزون
    for (const item of items) {
      try {
        // استدعاء inventoryService.recordInMovement
        // لكن يجب أن نستخدم API endpoint أو service مباشرة
        // سنترك هذا للمستخدم لتنفيذه حسب نظامه
      } catch (error) {
        console.error('Error recording inventory movement:', error);
        // لا نوقف العملية إذا فشل تسجيل الحركة
      }
    }

    // تحويل Decimal إلى string
    const serializedInvoice = {
      ...result.invoice,
      total_amount: result.invoice.total_amount.toString(),
      invoice_date: result.invoice.invoice_date.toISOString(),
      received_date: result.invoice.received_date?.toISOString() || null,
      created_at: result.invoice.created_at?.toISOString() || null,
      updated_at: result.invoice.updated_at?.toISOString() || null,
      warehouse_invoice_items: result.items.map((item) => ({
        ...item,
        catalog_product_id: item.catalog_product_id?.toString() || null,
        quantity: item.quantity.toString(),
        unit_price: item.unit_price.toString(),
        total_price: item.total_price.toString(),
        expiry_date: item.expiry_date?.toISOString() || null,
        created_at: item.created_at?.toISOString() || null,
        updated_at: item.updated_at?.toISOString() || null,
      })),
    };

    return NextResponse.json(serializedInvoice, { status: 201 });
  } catch (error) {
    console.error('Error creating warehouse invoice:', error);
    return NextResponse.json(
      {
        error: 'فشل في إنشاء الفاتورة',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

