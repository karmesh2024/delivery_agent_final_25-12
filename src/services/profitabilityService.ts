/**
 * Profitability Service
 * خدمة إدارة الربحية (buy_total, sell_total, platform_profit)
 * المرجع: تقرير المستشار المالي
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ================================================================
// Types
// ================================================================

export interface ProfitabilityStats {
  total_buy: number;
  total_sell: number;
  total_profit: number;
  average_profit_margin: number;
  session_count: number;
  period: 'daily' | 'weekly' | 'monthly' | 'custom';
  from_date?: string;
  to_date?: string;
}

export interface ProfitabilitySession {
  id: string;
  customer_id: string;
  customer_name?: string;
  status: string;
  is_settled: boolean;
  buy_total: number;
  sell_total: number;
  platform_profit: number;
  profit_margin: number;
  created_at: string;
  completed_at?: string;
  profiles?: {
    id: string;
    full_name?: string;
    username?: string;
  };
}

export interface ProfitabilityFilters {
  from_date?: string;
  to_date?: string;
  min_profit?: number;
  max_profit?: number;
  min_margin?: number;
  max_margin?: number;
  is_settled?: boolean;
  status?: string;
  page?: number;
  limit?: number;
}

export interface ProfitabilityByCategory {
  category_name: string;
  subcategory_name: string;
  total_buy: number;
  total_sell: number;
  total_profit: number;
  profit_margin: number;
  session_count: number;
}

// ================================================================
// Functions
// ================================================================

/**
 * جلب إحصائيات الربحية
 */
export async function getProfitabilityStats(
  period: 'daily' | 'weekly' | 'monthly' | 'custom' = 'daily',
  fromDate?: string,
  toDate?: string
): Promise<ProfitabilityStats> {
  let dateFilter = '';
  
  switch (period) {
    case 'daily':
      dateFilter = `DATE(created_at) = CURRENT_DATE`;
      break;
    case 'weekly':
      dateFilter = `DATE(created_at) >= DATE_TRUNC('week', CURRENT_DATE)`;
      break;
    case 'monthly':
      dateFilter = `DATE(created_at) >= DATE_TRUNC('month', CURRENT_DATE)`;
      break;
    case 'custom':
      if (fromDate && toDate) {
        dateFilter = `DATE(created_at) BETWEEN '${fromDate}' AND '${toDate}'`;
      } else {
        dateFilter = `DATE(created_at) = CURRENT_DATE`;
      }
      break;
  }

  const { data, error } = await supabase.rpc('get_profitability_stats', {
    p_date_filter: dateFilter
  });

  if (error) {
    // Fallback: استخدام query مباشر
    let query = supabase
      .from('waste_collection_sessions')
      .select('buy_total, sell_total, platform_profit, profit_margin')
      .eq('status', 'completed');

    if (period === 'daily') {
      query = query.gte('created_at', new Date().toISOString().split('T')[0]);
    } else if (period === 'weekly') {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      query = query.gte('created_at', weekStart.toISOString().split('T')[0]);
    } else if (period === 'monthly') {
      const monthStart = new Date();
      monthStart.setDate(1);
      query = query.gte('created_at', monthStart.toISOString().split('T')[0]);
    } else if (fromDate && toDate) {
      query = query.gte('created_at', fromDate).lte('created_at', toDate);
    }

    const { data: sessionsData, error: sessionsError } = await query;

    if (sessionsError) {
      console.error('Error fetching profitability stats:', sessionsError);
      throw sessionsError;
    }

    const totalBuy = (sessionsData || []).reduce((sum, s) => sum + (s.buy_total || 0), 0);
    const totalSell = (sessionsData || []).reduce((sum, s) => sum + (s.sell_total || 0), 0);
    const totalProfit = (sessionsData || []).reduce((sum, s) => sum + (s.platform_profit || 0), 0);
    const margins = (sessionsData || []).filter(s => s.profit_margin != null).map(s => s.profit_margin!);
    const avgMargin = margins.length > 0 ? margins.reduce((sum, m) => sum + m, 0) / margins.length : 0;

    return {
      total_buy: totalBuy,
      total_sell: totalSell,
      total_profit: totalProfit,
      average_profit_margin: avgMargin,
      session_count: sessionsData?.length || 0,
      period,
      from_date: fromDate,
      to_date: toDate
    };
  }

  return data as ProfitabilityStats;
}

/**
 * جلب الجلسات مع تفاصيل الربحية
 */
