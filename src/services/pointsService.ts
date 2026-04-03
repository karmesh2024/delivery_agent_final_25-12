/**
 * Points Service
 * خدمة إدارة نظام النقاط الهجين (المحفظة المالية + نقاط المتجر)
 * المرجع: docs/دليل_التنفيذ_للداش_بورد.md
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ================================================================
// Types
// ================================================================

export interface Session {
  id: string;
  customer_id: string;
  customer_name?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  is_settled: boolean;
  total_value: number;
  base_points: number;
  bonus_points: number;
  total_points?: number;
  created_at: string;
  completed_at?: string;
  profiles?: {
    id: string;
    full_name?: string;
    username?: string;
  };
}

export interface Redemption {
  id: string;
  customer_id: string;
  customer_name?: string;
  amount_egp: number;
  points_redeemed: number;
  redemption_type: 'cash' | 'product' | 'gift' | 'donation';
  status: 'pending' | 'approved' | 'completed' | 'rejected' | 'cancelled';
  reference_number?: string;
  notes?: string;
  created_at: string;
  processed_at?: string;
  profiles?: {
    id: string;
    full_name?: string;
    username?: string;
  };
}

export interface Transaction {
  id: string;
  profile_id: string;
  type: 'wallet' | 'store';
  amount: number;
  before_balance: number;
  after_balance: number;
  source: string;
  reference_id?: string;
  description?: string;
  created_at: string;
  profiles?: {
    id: string;
    full_name?: string;
    username?: string;
  };
}

export interface DashboardStats {
  totalSessions: number;
  settledSessions: number;
  pendingSessions: number;
  totalWalletBalance: number;
  totalStorePoints: number;
  pendingRedemptions: number;
  pendingRedemptionsAmount: number;
  todaySessions?: number;
  todaySettled?: number;
}

export interface CustomerBalance {
  wallet_balance: number;
  store_points: number;
  pending_sessions: number;
  pending_wallet_value: number;
  total_available: number;
}

export interface SessionFilters {
  status?: string;
  is_settled?: boolean;
  customer_id?: string;
  page?: number;
  limit?: number;
  from_date?: string;
  to_date?: string;
}

export interface RedemptionFilters {
  status?: string;
  redemption_type?: string;
  customer_id?: string;
  page?: number;
  limit?: number;
}

export interface TransactionFilters {
  profile_id?: string;
  type?: string;
  source?: string;
  page?: number;
  limit?: number;
}

// ================================================================
// Sessions Service
// ================================================================

/**
 * جلب قائمة الجلسات
 */
export async function getSessions(filters: SessionFilters = {}) {
  let query = supabase
    .from('waste_collection_sessions')
    .select(`
      *,
      buy_total,
      sell_total,
      platform_profit,
      profit_margin,
      profiles:customer_id (
        id,
        full_name,
        username
      )
    `, { count: 'exact' });

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.is_settled !== undefined) {
    query = query.eq('is_settled', filters.is_settled);
  }

  if (filters.customer_id) {
    query = query.eq('customer_id', filters.customer_id);
  }

  if (filters.from_date) {
    query = query.gte('created_at', filters.from_date);
  }

  if (filters.to_date) {
    query = query.lte('created_at', filters.to_date);
  }

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  query = query.range(from, to).order('created_at', { ascending: false });

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching sessions:', error);
    throw error;
  }

  return {
    data: data || [],
    count: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit)
  };
}

/**
 * جلب جلسة واحدة
 */
export async function getSession(sessionId: string) {
  const { data, error } = await supabase
    .from('waste_collection_sessions')
    .select(`
      *,
      profiles:customer_id (
        id,
        full_name,
        username,
        wallet_balance,
        store_points
      ),
      waste_collection_items (
        id,
        waste_data_id,
        quantity,
        weight,
        total_weight,
        total_price,
        unit_price
      )
    `)
    .eq('id', sessionId)
    .single();

  if (error) {
    console.error('Error fetching session:', error);
    throw error;
  }

  return data;
}

/**
 * تسوية جلسة (اعتماد)
 */
