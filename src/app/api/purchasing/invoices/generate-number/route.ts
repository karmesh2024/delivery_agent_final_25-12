import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

/**
 * GET /api/purchasing/invoices/generate-number
 * توليد رقم فاتورة متسلسل جديد
 */
export async function GET(request: NextRequest) {
  try {
    // جلب آخر فاتورة مشتريات
    const lastInvoice = await prisma.warehouse_invoices.findFirst({
      where: {
        invoice_number: {
          startsWith: 'PO-',
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      select: {
        invoice_number: true,
        created_at: true,
      },
    });

    const currentYear = new Date().getFullYear();
    let nextNumber = 1;

    if (lastInvoice) {
      // استخراج الرقم من آخر فاتورة (مثال: PO-2025-000001)
      const match = lastInvoice.invoice_number.match(/^PO-(\d{4})-(\d+)$/);
      if (match) {
        const lastYear = parseInt(match[1], 10);
        const lastNumber = parseInt(match[2], 10);

        // إذا كانت نفس السنة، نزيد الرقم
        if (lastYear === currentYear) {
          nextNumber = lastNumber + 1;
        }
        // إذا كانت سنة مختلفة، نبدأ من 1
      }
    }

    // توليد رقم الفاتورة: PO-YYYY-NNNNNN
    const invoiceNumber = `PO-${currentYear}-${nextNumber.toString().padStart(6, '0')}`;

    return NextResponse.json({ invoice_number: invoiceNumber });
  } catch (error: any) {
    console.error('[PurchasingAPI] Error generating invoice number:', error);
    return NextResponse.json(
      { error: 'فشل في توليد رقم الفاتورة', details: error.message },
      { status: 500 }
    );
  }
}

