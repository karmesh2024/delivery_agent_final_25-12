import { NextResponse } from 'next/server';
import prisma from '@/lib/db'; // Corrected path to Prisma Client
import { supabase } from '@/lib/supabase';

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
    const serialized: Record<string, any> = {};
    for (const [key, val] of Object.entries(value)) {
      serialized[key] = serializeBigInt(val);
    }
    return serialized;
  }

  return value;
};

export async function GET(
  request: Request,
  { params }: { params: { storeId: string; productId: string } }
) {
  try {
    const { storeId, productId } = await params;

    if (!storeId || !productId) {
      return NextResponse.json({ message: 'Store ID and Product ID are required' }, { status: 400 });
    }

    const product = await prisma.store_products.findFirst({
      where: {
        id: productId,
        shop_id: storeId,
      },
      include: {
        store_product_prices: true,
        store_product_images: true,
      },
    });

    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    // Map the Prisma model names back to the expected frontend names
    const formattedProduct = {
      ...product,
      images: product.store_product_images || [],
      prices: product.store_product_prices || [],
    };

    return NextResponse.json(serializeBigInt(formattedProduct));
  } catch (error) {
    console.error('Failed to fetch product:', error);
    return NextResponse.json({ message: 'Internal Server Error', error: (error as Error).message }, { status: 500 });
  }
}

