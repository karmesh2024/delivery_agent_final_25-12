import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import prisma from '@/lib/db';

/**
 * GET /api/products/[productId]/warehouse-inventory
 * Get warehouse inventory quantities for a specific store product
 * Supports querying by productId or SKU
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const { productId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const sku = searchParams.get('sku');

    if (!productId && !sku) {
      return NextResponse.json(
        { error: 'Product ID or SKU is required' },
        { status: 400 }
      );
    }

    let storeProductId = productId;

    // If SKU is provided, find the product by SKU
    if (sku && !productId) {
      const product = await prisma.store_products.findFirst({
        where: { sku },
        select: { id: true },
      });

      if (!product) {
        return NextResponse.json(
          { error: 'Product not found with the provided SKU' },
          { status: 404 }
        );
      }

      storeProductId = product.id;
    }

    // Get warehouse inventory for this product
    const { data: inventory, error } = await supabase!
      .from('warehouse_inventory')
      .select(`
        id,
        warehouse_id,
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
      .eq('store_product_id', storeProductId)
      .order('warehouse_id');

    if (error) {
      console.error('Error fetching warehouse inventory:', error);
      return NextResponse.json(
        { error: 'Failed to fetch warehouse inventory', details: error.message },
        { status: 500 }
      );
    }

    // Calculate total quantity across all warehouses
    const totalQuantity = inventory?.reduce((sum, item) => {
      return sum + (parseFloat(item.quantity?.toString() || '0') || 0);
    }, 0) || 0;

    return NextResponse.json({
      product_id: storeProductId,
      total_quantity: totalQuantity,
      warehouses: inventory || [],
      count: inventory?.length || 0,
    });
  } catch (error) {
    console.error('Error in warehouse inventory API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}

