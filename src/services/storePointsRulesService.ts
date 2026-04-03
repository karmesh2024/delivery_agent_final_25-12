/**
 * Store Points Rules Service
 * خدمة إدارة قواعد نقاط المتجر (store_points)
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ================================================================
// Types
// ================================================================

export interface StorePointsRule {
  id: number;
  name: string;
  rule_type: 'multiplier' | 'welcome' | 'tier' | 'seasonal' | 'fixed';
  min_base_points?: number;
  customer_tier?: string;
  is_new_customer?: boolean;
  bonus_percentage?: number;
  bonus_fixed?: number;
  start_date?: string;
  end_date?: string;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RulePreview {
  base_points: number;
  bonus_points: number;
  customer_tier?: string;
  is_new_customer?: boolean;
}

// ================================================================
// Functions
// ================================================================

/**
 * جلب جميع القواعد
 */
export async function getRules(activeOnly: boolean = false): Promise<StorePointsRule[]> {
  let query = supabase
    .from('store_points_rules')
    .select('*')
    .order('priority', { ascending: false })
    .order('id', { ascending: true });

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching rules:', error);
    throw error;
  }

  return data || [];
}

/**
 * إنشاء قاعدة جديدة
 */
export async function createRule(rule: Omit<StorePointsRule, 'id' | 'created_at' | 'updated_at'>): Promise<StorePointsRule> {
  const { data, error } = await supabase
    .from('store_points_rules')
    .insert({
      ...rule,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating rule:', error);
    throw error;
  }

  return data;
}

/**
 * تحديث قاعدة
 */
export async function updateRule(
  id: number,
  updates: Partial<StorePointsRule>
): Promise<StorePointsRule> {
  const { data, error } = await supabase
    .from('store_points_rules')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating rule:', error);
    throw error;
  }

  return data;
}

/**
 * حذف قاعدة
 */
export async function deleteRule(id: number): Promise<void> {
  const { error } = await supabase
    .from('store_points_rules')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting rule:', error);
    throw error;
  }
}

/**
 * معاينة تأثير القاعدة
 */
export async function previewRule(
  ruleId: number,
  basePoints: number,
  customerTier?: string,
  isNewCustomer?: boolean
): Promise<RulePreview> {
  // جلب القاعدة
  const { data: rule, error } = await supabase
    .from('store_points_rules')
    .select('*')
    .eq('id', ruleId)
    .single();

  if (error || !rule) {
    throw new Error('القاعدة غير موجودة');
  }

  // التحقق من الشروط
  if (rule.min_base_points && basePoints < rule.min_base_points) {
    return {
      base_points: basePoints,
      bonus_points: 0,
      customer_tier: customerTier,
      is_new_customer: isNewCustomer
    };
  }

  if (rule.customer_tier && customerTier !== rule.customer_tier) {
    return {
      base_points: basePoints,
      bonus_points: 0,
      customer_tier: customerTier,
      is_new_customer: isNewCustomer
    };
  }

  if (rule.is_new_customer !== undefined && rule.is_new_customer !== isNewCustomer) {
    return {
      base_points: basePoints,
      bonus_points: 0,
      customer_tier: customerTier,
      is_new_customer: isNewCustomer
    };
  }

  // حساب البونص
  let bonusPoints = 0;

  if (rule.rule_type === 'welcome' && rule.bonus_fixed) {
    bonusPoints = rule.bonus_fixed;
  } else if (rule.rule_type === 'fixed' && rule.bonus_fixed) {
    bonusPoints = rule.bonus_fixed;
  } else if (rule.bonus_percentage) {
    bonusPoints = Math.floor(basePoints * rule.bonus_percentage / 100);
  }

  return {
    base_points: basePoints,
    bonus_points: bonusPoints,
    customer_tier: customerTier,
    is_new_customer: isNewCustomer
  };
}

/**
 * حساب البونص الإجمالي لعميل معين
 */
export async function calculateTotalBonus(
  customerId: string,
  basePoints: number
): Promise<number> {
  const { data, error } = await supabase.rpc('calculate_store_points_bonus', {
    p_customer_id: customerId,
    p_base_points: basePoints
  });

  if (error) {
    console.error('Error calculating bonus:', error);
    throw error;
  }

  return data || 0;
}
