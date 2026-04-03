/**
 * إعدادات النقاط للمتجر فقط — منفصلة عن المخلفات (points_configurations).
 * يطبق على الفئات الرئيسية/الفرعية/المنتجات للمتجر دون تداخل مع إعدادات المخلفات.
 */

import { supabase } from '@/lib/supabase';
import type {
  StorePointsConfiguration,
  StorePointsConfigurationFormData,
} from '../types';

function getSupabase() {
  if (!supabase) throw new Error('Supabase client is not initialized');
  return supabase;
}

export const storePointsConfigService = {
  async getStorePointsConfigurations(): Promise<StorePointsConfiguration[]> {
    const client = getSupabase();
    const { data, error } = await client
      .from('store_points_configurations')
      .select(`
        *,
        store_subcategories:store_subcategory_id (
          id,
          name_ar,
          store_main_categories:main_category_id (
            id,
            name_ar
          )
        ),
        store_products:store_product_id (
          id,
          name_ar
        )
      `)
      .order('store_subcategory_id', { ascending: true });

    if (error) throw error;

    return (data || []).map((row: any) => ({
      ...row,
      store_subcategory_name: row.store_subcategories?.name_ar,
      store_main_category_name: row.store_subcategories?.store_main_categories?.name_ar,
      store_product_name: row.store_products?.name_ar ?? null,
    })) as StorePointsConfiguration[];
  },

  async createStorePointsConfiguration(
    config: StorePointsConfigurationFormData
  ): Promise<StorePointsConfiguration> {
    const { data, error } = await getSupabase()
      .from('store_points_configurations')
      .insert({
        store_subcategory_id: config.store_subcategory_id,
        store_product_id: config.store_product_id ?? null,
        points_strategy: config.points_strategy ?? 'WEIGHT_BASED',
        points_per_kg: config.points_per_kg ?? 0,
        points_per_kg_applies_to: config.points_per_kg_applies_to ?? 'both',
        price_per_kg: config.price_per_kg ?? 0,
        point_value: config.point_value ?? 0,
        points_per_piece: config.points_per_piece ?? 0,
        point_value_per_piece: config.point_value_per_piece ?? 0,
        is_active: config.is_active ?? true,
        min_weight: config.min_weight ?? 0,
        max_weight: config.max_weight ?? 999.99,
        bonus_multiplier: config.bonus_multiplier ?? 1,
        description: config.description ?? null,
        effective_from: config.effective_from ?? null,
        effective_to: config.effective_to ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    return data as StorePointsConfiguration;
  },

  async updateStorePointsConfiguration(
    id: string,
    config: Partial<StorePointsConfigurationFormData>
  ): Promise<StorePointsConfiguration> {
    const { data, error } = await getSupabase()
      .from('store_points_configurations')
      .update(config)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as StorePointsConfiguration;
  },

  async deleteStorePointsConfiguration(id: string): Promise<void> {
    const { error } = await getSupabase()
      .from('store_points_configurations')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  /** فئات رئيسية المتجر (للقائمة المنسدلة) */
  async getStoreMainCategories(): Promise<Array<{ id: string; name_ar: string }>> {
    const { data, error } = await getSupabase()
      .from('store_main_categories')
      .select('id, name_ar')
      .eq('is_active', true)
      .order('name_ar');
    if (error) throw error;
    return (data || []).map((r: { id: string; name_ar: string }) => ({ id: r.id, name_ar: r.name_ar }));
  },

  /** فئات فرعية المتجر (حسب الفئة الرئيسية) */
  async getStoreSubcategories(
    mainCategoryId?: string
  ): Promise<Array<{ id: string; name_ar: string; main_category_name?: string }>> {
    let query = getSupabase()
      .from('store_subcategories')
      .select(`
        id,
        name_ar,
        main_category_id,
        store_main_categories:main_category_id ( name_ar )
      `)
      .eq('is_active', true)
      .order('name_ar');

    if (mainCategoryId) {
      query = query.eq('main_category_id', mainCategoryId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((r: any) => ({
      id: r.id,
      name_ar: r.name_ar,
      main_category_name: r.store_main_categories?.name_ar,
    }));
  },

  /** منتجات المتجر تحت فئة فرعية */
  async getStoreProductsBySubcategory(
    storeSubcategoryId: string
  ): Promise<Array<{ id: string; name_ar: string }>> {
    const { data, error } = await getSupabase()
      .from('store_products')
      .select('id, name_ar')
      .eq('subcategory_id', storeSubcategoryId)
      .eq('is_active', true)
      .order('name_ar');
    if (error) throw error;
    return (data || []).map((r: { id: string; name_ar: string }) => ({ id: r.id, name_ar: r.name_ar }));
  },
};
