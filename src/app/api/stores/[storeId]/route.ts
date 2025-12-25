import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole as supabase } from '@/lib/supabase';
import prisma from '@/lib/db';
import { JsonValue } from '@prisma/client/runtime/library';
import { cleanImagePath } from '@/domains/stores/components/FileUploadFix';

// Define an interface that extends the store_shops model with optional fields
interface StoreWithOptionalFields {
  id: string;
  created_at: Date | null;
  updated_at: Date | null;
  is_active: boolean;
  settings: JsonValue;
  name_ar: string;
  name_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  logo_path: string | null;
  cover_path: string | null;
  slug: string;
  // sort_order has been removed as it does not exist in the prisma schema
}

/**
 * GET /api/stores/[storeId]
 * Fetches a single store by its ID
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ storeId: string }> | { storeId: string } }
) {
    try {
        // Handle both Next.js 15 (Promise) and Next.js 14 (direct) params
        const resolvedParams = params instanceof Promise ? await params : params;
        const { storeId } = resolvedParams;
        
        console.log('[GET API] Received params:', resolvedParams);
    console.log('[GET API] storeId from params:', storeId);
    
        if (!storeId) {
            return NextResponse.json({ message: 'Store ID is required' }, { status: 400 });
        }
        
        const store = await prisma.store_shops.findUnique({
            where: { id: storeId },
        }) as unknown as StoreWithOptionalFields;

        if (!store) {
            return NextResponse.json({ message: 'Store not found' }, { status: 404 });
        }
        
        // Clean paths before generating URLs
        const cleanedLogoPath = cleanImagePath(store.logo_path);
        const cleanedCoverPath = cleanImagePath(store.cover_path);
        
        // Construct the public URLs if paths exist
        const logo_url = cleanedLogoPath && supabase
            ? supabase.storage.from('stores').getPublicUrl(cleanedLogoPath).data.publicUrl
            : null;
            
        const cover_url = cleanedCoverPath && supabase
            ? supabase.storage.from('stores').getPublicUrl(cleanedCoverPath).data.publicUrl
            : null;

        // Return a properly serialized response
        return NextResponse.json({
            id: store.id,
            name_ar: store.name_ar,
            name_en: store.name_en,
            description_ar: store.description_ar,
            description_en: store.description_en,
            logo_path: cleanedLogoPath,
            logo_url,
            cover_path: cleanedCoverPath,
            cover_url,
            slug: store.slug,
            is_active: store.is_active,
            // sort_order removed from response
            settings: store.settings || {},
            created_at: store.created_at ? store.created_at.toISOString() : null,
            updated_at: store.updated_at ? store.updated_at.toISOString() : null,
        });
    } catch (error) {
        console.error('[STORE_GET_API] Error:', error);
        const err = error as Error;
        return NextResponse.json({ message: 'Failed to fetch store', error: err.message }, { status: 500 });
    }
}

/**
 * PATCH /api/stores/[storeId]
 * Updates a store's details
 * Supports partial updates with only the fields that need to be changed
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> | { storeId: string } }
) {
  try {
    // Handle both Next.js 15 (Promise) and Next.js 14 (direct) params
    const resolvedParams = params instanceof Promise ? await params : params;
    const { storeId } = resolvedParams;
  
    if (!storeId) {
        return NextResponse.json({ message: 'Store ID is required' }, { status: 400 });
    }
    
    const body = await request.json();
    // Destructure all expected updatable fields from the body
    const { 
      name_ar, 
      name_en, 
      description_ar, 
      description_en, 
      slug, 
      logo_path,
      cover_path,
      is_active,
      // sort_order removed
      settings
    } = body;

    // Clean logo and cover paths to prevent URL duplication
    const cleanedLogoPath = logo_path ? cleanImagePath(logo_path) : undefined;
    const cleanedCoverPath = cover_path ? cleanImagePath(cover_path) : undefined;

    // Build the update data object with only defined fields
    const updateData = {
      ...(name_ar !== undefined && { name_ar }),
      ...(name_en !== undefined && { name_en }),
      ...(description_ar !== undefined && { description_ar }),
      ...(description_en !== undefined && { description_en }),
      ...(slug !== undefined && { slug }),
      ...(logo_path !== undefined && { logo_path: cleanedLogoPath }),
      ...(cover_path !== undefined && { cover_path: cleanedCoverPath }),
      ...(is_active !== undefined && { is_active }),
      // sort_order has been removed from updateData
      ...(settings !== undefined && { settings })
    };

    const updatedStore = await prisma.store_shops.update({
      where: { id: storeId },
      data: updateData,
    });

    return NextResponse.json(updatedStore);
  } catch (error) {
    console.error('[STORE_PATCH_API] Error:', error);
    const err = error as Error;
    return NextResponse.json({ message: 'Failed to update store', error: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/stores/[storeId]
 * Deletes a store
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> | { storeId: string } }
) {
  try {
    // Handle both Next.js 15 (Promise) and Next.js 14 (direct) params
    const resolvedParams = params instanceof Promise ? await params : params;
    const { storeId } = resolvedParams;
  
  console.log(`[DELETE API] Received request to delete store: ${storeId}`);
  
    if (!storeId) {
        console.log('[DELETE API] No storeId provided');
        return NextResponse.json({ message: 'Store ID is required' }, { status: 400 });
    }
    
    console.log(`[DELETE API] Converting storeId string to valid UUID format: ${storeId}`);
    
    // Ensure storeId is valid UUID format - prisma is strict about UUID validation
    try {
      // Basic validation to ensure it's a valid UUID
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(storeId)) {
        console.log(`[DELETE API] Invalid UUID format: ${storeId}`);
        return NextResponse.json({ message: 'Invalid store ID format' }, { status: 400 });
      }
    } catch (error) {
      console.error('[DELETE API] Error validating UUID:', error);
      return NextResponse.json({ message: 'Invalid store ID format' }, { status: 400 });
    }

    // Check if the store exists first
    console.log(`[DELETE API] Finding store with ID: ${storeId}`);
    const store = await prisma.store_shops.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      console.log(`[DELETE API] Store not found: ${storeId}`);
      return NextResponse.json({ message: 'Store not found' }, { status: 404 });
    }

    console.log(`[DELETE API] Found store: ${store.name_ar} (${storeId})`);

    // Check for related records that might prevent deletion
    console.log(`[DELETE API] Checking for related products for store: ${storeId}`);
    const relatedProducts = await prisma.store_products.count({
      where: { shop_id: storeId },
    });

    console.log(`[DELETE API] Found ${relatedProducts} related products`);

    if (relatedProducts > 0) {
      console.log(`[DELETE API] Cannot delete store with related products: ${storeId}`);
      return NextResponse.json({ 
        message: 'لا يمكن حذف المتجر لأنه يحتوي على منتجات مرتبطة. قم بحذف المنتجات أولاً.',
        error: 'RELATED_RECORDS_EXIST' 
      }, { status: 409 });
    }

    // Try to delete the store
    console.log(`[DELETE API] Attempting to delete store: ${storeId}`);
    const deleteResult = await prisma.store_shops.delete({
      where: { id: storeId },
    });

    console.log(`[DELETE API] Store deleted successfully: ${storeId}`, deleteResult);
    return NextResponse.json({ success: true, message: 'تم الحذف بنجاح' }, { status: 200 }); // Changed from 204 to 200 to allow response body
  } catch (error) {
    console.error('[DELETE API] Error details:', error);
    
    // Check for foreign key constraint violation
    const err = error as Error;
    const errorMessage = err.message || '';
    
    if (errorMessage.includes('Foreign key constraint failed') || 
        errorMessage.includes('violates foreign key constraint')) {
      return NextResponse.json({ 
        message: 'لا يمكن حذف المتجر لأنه مستخدم في سجلات أخرى في النظام.',
        error: 'FOREIGN_KEY_CONSTRAINT',
        details: errorMessage
      }, { status: 409 });
    }
    
    return NextResponse.json({ 
      message: 'فشل حذف المتجر', 
      error: errorMessage 
    }, { status: 500 });
  }
} 