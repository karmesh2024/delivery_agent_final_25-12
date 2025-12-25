import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import prisma from '@/lib/db';

/**
 * GET /api/catalog/products?limit=4
 * جلب منتجات الكتالوج (مع إمكانية تحديد الحد الأقصى)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit');
    const search = searchParams.get('search');

    const limitNum = limit ? parseInt(limit, 10) : undefined;
    const takeLimit = limitNum && !isNaN(limitNum) && limitNum > 0 ? limitNum : undefined;

    const where = search
      ? {
          OR: [
            { sku: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
          ],
        }
      : undefined;

    const products = await prisma.catalog_products.findMany({
      where,
      select: {
        id: true,
        sku: true,
        name: true,
        product_code: true,
        description: true,
        images: true,
      },
      orderBy: { created_at: 'desc' },
      take: takeLimit,
    });

    // جلب الكميات من المخازن لكل منتج
    const catalogProductIds = products.map((p) => p.id);
    const inventoryData = catalogProductIds.length > 0
      ? await prisma.warehouse_inventory.findMany({
          where: {
            catalog_product_id: { in: catalogProductIds },
          },
          select: {
            catalog_product_id: true,
            quantity: true,
            warehouse_id: true,
          },
        })
      : [];

    // تجميع الكميات حسب catalog_product_id
    const inventoryByProduct = new Map<string, number>();
    inventoryData.forEach((inv) => {
      const productId = inv.catalog_product_id?.toString();
      if (productId) {
        const currentQty = inventoryByProduct.get(productId) || 0;
        const qty = Number(inv.quantity || 0);
        inventoryByProduct.set(productId, currentQty + qty);
      }
    });

    // تحويل BigInt إلى string ومعالجة الصور
    const serializedProducts = products.map((p) => {
      // معالجة الصور - قد تكون JSON array أو string
      let productImages: string[] = [];
      if (p.images) {
        try {
          if (typeof p.images === 'string') {
            productImages = JSON.parse(p.images);
          } else if (Array.isArray(p.images)) {
            productImages = p.images;
          }
        } catch (e) {
          console.error('Error parsing images:', e);
        }
      }

      return {
        id: p.id.toString(),
        sku: p.sku,
        name: p.name,
        product_code: p.product_code,
        description: p.description,
        image_url: productImages.length > 0 ? productImages[0] : null,
        total_quantity: inventoryByProduct.get(p.id.toString()) || 0,
      };
    });

    return NextResponse.json({ products: serializedProducts });
  } catch (error: any) {
    console.error('[CatalogAPI] Error fetching products:', error);
    return NextResponse.json(
      { error: 'فشل في جلب منتجات الكتالوج', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/catalog/products
 * إضافة منتج جديد للكتالوج
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sku, product_code, name, description, warehouse_id } = body;

    // التحقق من البيانات المطلوبة
    if (!sku || !name) {
      return NextResponse.json(
        { error: 'SKU واسم المنتج مطلوبان' },
        { status: 400 }
      );
    }

    // التحقق من عدم وجود SKU مكرر
    const existing = await prisma.catalog_products.findUnique({
      where: { sku },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'هذا الـ SKU موجود بالفعل في الكتالوج' },
        { status: 400 }
      );
    }

    // توليد product_code إذا لم يتم إدخاله
    const finalProductCode = product_code || `PRD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // إنشاء المنتج
    const newProduct = await prisma.catalog_products.create({
      data: {
        sku,
        product_code: finalProductCode,
        name,
        description: description || null,
        warehouse_id: warehouse_id ? Number(warehouse_id) : null,
      },
    });

    return NextResponse.json({
      id: newProduct.id.toString(),
      sku: newProduct.sku,
      name: newProduct.name,
      product_code: newProduct.product_code,
      description: newProduct.description,
    });
  } catch (error: any) {
    console.error('[CatalogAPI] Error creating product:', error);
    
    // معالجة أخطاء Prisma
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'هذا الـ SKU أو product_code موجود بالفعل' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'فشل في إضافة المنتج للكتالوج', details: error.message },
      { status: 500 }
    );
  }
}