export async function getProfitabilitySessions(
  filters: ProfitabilityFilters = {}
): Promise<{
  data: ProfitabilitySession[];
  count: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  let query = supabase
    .from('waste_collection_sessions')
    .select(`
      id,
      customer_id,
      status,
      is_settled,
      buy_total,
      sell_total,
      platform_profit,
      profit_margin,
      created_at,
      completed_at,
      profiles:customer_id (
        id,
        full_name,
        username
      )
    `, { count: 'exact' })
    .eq('status', 'completed')
    .not('buy_total', 'is', null)
    .not('sell_total', 'is', null);

  if (filters.from_date) {
    query = query.gte('created_at', filters.from_date);
  }

  if (filters.to_date) {
    query = query.lte('created_at', filters.to_date);
  }

  if (filters.min_profit !== undefined) {
    query = query.gte('platform_profit', filters.min_profit);
  }

  if (filters.max_profit !== undefined) {
    query = query.lte('platform_profit', filters.max_profit);
  }

  if (filters.min_margin !== undefined) {
    query = query.gte('profit_margin', filters.min_margin);
  }

  if (filters.max_margin !== undefined) {
    query = query.lte('profit_margin', filters.max_margin);
  }

  if (filters.is_settled !== undefined) {
    query = query.eq('is_settled', filters.is_settled);
  }

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  query = query.range(from, to).order('created_at', { ascending: false });

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching profitability sessions:', error);
    throw error;
  }

  const sessions: ProfitabilitySession[] = (data || []).map((session: any) => ({
    id: session.id,
    customer_id: session.customer_id,
    customer_name: session.profiles?.full_name || session.profiles?.username || 'غير معروف',
    status: session.status,
    is_settled: session.is_settled,
    buy_total: session.buy_total || 0,
    sell_total: session.sell_total || 0,
    platform_profit: session.platform_profit || 0,
    profit_margin: session.profit_margin || 0,
    created_at: session.created_at,
    completed_at: session.completed_at,
    profiles: session.profiles
  }));

  return {
    data: sessions,
    count: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit)
  };
}

/**
 * جلب الربحية حسب الفئة
 */
export async function getProfitabilityByCategory(
  fromDate?: string,
  toDate?: string
): Promise<ProfitabilityByCategory[]> {
  // هذا يحتاج إلى join مع waste_collection_items و waste_data_admin
  // سنستخدم query معقد
  
  let itemsQuery = supabase
    .from('waste_collection_items')
    .select(`
      session_id,
      total_price,
      total_weight,
      sell_price,
      item_profit,
      waste_data_id,
      waste_data:waste_data_id (
        subcategory_id,
        subcategory:subcategory_id (
          id,
          name,
          category:category_id (
            id,
            name
          )
        )
      )
    `);

  if (fromDate || toDate) {
    // نحتاج join مع sessions
    itemsQuery = supabase
      .from('waste_collection_items')
      .select(`
        session_id,
        total_price,
        total_weight,
        sell_price,
        item_profit,
        waste_data_id,
        waste_data:waste_data_id (
          subcategory_id,
          subcategory:subcategory_id (
            id,
            name,
            category:category_id (
              id,
              name
            )
          )
        ),
        session:waste_collection_sessions!inner (
          created_at
        )
      `);
  }

  const { data: items, error } = await itemsQuery;

  if (error) {
    console.error('Error fetching profitability by category:', error);
    throw error;
  }

  // تجميع البيانات حسب الفئة
  const categoryMap = new Map<string, {
    category_name: string;
    subcategory_name: string;
    total_buy: number;
    total_sell: number;
    total_profit: number;
    session_count: number;
  }>();

  (items || []).forEach((item: any) => {
    const subcategory = item.waste_data?.subcategory;
    if (!subcategory) return;

    const categoryName = subcategory.category?.name || 'غير محدد';
    const subcategoryName = subcategory.name || 'غير محدد';
    const key = `${categoryName}-${subcategoryName}`;

    if (!categoryMap.has(key)) {
      categoryMap.set(key, {
        category_name: categoryName,
        subcategory_name: subcategoryName,
        total_buy: 0,
        total_sell: 0,
        total_profit: 0,
        session_count: 0
      });
    }

    const categoryData = categoryMap.get(key)!;
    categoryData.total_buy += item.total_price || 0;
    categoryData.total_sell += (item.total_weight || 0) * (item.sell_price || 0);
    categoryData.total_profit += item.item_profit || 0;
  });

  // تحويل إلى array وحساب profit_margin
  const result: ProfitabilityByCategory[] = Array.from(categoryMap.values()).map(cat => ({
    ...cat,
    profit_margin: cat.total_buy > 0 ? (cat.total_profit / cat.total_buy * 100) : 0
  }));

  return result.sort((a, b) => b.total_profit - a.total_profit);
}
