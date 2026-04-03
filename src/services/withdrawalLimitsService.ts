/**
 * Withdrawal Limits Service
 * خدمة إدارة حدود السحب النقدي
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ================================================================
// Types
// ================================================================

export interface WithdrawalLimit {
  id: number;
  limit_type: 'daily' | 'weekly' | 'monthly';
  max_amount_egp: number;
  max_transactions: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LimitCheckResult {
  allowed: boolean;
  reason: string;
  daily_total: number;
  daily_limit: number;
  daily_count: number;
  daily_limit_count: number;
}

export interface LimitStats {
  limit_type: string;
  total_withdrawals: number;
  total_amount: number;
  exceeded_count: number;
  average_amount: number;
}

// ================================================================
// Functions
// ================================================================

/**
 * جلب جميع الحدود
 */
export async function getLimits(): Promise<WithdrawalLimit[]> {
  const { data, error } = await supabase
    .from('withdrawal_limits')
    .select('*')
    .order('limit_type', { ascending: true });

  if (error) {
    console.error('Error fetching limits:', error);
    throw error;
  }

  return data || [];
}

/**
 * تحديث حد معين
 */
export async function updateLimit(
  id: number,
  updates: Partial<WithdrawalLimit>
): Promise<WithdrawalLimit> {
  const { data, error } = await supabase
    .from('withdrawal_limits')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating limit:', error);
    throw error;
  }

  return data;
}

/**
 * التحقق من حد لعميل معين
 */
export async function checkLimit(
  customerId: string,
  amount: number
): Promise<LimitCheckResult> {
  const { data, error } = await supabase.rpc('check_withdrawal_limits', {
    p_customer_id: customerId,
    p_amount_egp: amount
  });

  if (error) {
    console.error('Error checking limit:', error);
    throw error;
  }

  return data as LimitCheckResult;
}

/**
 * جلب إحصائيات استخدام الحدود
 */
export async function getLimitStats(
  fromDate?: string,
  toDate?: string
): Promise<LimitStats[]> {
  let query = supabase
    .from('points_redemptions')
    .select('amount_egp, created_at, redemption_type')
    .eq('redemption_type', 'cash')
    .in('status', ['pending', 'completed']);

  if (fromDate) {
    query = query.gte('created_at', fromDate);
  }

  if (toDate) {
    query = query.lte('created_at', toDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching limit stats:', error);
    throw error;
  }

  // تجميع البيانات حسب النوع
  const stats: Record<string, LimitStats> = {};

  (data || []).forEach((redemption: any) => {
    const date = new Date(redemption.created_at);
    const dayOfWeek = date.getDay();
    const dayOfMonth = date.getDate();
    const month = date.getMonth();

    // تحديد النوع
    let limitType = 'daily';
    if (dayOfWeek === 0 && dayOfMonth <= 7) {
      limitType = 'weekly';
    } else if (dayOfMonth === 1) {
      limitType = 'monthly';
    }

    if (!stats[limitType]) {
      stats[limitType] = {
        limit_type: limitType,
        total_withdrawals: 0,
        total_amount: 0,
        exceeded_count: 0,
        average_amount: 0
      };
    }

    stats[limitType].total_withdrawals++;
    stats[limitType].total_amount += redemption.amount_egp || 0;
  });

  // حساب المتوسط
  Object.values(stats).forEach(stat => {
    stat.average_amount = stat.total_withdrawals > 0
      ? stat.total_amount / stat.total_withdrawals
      : 0;
  });

  return Object.values(stats);
}
