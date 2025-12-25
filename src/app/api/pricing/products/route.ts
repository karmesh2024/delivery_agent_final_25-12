import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentAdminId, getCurrentUserId } from '@/lib/auth/get-current-user';
import { checkPricingPermission, PRICING_PERMISSIONS } from '@/lib/permissions/purchasing-permissions';

/**
 * POST /api/pricing/products
 * حفظ أسعار المنتجات (product_pricing)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[PricingProductsAPI] POST request received');
    
    const adminId = await getCurrentAdminId(request);
    
    console.log('[PricingProductsAPI] POST: Admin ID from request:', adminId);
    
    if (!adminId) {
      console.warn('[PricingProductsAPI] POST: No admin ID found in request');
      return NextResponse.json(
        { error: 'يجب تسجيل الدخول أولاً' },
        { status: 401 }
      );
    }
    
    // التحقق من صلاحية تعيين الأسعار
    console.log('[PricingProductsAPI] POST: Checking permission for admin:', adminId);
    const hasPermission = await checkPricingPermission(adminId, 'SET_PRICING');
    console.log('[PricingProductsAPI] POST: Permission check result:', hasPermission);
    
    if (!hasPermission) {
      console.warn(`[PricingProductsAPI] Admin ${adminId} does not have SET_PRICING permission`);
      return NextResponse.json(
        { error: 'ليس لديك صلاحية لتعيين الأسعار' },
        { status: 403 }
      );
    }
    
    console.log('[PricingProductsAPI] POST: Permission check passed for admin:', adminId);

    // الحصول على user_id من auth.users
    const userId = await getCurrentUserId(request);
    console.log('[PricingProductsAPI] POST: User ID from request:', userId);

    const body = await request.json();
    const { invoice_item_id, customer_type, selling_price, notes, created_by } = body;

    // التحقق من البيانات المطلوبة
    if (!invoice_item_id || !customer_type || !selling_price) {
      return NextResponse.json(
        { error: 'بيانات ناقصة: invoice_item_id, customer_type, selling_price مطلوبة' },
        { status: 400 }
      );
    }

    // جلب عنصر الفاتورة
    const invoiceItem = await prisma.warehouse_invoice_items.findUnique({
      where: { id: invoice_item_id },
      select: {
        unit_price: true,
      },
    });

    if (!invoiceItem) {
      return NextResponse.json(
        { error: 'عنصر الفاتورة غير موجود' },
        { status: 404 }
      );
    }

    // استخدام cost_price المرسل أو unit_price من قاعدة البيانات
    const costPrice = body.cost_price 
      ? parseFloat(body.cost_price) 
      : parseFloat(invoiceItem.unit_price.toString());
    
    if (costPrice <= 0) {
      return NextResponse.json(
        { error: 'سعر التكلفة غير صحيح. يرجى إدخال سعر التكلفة أولاً' },
        { status: 400 }
      );
    }

    const sellingPrice = parseFloat(selling_price);

    // حساب هامش الربح ونسبة الربح
    const profitMargin = sellingPrice - costPrice;
    const markupPercentage = costPrice > 0 ? ((profitMargin / costPrice) * 100) : 0;

    // التحقق من وجود تسعير سابق لنفس العنصر ونوع العميل
    const existingPricing = await prisma.product_pricing.findFirst({
      where: {
        invoice_item_id,
        customer_type: customer_type as any,
        status: {
          in: ['draft', 'pending_approval', 'approved', 'active'],
        },
      },
    });

    let pricing;

    if (existingPricing) {
      // تحديث التسعير الموجود
      pricing = await prisma.product_pricing.update({
        where: { id: existingPricing.id },
        data: {
          cost_price: costPrice,
          selling_price: sellingPrice,
          markup_percentage: markupPercentage,
          profit_margin: profitMargin,
          status: 'draft',
          notes: notes || null,
          updated_at: new Date(),
        },
      });
    } else {
      // إنشاء تسعير جديد
      pricing = await prisma.product_pricing.create({
        data: {
          invoice_item_id,
          customer_type: customer_type as any,
          cost_price: costPrice,
          selling_price: sellingPrice,
          markup_percentage: markupPercentage,
          profit_margin: profitMargin,
          status: 'draft',
          notes: notes || null,
          created_by: userId || created_by || null,
        },
      });
    }

    console.log('[PricingProductsAPI] POST: Pricing saved successfully:', {
      id: pricing.id,
      invoice_item_id: pricing.invoice_item_id,
      customer_type: pricing.customer_type,
      cost_price: pricing.cost_price.toString(),
      selling_price: pricing.selling_price.toString(),
    });

    return NextResponse.json({
      ...pricing,
      cost_price: pricing.cost_price.toString(),
      selling_price: pricing.selling_price.toString(),
      markup_percentage: pricing.markup_percentage.toString(),
      profit_margin: pricing.profit_margin.toString(),
    });
  } catch (error) {
    console.error('[PricingProductsAPI] POST: Error saving product pricing:', error);
    console.error('[PricingProductsAPI] POST: Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      {
        error: 'فشل في حفظ تسعير المنتج',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/pricing/products
 * جلب أسعار المنتجات
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const invoice_item_id = searchParams.get('invoice_item_id');
    const customer_type = searchParams.get('customer_type');
    const status = searchParams.get('status');

    const where: any = {};

    if (invoice_item_id) {
      where.invoice_item_id = invoice_item_id;
    }

    if (customer_type) {
      where.customer_type = customer_type;
    }

    if (status) {
      where.status = status;
    }

    const pricings = await prisma.product_pricing.findMany({
      where,
      include: {
        warehouse_invoice_items: {
          include: {
            catalog_products: {
              select: {
                id: true,
                name_ar: true,
                name_en: true,
                sku: true,
              },
            },
            store_products: {
              select: {
                id: true,
                name_ar: true,
                name_en: true,
                sku: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    const serializedPricings = pricings.map((pricing) => ({
      ...pricing,
      cost_price: pricing.cost_price.toString(),
      selling_price: pricing.selling_price.toString(),
      markup_percentage: pricing.markup_percentage.toString(),
      profit_margin: pricing.profit_margin.toString(),
    }));

    return NextResponse.json(serializedPricings);
  } catch (error) {
    console.error('Error fetching product pricings:', error);
    return NextResponse.json(
      {
        error: 'فشل في جلب أسعار المنتجات',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

