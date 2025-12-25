import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import prisma from '@/lib/db';

/**
 * GET /api/products/search-warehouse-inventory?sku=XXX
 * Search for warehouse inventory by SKU or product name
 * Useful when adding a new product to check if it exists in warehouses
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sku = searchParams.get('sku');
    const name = searchParams.get('name');

    if (!sku && !name) {
      return NextResponse.json(
        { error: 'SKU or product name is required' },
        { status: 400 }
      );
    }

    // البحث أولاً في catalog_products (الكتالوج الرئيسي)
    let catalogProducts: any[] = [];
    let storeProducts: any[] = [];
    
    try {
      if (sku) {
        // البحث في catalog_products بالـ SKU باستخدام Supabase مباشرة
        const { data: catalogData, error: catalogError } = await supabase!
          .from('catalog_products')
          .select('id, sku, name, product_code')
          .ilike('sku', `%${sku}%`)
          .limit(10);
        
        if (catalogError) {
          console.error('Error fetching catalog products:', catalogError);
        } else {
          catalogProducts = catalogData || [];
        }

        // البحث في store_products بالـ SKU (للتوافق مع المنتجات القديمة)
        const storeWhere: any = { sku: { contains: sku, mode: 'insensitive' } };
        storeProducts = await prisma.store_products.findMany({
          where: storeWhere,
          select: {
            id: true,
            sku: true,
            name_ar: true,
            name_en: true,
            catalog_product_id: true,
          },
          take: 10,
        });
      } else if (name) {
        // البحث بالاسم في catalog_products باستخدام Supabase مباشرة
        const { data: catalogData, error: catalogError } = await supabase!
          .from('catalog_products')
          .select('id, sku, name, product_code')
          .ilike('name', `%${name}%`)
          .limit(10);
        
        if (catalogError) {
          console.error('Error fetching catalog products:', catalogError);
        } else {
          catalogProducts = catalogData || [];
        }

        // البحث بالاسم في store_products
        storeProducts = await prisma.store_products.findMany({
          where: {
            OR: [
              { name_ar: { contains: name, mode: 'insensitive' } },
              { name_en: { contains: name, mode: 'insensitive' } },
            ],
          },
          select: {
            id: true,
            sku: true,
            name_ar: true,
            name_en: true,
            catalog_product_id: true,
          },
          take: 10,
        });
      }
    } catch (error: any) {
      console.error('Error querying products:', error);
      // الاستمرار مع arrays فارغة
    }

    // جمع معرفات المنتجات من الكتالوج (BigInt)
    const catalogProductIds = catalogProducts.map((p) => {
      // تحويل BigInt إلى string للتخزين في Supabase
      return typeof p.id === 'bigint' ? p.id.toString() : String(p.id);
    });
    console.log('Catalog products found:', catalogProducts.length);
    console.log('Catalog product IDs:', catalogProductIds);
    
    // جمع معرفات المنتجات من المتجر (التي لا ترتبط بكتالوج)
    const storeProductIdsWithoutCatalog = storeProducts
      .filter((p) => !p.catalog_product_id)
      .map((p) => p.id);
    console.log('Store products found:', storeProducts.length);

    // البحث عن المخزون باستخدام catalog_product_id
    let catalogInventory: any[] = [];
    if (catalogProductIds.length > 0) {
      try {
        // تحويل catalogProductIds إلى numbers للبحث في Supabase
        // (Supabase يتعامل مع BigInt كـ number في PostgreSQL)
        const catalogProductIdsAsNumbers = catalogProductIds
          .map(id => {
            const parsed = parseInt(id, 10);
            if (isNaN(parsed)) {
              console.warn(`Invalid catalog_product_id: ${id}`);
              return null;
            }
            return parsed;
          })
          .filter((id): id is number => id !== null);
        
        console.log('Searching for inventory with catalog_product_ids:', catalogProductIdsAsNumbers);
        
        if (catalogProductIdsAsNumbers.length === 0) {
          console.warn('No valid catalog_product_ids to search');
        } else {
          const { data, error: catalogError } = await supabase!
            .from('warehouse_inventory')
            .select(`
              id,
              warehouse_id,
              catalog_product_id,
              quantity,
              unit,
              min_level,
              max_level,
              last_updated,
              warehouses:warehouse_id (
                id,
                name,
                location
              )
            `)
            .in('catalog_product_id', catalogProductIdsAsNumbers)
            .order('warehouse_id');

          if (catalogError) {
            // إذا كان الخطأ بسبب عدم وجود الحقل (لم يتم تطبيق migration بعد)
            if (catalogError.message?.includes('column') || catalogError.message?.includes('catalog_product_id')) {
              console.warn('catalog_product_id column not found. Migration may not be applied yet:', catalogError.message);
              // تجاهل الخطأ والاستمرار بدون نتائج من catalog_product_id
            } else {
              console.error('Error fetching catalog inventory:', catalogError);
              // لا نرمي الخطأ، بل نستمر بدون نتائج
              catalogInventory = [];
            }
          } else {
            catalogInventory = data || [];
            console.log('Found catalog inventory:', catalogInventory.length, 'items');
          }
        }
      } catch (err: any) {
        console.error('Exception while fetching catalog inventory:', err);
        // لا نرمي الخطأ، بل نستمر بدون نتائج
        catalogInventory = [];
      }
    }

    // البحث عن المخزون باستخدام store_product_id (للتوافق مع المنتجات القديمة)
    let storeInventory: any[] = [];
    if (storeProductIdsWithoutCatalog.length > 0) {
      const { data, error: storeError } = await supabase!
        .from('warehouse_inventory')
        .select(`
          id,
          warehouse_id,
          store_product_id,
          quantity,
          unit,
          min_level,
          max_level,
          last_updated,
          warehouses:warehouse_id (
            id,
            name,
            location
          )
        `)
        .in('store_product_id', storeProductIdsWithoutCatalog)
        .order('warehouse_id');

      if (storeError) {
        console.error('Error fetching store inventory:', storeError);
      } else {
        storeInventory = data || [];
      }
    }

    // دالة مساعدة لتحويل BigInt إلى string
    const serializeBigInt = (value: any): any => {
      if (typeof value === 'bigint') {
        return value.toString();
      }
      if (value === null || value === undefined) {
        return value;
      }
      if (Array.isArray(value)) {
        return value.map(serializeBigInt);
      }
      if (typeof value === 'object') {
        const serialized: any = {};
        for (const [key, val] of Object.entries(value)) {
          serialized[key] = serializeBigInt(val);
        }
        return serialized;
      }
      return value;
    };

    // دمج النتائج
    const inventoryByProduct: any[] = [];

    // إضافة مخزون منتجات الكتالوج
    catalogProducts.forEach((catalogProduct) => {
      const catalogProductId = typeof catalogProduct.id === 'bigint' 
        ? catalogProduct.id.toString() 
        : String(catalogProduct.id);
      
      console.log(`Processing catalog product ${catalogProductId}, total inventory items: ${catalogInventory.length}`);
      
      const productInventory = catalogInventory.filter(
        (inv) => {
          if (!inv.catalog_product_id) return false;
          const invCatalogId = typeof inv.catalog_product_id === 'bigint'
            ? inv.catalog_product_id.toString()
            : String(inv.catalog_product_id);
          const matches = invCatalogId === catalogProductId;
          if (matches) {
            console.log(`Found matching inventory: warehouse_id=${inv.warehouse_id}, quantity=${inv.quantity}`);
          }
          return matches;
        }
      ) || [];

      const totalQuantity = productInventory.reduce((sum, item) => {
        return sum + (parseFloat(item.quantity?.toString() || '0') || 0);
      }, 0);

      console.log(`Product ${catalogProductId} total quantity: ${totalQuantity}`);

      // تحويل productInventory لضمان عدم وجود BigInt
      const serializedInventory = productInventory.map(serializeBigInt);

      inventoryByProduct.push({
        product: {
          id: catalogProduct.id.toString(),
          sku: catalogProduct.sku,
          name_ar: catalogProduct.name,
          name_en: catalogProduct.name,
          product_code: catalogProduct.product_code,
          is_catalog: true,
        },
        total_quantity: totalQuantity,
        warehouses: serializedInventory,
      });
    });

    // إضافة مخزون منتجات المتجر (القديمة)
    storeProducts
      .filter((p) => !p.catalog_product_id)
      .forEach((storeProduct) => {
        const productInventory = storeInventory.filter(
          (inv) => inv.store_product_id === storeProduct.id
        ) || [];

        const totalQuantity = productInventory.reduce((sum, item) => {
          return sum + (parseFloat(item.quantity?.toString() || '0') || 0);
        }, 0);

        // تحويل productInventory لضمان عدم وجود BigInt
        const serializedInventory = productInventory.map(serializeBigInt);

        inventoryByProduct.push({
          product: {
            id: storeProduct.id,
            sku: storeProduct.sku,
            name_ar: storeProduct.name_ar,
            name_en: storeProduct.name_en,
            is_catalog: false,
          },
          total_quantity: totalQuantity,
          warehouses: serializedInventory,
        });
      });

    if (inventoryByProduct.length === 0) {
      return NextResponse.json({
        message: 'No products found matching the search criteria',
        products: [],
        inventory: [],
      });
    }

    // تحويل جميع البيانات لضمان عدم وجود BigInt
    const serializedCatalogProducts = catalogProducts.map(p => ({
      ...p,
      id: typeof p.id === 'bigint' ? p.id.toString() : String(p.id),
    }));

    const serializedStoreProducts = storeProducts.map(p => ({
      ...p,
      catalog_product_id: p.catalog_product_id 
        ? (typeof p.catalog_product_id === 'bigint' ? p.catalog_product_id.toString() : String(p.catalog_product_id))
        : null,
    }));

    return NextResponse.json({
      products: [...serializedCatalogProducts, ...serializedStoreProducts],
      inventory: inventoryByProduct,
    });
  } catch (error) {
    console.error('Error in search warehouse inventory API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error stack:', errorStack);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: errorMessage,
        message: 'فشل جلب بيانات المخزون. تأكد من تطبيق migration لإضافة catalog_product_id إلى warehouse_inventory.'
      },
      { status: 500 }
    );
  }
}

