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
      console.warn(`[InvoiceItemAPI] P1017 on attempt ${attempt}, retrying...`);
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      return retryPrismaQuery(queryFn, maxRetries, attempt + 1);
    }
    throw error;
  }
}

/**
 * PATCH /api/warehouse/invoices/items/[itemId]
 * تحديث سعر التكلفة لعنصر الفاتورة
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const body = await request.json();
    const { unit_price, total_price, notes } = body;

    if (!unit_price || parseFloat(unit_price) <= 0) {
      return NextResponse.json(
        { error: 'سعر التكلفة مطلوب ويجب أن يكون أكبر من صفر' },
        { status: 400 }
      );
    }

    // جلب العنصر الحالي
    const currentItem = await retryPrismaQuery(() => 
      prisma.warehouse_invoice_items.findUnique({
        where: { id: itemId },
        select: {
          quantity: true,
          unit_price: true,
        },
      })
    );

    if (!currentItem) {
      return NextResponse.json(
        { error: 'عنصر الفاتورة غير موجود' },
        { status: 404 }
      );
    }

    const newUnitPrice = parseFloat(unit_price);
    const quantity = parseFloat(currentItem.quantity.toString());
    // استخدام total_price المرسل أو حساب من unit_price
    const newTotalPrice = total_price ? parseFloat(total_price) : (quantity * newUnitPrice);

    // تحديث سعر التكلفة والإجمالي والملاحظات (الخصم)
    const updatedItem = await retryPrismaQuery(() =>
      prisma.warehouse_invoice_items.update({
        where: { id: itemId },
        data: {
          unit_price: newUnitPrice,
          total_price: newTotalPrice,
          notes: notes || null, // حفظ الخصم في notes
          updated_at: new Date(),
        },
        select: {
          id: true,
          invoice_id: true,
          unit_price: true,
          total_price: true,
          quantity: true,
        },
      })
    );

    // تحديث إجمالي الفاتورة
    const invoiceItems = await retryPrismaQuery(() =>
      prisma.warehouse_invoice_items.findMany({
        where: { invoice_id: updatedItem.invoice_id },
        select: { total_price: true },
      })
    );

    const newInvoiceTotal = invoiceItems.reduce(
      (sum, item) => sum + parseFloat(item.total_price.toString()),
      0
    );

    await retryPrismaQuery(() =>
      prisma.warehouse_invoices.update({
        where: { id: updatedItem.invoice_id },
        data: {
          total_amount: newInvoiceTotal,
          updated_at: new Date(),
        },
      })
    );

    return NextResponse.json({
      ...updatedItem,
      unit_price: updatedItem.unit_price.toString(),
      total_price: updatedItem.total_price.toString(),
      quantity: updatedItem.quantity.toString(),
    });
  } catch (error) {
    console.error('Error updating invoice item:', error);
    return NextResponse.json(
      {
        error: 'فشل في تحديث سعر التكلفة',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

