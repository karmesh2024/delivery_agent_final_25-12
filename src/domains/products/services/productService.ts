import prisma from '@/lib/db';
import { Product } from '@/domains/products/types/types';
import { Prisma } from '@prisma/client';

export const fetchAllProducts = async (): Promise<Product[]> => {
  try {
    const products = await prisma.store_products.findMany({
      include: {
        store_product_images: true,
      },
    });
    return products as Product[];
  } catch (error) {
    console.error('Error fetching all products:', error);
    throw error;
  }
};

export const fetchProductById = async (productId: string): Promise<Product | null> => {
  try {
    const product = await prisma.store_products.findUnique({
      where: {
        id: productId,
      },
      include: {
        store_product_images: true,
      },
    });
    return product as Product | null;
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    throw error;
  }
};

export const fetchProductsByStoreId = async (storeId: string): Promise<Product[]> => {
  try {
    const products = await prisma.store_products.findMany({
      where: {
        shop_id: storeId,
      },
    });
    return products as Product[];
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const addProduct = async (product: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'average_rating' | 'ratings_count' | 'store_product_images' | 'store_product_prices'>): Promise<Product> => {
  try {
    console.log('[Product Service] addProduct - Received product data:', product);

    const {
      shop_id,
      main_category_id,
      product_type_id,
      subcategory_id,
      brand_id,
      catalog_product_id,
      dimensions,
      tags,
      dynamic_attributes,
      ...rest
    } = product;

    // التحقق من أن main_category_id موجود وصالح
    if (!main_category_id || main_category_id.trim() === '') {
      throw new Error('main_category_id مطلوب ولا يمكن أن يكون فارغاً');
    }

    // إزالة catalog_product_id من rest إذا كان موجوداً (لأننا نستخدم relation فقط)
    const { catalog_product_id: _, ...restWithoutCatalogId } = rest;

    const data: Prisma.store_productsCreateInput = {
      ...restWithoutCatalogId,
      // لا نستخدم catalog_product_id مباشرة، بل نستخدم relation فقط
      dimensions: dimensions === null ? Prisma.JsonNull : dimensions,
      tags: tags === null ? undefined : tags,
      dynamic_attributes: dynamic_attributes === null ? Prisma.JsonNull : dynamic_attributes,
      store_shops: {
        connect: { id: shop_id },
      },
      store_main_categories: {
        connect: { id: main_category_id },
      },
      tags: Array.isArray(tags) ? tags : [],
      ...(product_type_id && {
        product_types: {
          connect: { id: product_type_id },
        },
      }),
      ...(subcategory_id && {
        store_subcategories: {
          connect: { id: subcategory_id },
        },
      }),
      ...(brand_id && {
        store_brands: {
          connect: { id: brand_id },
        },
      }),
      ...(catalog_product_id && catalog_product_id !== '' && catalog_product_id !== null && {
        catalog_products: {
          connect: { id: BigInt(catalog_product_id) },
        },
      }),
    };
    console.log('[Product Service] addProduct - Data for Prisma create:', data);
    const newProduct = await prisma.store_products.upsert({
      where: {
        shop_id_sku: {
          shop_id: shop_id,
          sku: rest.sku,
        },
      },
      update: data,
      create: data,
    });
    console.log('[Product Service] addProduct - Prisma create response:', newProduct);
    return newProduct as Product;
  } catch (error) {
    console.error('[Product Service] Error adding product:', error);
    throw error;
  }
};

export const updateProduct = async (product: Omit<Product, 'store_product_images' | 'store_product_prices'>): Promise<Product> => {
  try {
    const {
      shop_id,
      main_category_id,
      dimensions,
      tags,
      product_type_id,
      catalog_product_id,
      subcategory_id,
      brand_id,
      dynamic_attributes,
      ...rest
    } = product;
    
    // إزالة catalog_product_id من rest إذا كان موجوداً (لأننا نستخدم relation فقط)
    const { catalog_product_id: _, ...restWithoutCatalogId } = rest;
    
    const data: Prisma.store_productsUpdateInput = {
      ...restWithoutCatalogId,
      // لا نستخدم catalog_product_id مباشرة، بل نستخدم relation فقط
      dimensions: dimensions === null ? Prisma.JsonNull : dimensions,
      tags: tags === null ? undefined : tags,
      tags: Array.isArray(tags) ? tags : [],
      ...(product_type_id && {
        product_types: {
          connect: { id: product_type_id },
        },
      }),
      ...(subcategory_id && {
        store_subcategories: {
          connect: { id: subcategory_id },
        },
      }),
      ...(brand_id && {
        store_brands: {
          connect: { id: brand_id },
        },
      }),
      ...(catalog_product_id && catalog_product_id !== '' && catalog_product_id !== null && {
        catalog_products: {
          connect: { id: BigInt(catalog_product_id) },
        },
      }),
      dynamic_attributes: dynamic_attributes === null ? Prisma.JsonNull : dynamic_attributes,
      store_shops: {
        connect: { id: shop_id },
      },
      store_main_categories: {
        connect: { id: main_category_id ?? '' },
      },
    };
    const updatedProduct = await prisma.store_products.update({
      where: {
        id: product.id,
      },
      data,
    });
    return updatedProduct as Product;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

export const deleteProduct = async (productId: string): Promise<void> => {
  try {
    await prisma.store_products.delete({
      where: {
        id: productId,
      },
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
}; 