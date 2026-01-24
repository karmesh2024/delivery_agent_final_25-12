/**
 * Points Pricing Service
 * Handles operations related to points pricing and value management
 */

import { supabase } from '@/lib/supabase';
import { PointsValueHistory, PointsPricingSettings } from '../types';

export const pointsPricingService = {
  /**
   * Update point value for a configuration
   */
  async updatePointValue(
    pointsConfigurationId: string,
    newValue: number,
    reason?: string
  ): Promise<void> {
    // Get current value
    const { data: currentConfig, error: fetchError } = await supabase
      .from('points_configurations')
      .select('point_value')
      .eq('id', pointsConfigurationId)
      .single();

    if (fetchError) throw fetchError;

    // Update point value
    const { error: updateError } = await supabase
      .from('points_configurations')
      .update({ point_value: newValue })
      .eq('id', pointsConfigurationId);

    if (updateError) throw updateError;

    // Record in history (if table exists)
    try {
      await supabase
        .from('points_value_history')
        .insert([{
          points_configuration_id: pointsConfigurationId,
          old_value: currentConfig.point_value,
          new_value: newValue,
          change_reason: reason,
          changed_at: new Date().toISOString(),
        }]);
    } catch (err) {
      // Table might not exist yet, ignore for now
      console.warn('points_value_history table not found, skipping history record');
    }
  },

  /**
   * Get points value history
   */
  async getPointsValueHistory(
    pointsConfigurationId?: string,
    limit: number = 50
  ): Promise<PointsValueHistory[]> {
    let query = supabase
      .from('points_value_history')
      .select(`
        *,
        points_configurations:points_configuration_id (
          id,
          subcategory_id,
          subcategories:subcategory_id (
            name
          )
        )
      `)
      .order('changed_at', { ascending: false })
      .limit(limit);

    if (pointsConfigurationId) {
      query = query.eq('points_configuration_id', pointsConfigurationId);
    }

    const { data, error } = await query;

    if (error && error.code !== '42P01') throw error; // 42P01 = table doesn't exist

    return (data || []).map((item: any) => ({
      ...item,
      subcategory_name: item.points_configurations?.subcategories?.name,
    }));
  },

  /**
   * Calculate financial value of points
   */
  calculateFinancialValue(points: number, pointValue: number): number {
    return points * pointValue;
  },

  /**
   * Get average point value across all configurations
   */
  async getAveragePointValue(): Promise<number> {
    const { data, error } = await supabase
      .from('points_configurations')
      .select('point_value')
      .eq('is_active', true);

    if (error) throw error;

    if (!data || data.length === 0) return 0;

    const sum = data.reduce((acc, item) => acc + Number(item.point_value), 0);
    return sum / data.length;
  },
};
