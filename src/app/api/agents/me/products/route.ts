import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/agents/me/products?shop_id=...&audience_id=...
// ملاحظة: حتى يتم ربط الوكيل بالمتجر لاحقًا، نعتمد الآن على تمرير shop_id و audience_id صراحةً
// سياسة اختيار السعر: سعر جمهور الوكيل أولًا، وإن لم يوجد فالسعر العام (target_audience_id IS NULL)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get('shop_id');
    const audienceId = searchParams.get('audience_id'); // جمهور الوكيل

    if (!shopId) {
      return NextResponse.json({ message: 'Missing shop_id' }, { status: 400 });
    }

    const products = await prisma.store_products.findMany({
      where: { shop_id: shopId, is_active: true },
      include: {
        store_product_images: {
          where: { is_primary: true },
          take: 1,
        },
        store_product_prices: {
          where: {
            OR: [
              audienceId ? { target_audience_id: audienceId } : undefined,
              { target_audience_id: null },
            ].filter(Boolean) as any,
          },
          orderBy: [
            // إعطاء أولوية لسعر الجمهور ثم العام
            { target_audience_id: 'desc' },
            { effective_from: 'desc' },
          ],
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // تجهيز استجابة مبسطة للموبايل
    const data = products.map((p) => {
      const audiencePrice = audienceId
        ? p.store_product_prices.find((pr) => pr.target_audience_id === audienceId)
        : undefined;
      const publicPrice = p.store_product_prices.find((pr) => pr.target_audience_id === null);
      const chosenPrice = audiencePrice ?? publicPrice ?? null;

      return {
        id: p.id,
        shop_id: p.shop_id,
        name_ar: p.name_ar,
        name_en: p.name_en,
        sku: p.sku,
        stock_quantity: p.stock_quantity,
        is_active: p.is_active,
        primary_image_url: p.store_product_images?.[0]?.image_url || null,
        price: chosenPrice
          ? {
              value: chosenPrice.price?.toString?.() ?? null,
              type: chosenPrice.price_type || 'selling',
              is_on_sale: chosenPrice.is_on_sale ?? false,
              sale_price: chosenPrice.sale_price?.toString?.() ?? null,
              min_price: chosenPrice.min_price?.toString?.() ?? null,
              max_discount_percentage: chosenPrice.max_discount_percentage?.toString?.() ?? null,
              is_negotiable: chosenPrice.is_negotiable ?? false,
              effective_from: chosenPrice.effective_from,
              effective_to: chosenPrice.effective_to,
              price_name_ar: chosenPrice.price_name_ar,
              price_name_en: chosenPrice.price_name_en,
              target_audience_id: chosenPrice.target_audience_id,
            }
          : null,
      };
    });

    return NextResponse.json({ items: data });
  } catch (error) {
    console.error('[API] /api/agents/me/products error:', error);
    return NextResponse.json({ message: 'Failed to fetch agent products' }, { status: 500 });
  }
}