export async function settleSession(sessionId: string) {
  const { data, error } = await supabase.rpc('settle_collection_session', {
    p_session_id: sessionId
  });

  if (error) {
    console.error('Error settling session:', error);
    throw error;
  }

  return { success: true, data };
}

/**
 * تسوية جلسات متعددة
 */
export async function settleMultipleSessions(sessionIds: string[]) {
  const results = [];
  const errors = [];

  for (const sessionId of sessionIds) {
    try {
      await settleSession(sessionId);
      results.push({ sessionId, success: true });
    } catch (error) {
      errors.push({ sessionId, error });
    }
  }

  return { results, errors };
}

// ================================================================
// Redemptions Service
// ================================================================

/**
 * جلب قائمة طلبات السحب/الاستبدال
 */
export async function getRedemptions(filters: RedemptionFilters = {}) {
  let query = supabase
    .from('points_redemptions')
    .select(`
      *,
      profiles:customer_id (
        id,
        full_name,
        username
      )
    `, { count: 'exact' });

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.redemption_type) {
    query = query.eq('redemption_type', filters.redemption_type);
  }

  if (filters.customer_id) {
    query = query.eq('customer_id', filters.customer_id);
  }

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  query = query.range(from, to).order('created_at', { ascending: false });

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching redemptions:', error);
    throw error;
  }

  return {
    data: data || [],
    count: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit)
  };
}

/**
 * جلب طلب استبدال واحد
 */
export async function getRedemption(redemptionId: string) {
  const { data, error } = await supabase
    .from('points_redemptions')
    .select(`
      *,
      profiles:customer_id (
        id,
        full_name,
        username,
        wallet_balance,
        store_points
      )
    `)
    .eq('id', redemptionId)
    .single();

  if (error) {
    console.error('Error fetching redemption:', error);
    throw error;
  }

  return data;
}

/**
 * معالجة طلب السحب/الاستبدال
 */
export async function processRedemption(
  redemptionId: string, 
  action: 'approve' | 'reject',
  processedBy?: string,
  referenceNumber?: string,
  notes?: string
) {
  if (action === 'reject') {
    // رفض + إرجاع النقاط
    const { data, error } = await supabase.rpc('refund_redemption', {
      p_redemption_id: redemptionId
    });

    if (error) {
      console.error('Error rejecting redemption:', error);
      throw error;
    }

    return { success: true, action: 'rejected' };
  }

  // موافقة
  const redemption = await getRedemption(redemptionId);
  
  // التحقق من الجلسات المعلقة
  const { data: unsettledCount, error: unsettledError } = await supabase.rpc('check_unsettled_sessions', {
    p_customer_id: redemption.customer_id
  });

  if (unsettledError) {
    throw unsettledError;
  }

  if (unsettledCount > 0) {
    throw new Error(`يوجد ${unsettledCount} جلسة غير مقفلة. لا يمكن الموافقة على السحب.`);
  }

  // تحديث الحالة
  const { data, error } = await supabase
    .from('points_redemptions')
    .update({
      status: 'completed',
      reference_number: referenceNumber,
      notes,
      processed_by: processedBy,
      processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', redemptionId)
    .select()
    .single();

  if (error) {
    console.error('Error approving redemption:', error);
    throw error;
  }

  return { success: true, action: 'approved', data };
}

// ================================================================
// Transactions Service
// ================================================================

/**
 * جلب سجل المعاملات
 */
export async function getTransactions(filters: TransactionFilters = {}) {
  let query = supabase
    .from('points_transactions')
    .select(`
      *,
      profiles:profile_id (
        id,
        full_name,
        username
      )
    `, { count: 'exact' });

  if (filters.profile_id) {
    query = query.eq('profile_id', filters.profile_id);
  }

  if (filters.type) {
    query = query.eq('type', filters.type);
  }

  if (filters.source) {
    query = query.eq('source', filters.source);
  }

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  query = query.range(from, to).order('created_at', { ascending: false });

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }

  return {
    data: data || [],
    count: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit)
  };
}

// ================================================================
// Dashboard Stats Service
// ================================================================

