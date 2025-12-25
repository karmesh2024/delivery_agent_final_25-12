import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/db';
import { getCurrentAdminId, getCurrentUserId } from '@/lib/auth/get-current-user';
import { checkPurchasingPermission } from '@/lib/permissions/purchasing-permissions';

/**
 * POST /api/purchasing/invoices/[invoiceId]/payment
 * تسجيل دفعة لفاتورة مورد
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    console.log('[InvoicePaymentAPI] POST request received');
    
    const adminId = await getCurrentAdminId(request);
    const userId = await getCurrentUserId(request);
    
    console.log('[InvoicePaymentAPI] Admin ID:', adminId, 'User ID:', userId);
    
    if (!adminId) {
      console.warn('[InvoicePaymentAPI] No admin ID found');
      return NextResponse.json(
        { error: 'يجب تسجيل الدخول أولاً' },
        { status: 401 }
      );
    }
    
    const hasPermission = await checkPurchasingPermission(adminId, 'EDIT_INVOICE');
    
    console.log('[InvoicePaymentAPI] Has permission:', hasPermission);
    
    if (!hasPermission) {
      console.warn('[InvoicePaymentAPI] Permission denied for admin:', adminId);
      return NextResponse.json(
        { error: 'ليس لديك صلاحية لتسجيل المدفوعات' },
        { status: 403 }
      );
    }

    const { invoiceId } = await params;
    console.log('[InvoicePaymentAPI] Invoice ID:', invoiceId);
    
    const body = await request.json();
    console.log('[InvoicePaymentAPI] Request body:', body);
    
    const {
      amount,
      payment_method,
      payment_reference,
      payment_notes,
      payment_date,
    } = body;

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json(
        { error: 'يجب تحديد مبلغ الدفعة' },
        { status: 400 }
      );
    }

    // جلب الفاتورة الحالية
    console.log('[InvoicePaymentAPI] Fetching invoice:', invoiceId);
    const invoice = await prisma.warehouse_invoices.findUnique({
      where: { id: invoiceId },
      select: {
        id: true,
        total_amount: true,
        paid_amount: true,
        payment_status: true,
      },
    });

    console.log('[InvoicePaymentAPI] Invoice found:', invoice);

    if (!invoice) {
      console.warn('[InvoicePaymentAPI] Invoice not found:', invoiceId);
      return NextResponse.json(
        { error: 'الفاتورة غير موجودة' },
        { status: 404 }
      );
    }

    const currentPaidAmount = Number(invoice.paid_amount || 0);
    const totalAmount = Number(invoice.total_amount || 0);
    const paymentAmount = Number(amount);
    const newPaidAmount = currentPaidAmount + paymentAmount;

    console.log('[InvoicePaymentAPI] Payment calculation:', {
      currentPaidAmount,
      totalAmount,
      paymentAmount,
      newPaidAmount,
    });

    // تحديد حالة الدفع الجديدة
    let newPaymentStatus: string;
    if (newPaidAmount >= totalAmount) {
      newPaymentStatus = 'paid';
    } else if (newPaidAmount > 0) {
      newPaymentStatus = 'partial';
    } else {
      newPaymentStatus = 'pending';
    }

    console.log('[InvoicePaymentAPI] New payment status:', newPaymentStatus);

    // تحديث الفاتورة
    console.log('[InvoicePaymentAPI] Updating invoice with data:', {
      paid_amount: newPaidAmount,
      payment_status: newPaymentStatus,
      payment_date: payment_date ? new Date(payment_date) : new Date(),
      payment_method: payment_method || null,
      payment_reference: payment_reference || null,
      payment_notes: payment_notes || null,
    });

    const updated = await prisma.warehouse_invoices.update({
      where: { id: invoiceId },
      data: {
        paid_amount: new Prisma.Decimal(newPaidAmount),
        payment_status: newPaymentStatus,
        payment_date: payment_date ? new Date(payment_date) : new Date(),
        payment_method: payment_method || null,
        payment_reference: payment_reference || null,
        payment_notes: payment_notes || null,
        updated_at: new Date(),
      },
    });

    const responseData = {
      id: updated.id,
      paid_amount: Number(updated.paid_amount || 0),
      payment_status: updated.payment_status,
      remaining_amount: totalAmount - newPaidAmount,
      message: 'تم تسجيل الدفعة بنجاح',
    };

    console.log('[InvoicePaymentAPI] Success response:', responseData);

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('[InvoicePaymentAPI] Error recording payment:', error);
    console.error('[InvoicePaymentAPI] Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
    });
    
    // التحقق من نوع الخطأ
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'الفاتورة غير موجودة' },
          { status: 404 }
        );
      }
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'خطأ في قاعدة البيانات: قيمة مكررة' },
          { status: 400 }
        );
      }
      // خطأ في الأعمدة غير الموجودة
      if (error.message?.includes('Unknown column') || error.message?.includes('column') || error.message?.includes('does not exist')) {
        return NextResponse.json(
          { 
            error: 'خطأ في قاعدة البيانات: الأعمدة غير موجودة. يرجى تطبيق migration للمدفوعات',
            details: error.message,
            hint: 'قم بتطبيق migration: add_supplier_payments_tracking.sql'
          },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'فشل في تسجيل الدفعة', 
        details: error.message,
        code: error.code || 'UNKNOWN_ERROR'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/purchasing/invoices/[invoiceId]/payment
 * جلب معلومات الدفع للفاتورة
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
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
        { error: 'ليس لديك صلاحية لعرض معلومات الدفع' },
        { status: 403 }
      );
    }

    const { invoiceId } = await params;

    const invoice = await prisma.warehouse_invoices.findUnique({
      where: { id: invoiceId },
      select: {
        id: true,
        invoice_number: true,
        total_amount: true,
        paid_amount: true,
        payment_status: true,
        payment_date: true,
        payment_method: true,
        payment_reference: true,
        payment_notes: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'الفاتورة غير موجودة' },
        { status: 404 }
      );
    }

    const totalAmount = Number(invoice.total_amount || 0);
    const paidAmount = Number(invoice.paid_amount || 0);
    const remainingAmount = totalAmount - paidAmount;

    return NextResponse.json({
      invoice_id: invoice.id,
      invoice_number: invoice.invoice_number,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      remaining_amount: remainingAmount,
      payment_status: invoice.payment_status || 'pending',
      payment_date: invoice.payment_date?.toISOString() || null,
      payment_method: invoice.payment_method || null,
      payment_reference: invoice.payment_reference || null,
      payment_notes: invoice.payment_notes || null,
    });
  } catch (error: any) {
    console.error('[InvoicePaymentAPI] Error fetching payment info:', error);
    return NextResponse.json(
      { error: 'فشل في جلب معلومات الدفع', details: error.message },
      { status: 500 }
    );
  }
}