const isValidUUID = (uuid: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export async function PUT(
  request: Request,
  { params }: { params: { storeId: string; productId: string } }
) {
  try {
    const { storeId, productId } = await params;
    const body = await request.json();

    if (!storeId || !productId) {
      return NextResponse.json({ message: 'Store ID and Product ID are required' }, { status: 400 });
    }

    const { images, prices, ...productData } = body;

    // Ensure the product belongs to the store
    const existingProduct = await prisma.store_products.findFirst({
      where: {
        id: productId,
        shop_id: storeId,
      },
    });

    if (!existingProduct) {
      return NextResponse.json({ message: 'Product not found for this store' }, { status: 404 });
    }

    // Remove store_product_prices and store_product_images from productData to avoid Prisma validation errors
    // as they are handled separately by upsert operations.
    if (productData.store_product_prices) {
      delete productData.store_product_prices;
    }
    if (productData.store_product_images) {
      delete productData.store_product_images;
    }

    // Fetch existing images to identify deletions
    const existingImagesInDb = await prisma.store_product_images.findMany({
      where: { product_id: productId },
    });

    const imagesToKeepIds = new Set(images.filter(img => img.id && isValidUUID(img.id)).map(img => img.id));

    const imagesToDelete = existingImagesInDb.filter(img => !imagesToKeepIds.has(img.id));

    // Delete images from Supabase Storage and DB
    for (const imgToDelete of imagesToDelete) {
      try {
        // Extract the path from the image_url to delete from Supabase storage
        const urlParts = imgToDelete.image_url.split('/public/');
        if (urlParts.length > 1) {
          const storagePath = urlParts[1]; // e.g., product-images/products/storeId/productId/fileName.mp4
          const bucketName = storagePath.split('/')[0]; // Extract bucket name
          const filePath = storagePath.substring(bucketName.length + 1); // Get path inside the bucket

          const { error: deleteStorageError } = await supabase.storage
            .from(bucketName)
            .remove([filePath]);

          if (deleteStorageError) {
            console.error(`Failed to delete file ${filePath} from storage bucket ${bucketName}:`, deleteStorageError);
          }
        } else {
          console.warn(`Could not parse storage path for deletion: ${imgToDelete.image_url}`);
        }

        // Delete from database
        await prisma.store_product_images.delete({
          where: { id: imgToDelete.id },
        });
      } catch (deleteError) {
        console.error(`Failed to delete image record ${imgToDelete.id} from DB or storage:`, deleteError);
      }
    }

    // Update product data
    const {
      id: _id,
      shop_id: _shopId,
      created_at: _createdAt,
      updated_at: _updatedAt,
      average_rating: _avgRating,
      ratings_count: _ratingsCount,
      store_product_images: _storeImages,
      store_product_prices: _storePrices,
      catalog_product_id,
      ...updatableFields
    } = productData;

    const dataToUpdate: any = {
      dynamic_attributes: updatableFields.dynamic_attributes ?? null,
      tags: updatableFields.tags ?? null,
    };

    if (updatableFields.name_ar !== undefined) dataToUpdate.name_ar = updatableFields.name_ar;
    if (updatableFields.name_en !== undefined) dataToUpdate.name_en = updatableFields.name_en;
    if (updatableFields.description_ar !== undefined) dataToUpdate.description_ar = updatableFields.description_ar;
    if (updatableFields.description_en !== undefined) dataToUpdate.description_en = updatableFields.description_en;
    if (updatableFields.short_description_ar !== undefined) dataToUpdate.short_description_ar = updatableFields.short_description_ar;
    if (updatableFields.short_description_en !== undefined) dataToUpdate.short_description_en = updatableFields.short_description_en;
    if (updatableFields.sku !== undefined) dataToUpdate.sku = updatableFields.sku;
    if (updatableFields.barcode !== undefined) dataToUpdate.barcode = updatableFields.barcode;
    if (updatableFields.cost_price !== undefined) dataToUpdate.cost_price = updatableFields.cost_price;
    if (updatableFields.stock_quantity !== undefined) dataToUpdate.stock_quantity = updatableFields.stock_quantity;
    if (updatableFields.min_stock_level !== undefined) dataToUpdate.min_stock_level = updatableFields.min_stock_level;
    if (updatableFields.weight !== undefined) dataToUpdate.weight = updatableFields.weight;
    if (updatableFields.dimensions !== undefined) dataToUpdate.dimensions = updatableFields.dimensions;
    if (updatableFields.loyalty_points_earned !== undefined) dataToUpdate.loyalty_points_earned = updatableFields.loyalty_points_earned;
    if (updatableFields.gift_description_ar !== undefined) dataToUpdate.gift_description_ar = updatableFields.gift_description_ar;
    if (updatableFields.gift_description_en !== undefined) dataToUpdate.gift_description_en = updatableFields.gift_description_en;
    if (updatableFields.is_active !== undefined) dataToUpdate.is_active = updatableFields.is_active;
    if (updatableFields.is_featured !== undefined) dataToUpdate.is_featured = updatableFields.is_featured;
    if (updatableFields.meta_title_ar !== undefined) dataToUpdate.meta_title_ar = updatableFields.meta_title_ar;
    if (updatableFields.meta_title_en !== undefined) dataToUpdate.meta_title_en = updatableFields.meta_title_en;
    if (updatableFields.meta_description_ar !== undefined) dataToUpdate.meta_description_ar = updatableFields.meta_description_ar;
    if (updatableFields.meta_description_en !== undefined) dataToUpdate.meta_description_en = updatableFields.meta_description_en;
    if (updatableFields.product_type_id !== undefined) {
      dataToUpdate.product_types = updatableFields.product_type_id
        ? { connect: { id: updatableFields.product_type_id } }
        : { disconnect: true };
    }
    if (updatableFields.main_category_id !== undefined) {
      dataToUpdate.store_main_categories = updatableFields.main_category_id
        ? { connect: { id: updatableFields.main_category_id } }
        : undefined;
    }
    if (updatableFields.subcategory_id !== undefined) {
      dataToUpdate.store_subcategories = updatableFields.subcategory_id
        ? { connect: { id: updatableFields.subcategory_id } }
        : { disconnect: true };
    }
    if (updatableFields.brand_id !== undefined) {
      dataToUpdate.store_brands = updatableFields.brand_id
        ? { connect: { id: updatableFields.brand_id } }
        : { disconnect: true };
    }
    if (updatableFields.measurement_unit !== undefined) dataToUpdate.measurement_unit = updatableFields.measurement_unit;
    if (updatableFields.default_selling_price !== undefined) dataToUpdate.default_selling_price = updatableFields.default_selling_price;
    if (updatableFields.default_profit_margin !== undefined) dataToUpdate.default_profit_margin = updatableFields.default_profit_margin;
    if (updatableFields.auto_calculate_prices !== undefined) dataToUpdate.auto_calculate_prices = updatableFields.auto_calculate_prices;

    if (catalog_product_id && catalog_product_id !== '' && catalog_product_id !== null) {
      const catalogId =
        typeof catalog_product_id === 'string'
          ? BigInt(catalog_product_id)
          : BigInt(catalog_product_id);
      dataToUpdate.catalog_products = { connect: { id: catalogId } };
    } else {
      dataToUpdate.catalog_products = { disconnect: true };
    }

    const updatedProduct = await prisma.store_products.update({
      where: {
        id: existingProduct.id,
      },
      data: dataToUpdate,
    });

    // Handle images update (create or update based on valid ID)
    if (images && images.length > 0) {
      for (const image of images) {
        const { id, image_url, alt_text_ar, alt_text_en, is_primary } = image;

        if (id && isValidUUID(id)) {
          // Update existing image
          await prisma.store_product_images.update({
            where: { id: id },
            data: {
              product_id: updatedProduct.id,
              image_url: image_url,
              alt_text_ar: alt_text_ar,
              alt_text_en: alt_text_en,
              is_primary: is_primary,
            },
          });
        } else {
          // Create new image
          await prisma.store_product_images.create({
            data: {
              product_id: updatedProduct.id,
              image_url: image_url,
              alt_text_ar: alt_text_ar,
              alt_text_en: alt_text_en,
              is_primary: is_primary,
            },
          });
        }
      }
    }

    // Handle prices update (upsert)
    if (prices && prices.length > 0) {
      for (const price of prices) {
        await prisma.store_product_prices.upsert({
          where: { id: price.id || 'new-price' }, // Use a dummy ID for new prices or actual ID for existing
          update: { ...price, product_id: updatedProduct.id },
          create: { ...price, product_id: updatedProduct.id, id: undefined },
        });
      }
    }

    return NextResponse.json(serializeBigInt(updatedProduct));
  } catch (error) {
    console.error('Failed to update product:', error);
    return NextResponse.json({ message: 'Internal Server Error', error: (error as Error).message }, { status: 500 });
  }
} 