/**
 * جلب إحصائيات لوحة التحكم
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  // جلب إحصائيات الجلسات
  const { data: sessions, error: sessionsError } = await supabase
    .from('waste_collection_sessions')
    .select('status, is_settled, created_at')
    .eq('status', 'completed');

  if (sessionsError) {
    console.error('Error fetching sessions stats:', sessionsError);
  }

  // جلب طلبات السحب المعلقة
  const { data: redemptions, error: redemptionsError } = await supabase
    .from('points_redemptions')
    .select('amount_egp')
    .eq('status', 'pending')
    .eq('redemption_type', 'cash');

  if (redemptionsError) {
    console.error('Error fetching redemptions stats:', redemptionsError);
  }

  // جلب إجمالي الرصيد
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('wallet_balance, store_points');

  if (profilesError) {
    console.error('Error fetching profiles stats:', profilesError);
  }

  // حساب الإحصائيات
  const today = new Date().toISOString().split('T')[0];
  const todaySessions = sessions?.filter(s => s.created_at?.startsWith(today)) || [];

  return {
    totalSessions: sessions?.length || 0,
    settledSessions: sessions?.filter(s => s.is_settled).length || 0,
    pendingSessions: sessions?.filter(s => !s.is_settled).length || 0,
    totalWalletBalance: profiles?.reduce((sum, p) => sum + (p.wallet_balance || 0), 0) || 0,
    totalStorePoints: profiles?.reduce((sum, p) => sum + (p.store_points || 0), 0) || 0,
    pendingRedemptions: redemptions?.length || 0,
    pendingRedemptionsAmount: redemptions?.reduce((sum, r) => sum + (r.amount_egp || 0), 0) || 0,
    todaySessions: todaySessions.length,
    todaySettled: todaySessions.filter(s => s.is_settled).length
  };
}

// ================================================================
// Customer Balance Service
// ================================================================

/**
 * جلب ملخص رصيد العميل
 */
export async function getCustomerBalance(customerId: string): Promise<CustomerBalance> {
  const { data, error } = await supabase.rpc('get_customer_balance_summary', {
    p_customer_id: customerId
  });

  if (error) {
    console.error('Error fetching customer balance:', error);
    throw error;
  }

  return data?.[0] || {
    wallet_balance: 0,
    store_points: 0,
    pending_sessions: 0,
    pending_wallet_value: 0,
    total_available: 0
  };
}

/**
 * التحقق من الجلسات غير المقفلة
 */
export async function checkUnsettledSessions(customerId: string): Promise<number> {
  const { data, error } = await supabase.rpc('check_unsettled_sessions', {
    p_customer_id: customerId
  });

  if (error) {
    console.error('Error checking unsettled sessions:', error);
    throw error;
  }

  return data || 0;
}

// ================================================================
// Configuration Service
// ================================================================

/**
 * جلب إعدادات النقاط
 */
export async function getPointsConfiguration() {
  const { data, error } = await supabase
    .from('points_configuration')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Error fetching points configuration:', error);
    throw error;
  }

  return data || {
    points_per_egp: 100,
    min_redemption_points: 1000,
    max_daily_redeem_amount: 1000
  };
}

/**
 * تحديث إعدادات النقاط
 */
export async function updatePointsConfiguration(config: {
  points_per_egp?: number;
  min_redemption_points?: number;
  max_daily_redeem_amount?: number;
}) {
  const { data, error } = await supabase
    .from('points_configuration')
    .update({
      ...config,
      updated_at: new Date().toISOString()
    })
    .eq('is_active', true)
    .select()
    .single();

  if (error) {
    console.error('Error updating points configuration:', error);
    throw error;
  }

  return data;
}

// ================================================================
// Export all functions
// ================================================================

export default {
  // Sessions
  getSessions,
  getSession,
  settleSession,
  settleMultipleSessions,
  
  // Redemptions
  getRedemptions,
  getRedemption,
  processRedemption,
  
  // Transactions
  getTransactions,
  
  // Dashboard
  getDashboardStats,
  
  // Customer
  getCustomerBalance,
  checkUnsettledSessions,
  
  // Configuration
  getPointsConfiguration,
  updatePointsConfiguration
};
