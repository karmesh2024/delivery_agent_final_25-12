import { supabase } from '@/lib/supabase';

export interface WarehouseInventoryRow {
  id: number;
  warehouse_id: number;
  product_id: string;
  quantity: number;
  unit: string | null;
  min_level: number | null;
  max_level: number | null;
  last_updated: string | null;
}

export interface InventoryMovementRow {
  id: number;
  warehouse_id: number;
  product_id: string;
  movement_type: string; // IN | OUT | ADJUST
  quantity: number;
  unit: string | null;
  price: number | null;
  source_type: string | null;
  source_id: string | null;
  created_at: string | null;
}

export const inventoryService = {
  async getWarehouseInventory(warehouseId: number) {
    const { data, error } = await supabase!
      .from('warehouse_inventory')
      .select('*')
      .eq('warehouse_id', warehouseId)
      .order('product_id');
    if (error) throw error;
    return data as unknown as WarehouseInventoryRow[];
  },

  async getRecentMovements(warehouseId: number, limit = 20) {
    const { data, error } = await supabase!
      .from('inventory_movements')
      .select('*')
      .eq('warehouse_id', warehouseId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data as unknown as InventoryMovementRow[];
  },

  /**
   * Get warehouse inventory for a store product by product ID
   */
  async getInventoryByStoreProductId(storeProductId: string) {
    const { data, error } = await supabase!
      .from('warehouse_inventory')
      .select(`
        *,
        warehouses:warehouse_id (
          id,
          name,
          location
        )
      `)
      .eq('store_product_id', storeProductId)
      .order('warehouse_id');
    if (error) throw error;
    return data;
  },

  /**
   * Get warehouse inventory for a store product by SKU
   */
  async getInventoryBySKU(sku: string) {
    // First, find the product by SKU
    const { data: products, error: productError } = await supabase!
      .from('store_products')
      .select('id')
      .eq('sku', sku)
      .limit(1);

    if (productError || !products || products.length === 0) {
      return [];
    }

    const storeProductId = products[0].id;
    return this.getInventoryByStoreProductId(storeProductId);
  },

  /**
   * Get total inventory quantity across all warehouses for a store product
   */
  async getTotalInventoryByStoreProductId(storeProductId: string): Promise<number> {
    const inventory = await this.getInventoryByStoreProductId(storeProductId);
    return inventory.reduce((sum, item) => {
      return sum + (parseFloat(item.quantity?.toString() || '0') || 0);
    }, 0);
  },

  async recordInMovement(params: {
    warehouse_id: number;
    product_id?: string | null;
    catalog_product_id?: string | number | null;
    quantity: number;
    unit?: string | null;
    price?: number | null;
    source_type?: string | null;
    source_id?: string | null;
  }) {
    const { warehouse_id, product_id, catalog_product_id, quantity, unit, price, source_type, source_id } = params;
    
    try {
      // 1) سجل الحركة (inventory_movements لا يدعم catalog_product_id حالياً، لذا نستخدم product_id إذا كان متوفراً)
      const { error: movementError } = await supabase!
      .from('inventory_movements')
        .insert([{ 
          warehouse_id, 
          product_id: product_id ?? null, 
          movement_type: 'in', // يجب أن يكون بأحرف صغيرة: 'in' أو 'out'
          quantity, 
          unit: unit ?? null, 
          price: price ?? null, 
          source_type: source_type ?? 'invoice', 
          source_id: source_id ?? null 
        }]);

      if (movementError) {
        console.error('Error inserting inventory movement:', movementError);
        throw new Error(`فشل تسجيل حركة المخزون: ${movementError.message}`);
      }

    // 2) حدث/أنشئ صف المخزون
      // استخدام catalog_product_id إذا كان متوفراً، وإلا استخدام product_id
      let existing;
      if (catalog_product_id) {
        const catalogId = typeof catalog_product_id === 'string' ? parseInt(catalog_product_id, 10) : catalog_product_id;
        if (isNaN(catalogId)) {
          throw new Error(`قيمة catalog_product_id غير صحيحة: ${catalog_product_id}`);
        }
        
        const { data, error: selectError } = await supabase!
          .from('warehouse_inventory')
          .select('id, quantity')
          .eq('warehouse_id', warehouse_id)
          .eq('catalog_product_id', catalogId)
          .maybeSingle();
        
        if (selectError) {
          console.error('Error selecting existing inventory:', selectError);
          throw new Error(`فشل البحث عن المخزون الموجود: ${selectError.message}`);
        }
        
        existing = data;
      } else if (product_id) {
        const { data, error: selectError } = await supabase!
      .from('warehouse_inventory')
      .select('id, quantity')
      .eq('warehouse_id', warehouse_id)
      .eq('product_id', product_id)
      .maybeSingle();
        
        if (selectError) {
          console.error('Error selecting existing inventory:', selectError);
          throw new Error(`فشل البحث عن المخزون الموجود: ${selectError.message}`);
        }
        
        existing = data;
      } else {
        throw new Error('يجب توفير product_id أو catalog_product_id');
      }

    if (existing) {
        const newQuantity = (parseFloat(existing.quantity?.toString() || '0') || 0) + quantity;
        const { error: updateError } = await supabase!
        .from('warehouse_inventory')
          .update({ 
            quantity: newQuantity, 
            last_updated: new Date().toISOString(), 
            unit: unit ?? null 
          })
        .eq('id', existing.id);
        
        if (updateError) {
          console.error('Error updating inventory:', updateError);
          throw new Error(`فشل تحديث المخزون: ${updateError.message}`);
        }
    } else {
        const insertData: any = {
          warehouse_id,
          quantity,
          unit: unit ?? null,
          last_updated: new Date().toISOString()
        };
        
        if (catalog_product_id) {
          const catalogId = typeof catalog_product_id === 'string' ? parseInt(catalog_product_id, 10) : catalog_product_id;
          if (isNaN(catalogId)) {
            throw new Error(`قيمة catalog_product_id غير صحيحة: ${catalog_product_id}`);
          }
          insertData.catalog_product_id = catalogId;
        } else if (product_id) {
          insertData.product_id = product_id;
        }
        
        const { error: insertError } = await supabase!
        .from('warehouse_inventory')
          .insert([insertData]);
        
        if (insertError) {
          console.error('Error inserting inventory:', insertError);
          throw new Error(`فشل إضافة المخزون: ${insertError.message}`);
        }
    }

    return true;
    } catch (error: any) {
      console.error('Error in recordInMovement:', error);
      throw error;
    }
  },
};

export default inventoryService;