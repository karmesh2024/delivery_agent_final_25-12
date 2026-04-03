/**
 * Points Management Service
 * Handles all CRUD operations for points configurations and related data
 */

import { supabase } from '@/lib/supabase';
import {
  PointsConfiguration,
  PointsConfigurationFormData,
  PointsTransaction,
  PointsTransactionType,
  PointsValueHistory,
  PointsReport,
  PointsSummary,
  ProductInSubcategory,
} from '../types';

export const pointsService = {
  /**
   * Get all points configurations
   */
  async getPointsConfigurations(): Promise<PointsConfiguration[]> {
    const { data, error } = await supabase
      .from('points_configurations')
      .select(`
        *,
        subcategories:subcategory_id (
          id,
          name,
          category_id,
          categories:category_id (
            id,
            name
          )
        ),
        waste_data_admin:product_id (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((item: any) => ({
      ...item,
      subcategory_name: item.subcategories?.name,
      category_name: item.subcategories?.categories?.name,
      product_name: item.waste_data_admin?.name,
    }));
  },

  /**
   * Get points configuration by ID
   */
  async getPointsConfigurationById(id: string): Promise<PointsConfiguration> {
    const { data, error } = await supabase
      .from('points_configurations')
      .select(`
        *,
        subcategories:subcategory_id (
          id,
          name,
          category_id,
          categories:category_id (
            id,
            name
          )
        ),
        waste_data_admin:product_id (
          id,
          name
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    return {
      ...data,
      subcategory_name: data.subcategories?.name,
      category_name: data.subcategories?.categories?.name,
      product_name: data.waste_data_admin?.name,
    };
  },

  /**
   * Get points configuration by subcategory ID
   */
  async getPointsConfigurationBySubcategory(subcategoryId: string): Promise<PointsConfiguration | null> {
    const { data, error } = await supabase
      .from('points_configurations')
      .select(`
        *,
        subcategories:subcategory_id (
          id,
          name,
          category_id,
          categories:category_id (
            id,
            name
          )
        )
      `)
      .eq('subcategory_id', subcategoryId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned

    if (!data) return null;

    return {
      ...data,
      subcategory_name: data.subcategories?.name,
      category_name: data.subcategories?.categories?.name,
    };
  },

  /**
   * Create new points configuration
   */
  async createPointsConfiguration(
    config: PointsConfigurationFormData
  ): Promise<PointsConfiguration> {
    const { data, error } = await supabase
      .from('points_configurations')
      .insert([config])
      .select(`
        *,
        subcategories:subcategory_id (
          id,
          name,
          category_id,
          categories:category_id (
            id,
            name
          )
        )
      `)
      .single();

    if (error) throw error;

    return {
      ...data,
      subcategory_name: data.subcategories?.name,
      category_name: data.subcategories?.categories?.name,
    };
  },

  /**
   * Update points configuration
   */
  async updatePointsConfiguration(
    id: string,
    config: Partial<PointsConfigurationFormData>
  ): Promise<PointsConfiguration> {
    const { data, error } = await supabase
      .from('points_configurations')
      .update(config)
      .eq('id', id)
      .select(`
        *,
        subcategories:subcategory_id (
          id,
          name,
          category_id,
          categories:category_id (
            id,
            name
          )
        )
      `)
      .single();

    if (error) throw error;

    return {
      ...data,
      subcategory_name: data.subcategories?.name,
      category_name: data.subcategories?.categories?.name,
    };
  },

  /**
   * Delete points configuration
   */
  async deletePointsConfiguration(id: string): Promise<void> {
    const { error } = await supabase
      .from('points_configurations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Get all subcategories (for dropdown)
   */
  async getSubcategories(): Promise<Array<{ id: string; name: string; category_name?: string }>> {
    const { data, error } = await supabase
      .from('subcategories')
      .select(`
        id,
        name,
        categories:category_id (
          id,
          name
        )
      `)
      .order('name', { ascending: true });

    if (error) throw error;

    return data.map((item: any) => ({
      id: item.id,
      name: item.name,
      category_name: item.categories?.name,
    }));
  },

  /**
   * Get products (waste_data_admin) under a subcategory (subcategories.id UUID).
   * Path 1: subcategories.points_configuration_id -> waste_sub_categories -> waste_data_admin
   * Path 2 (fallback): points_configurations.subcategory_id -> waste_sub_categories -> waste_data_admin
   */
  async getProductsBySubcategory(subcategoryId: string): Promise<ProductInSubcategory[]> {
    let pcId: string | null = null;
    const { data: subRow } = await supabase
      .from('subcategories')
      .select('points_configuration_id')
      .eq('id', subcategoryId)
      .single();
    if (subRow?.points_configuration_id) pcId = subRow.points_configuration_id as string;

    if (!pcId) {
      const { data: pcRows } = await supabase
        .from('points_configurations')
        .select('id')
        .eq('subcategory_id', subcategoryId)
        .is('product_id', null)
        .limit(1);
      pcId = pcRows?.[0]?.id ?? null;
    }
    if (!pcId) return [];

    const { data: wscRows, error: wscErr } = await supabase
      .from('waste_sub_categories')
      .select('id')
      .eq('points_configuration_id', pcId);

    if (wscErr || !wscRows?.length) return [];

    const wscIds = wscRows.map((r: { id: number }) => r.id);
    const { data: products, error: prodErr } = await supabase
      .from('waste_data_admin')
      .select('id, name, points_mode')
      .in('subcategory_id', wscIds)
      .order('name', { ascending: true });

    if (prodErr || !products?.length) return [];

    return products.map((p: { id: string; name: string; points_mode?: 'per_kg' | 'per_piece' | null }) => ({
      id: p.id,
      name: p.name,
      points_mode: p.points_mode ?? 'per_kg',
    }));
  },
};
