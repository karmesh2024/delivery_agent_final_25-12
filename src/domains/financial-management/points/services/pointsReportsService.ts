/**
 * Points Reports Service
 * Handles generation of points reports and analytics
 */

import { supabase } from '@/lib/supabase';
import { PointsReport, PointsSummary } from '../types';

export const pointsReportsService = {
  /**
   * Get points report for a specific period
   */
  async getPointsReport(
    startDate: string,
    endDate: string
  ): Promise<PointsReport> {
    // Get transactions in period
    const { data: transactions, error: transError } = await supabase
      .from('points_transactions')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (transError) throw transError;

    // Get average point value
    const { data: configs, error: configError } = await supabase
      .from('points_configurations')
      .select('point_value')
      .eq('is_active', true);

    if (configError) throw configError;

    const avgPointValue = configs && configs.length > 0
      ? configs.reduce((acc, c) => acc + Number(c.point_value), 0) / configs.length
      : 0;

    // Calculate totals
    const totalPointsGranted = transactions
      ?.filter(t => t.transaction_type === 'EARNED' || t.transaction_type === 'BONUS')
      .reduce((sum, t) => sum + t.points, 0) || 0;

    const totalPointsUsed = transactions
      ?.filter(t => t.transaction_type === 'USED' || t.transaction_type === 'EXPIRED')
      .reduce((sum, t) => sum + Math.abs(t.points), 0) || 0;

    // Get current pending points (from profiles)
    const { data: profiles, error: profilesError } = await supabase
      .from('new_profiles')
      .select('points')
      .not('points', 'is', null);

    if (profilesError) throw profilesError;

    const totalPointsPending = profiles?.reduce((sum, p) => sum + (p.points || 0), 0) || 0;

    const totalFinancialValue = totalPointsPending * avgPointValue;

    // Get points by category (simplified - would need more complex query)
    const pointsByCategory: Array<{
      category_name: string;
      points_granted: number;
      points_used: number;
      financial_value: number;
    }> = [];

    return {
      total_points_granted: totalPointsGranted,
      total_points_used: totalPointsUsed,
      total_points_pending: totalPointsPending,
      total_financial_value: totalFinancialValue,
      points_by_category: pointsByCategory,
      transactions_count: transactions?.length || 0,
      period_start: startDate,
      period_end: endDate,
    };
  },

  /**
   * Get points summary
   */
  async getPointsSummary(): Promise<PointsSummary> {
    // Get all profiles with points
    const { data: profiles, error: profilesError } = await supabase
      .from('new_profiles')
      .select('id, points, full_name, phone_number')
      .not('points', 'is', null)
      .gt('points', 0)
      .order('points', { ascending: false })
      .limit(10);

    if (profilesError) throw profilesError;

    // Get average point value
    const { data: configs, error: configError } = await supabase
      .from('points_configurations')
      .select('point_value')
      .eq('is_active', true);

    if (configError) throw configError;

    const avgPointValue = configs && configs.length > 0
      ? configs.reduce((acc, c) => acc + Number(c.point_value), 0) / configs.length
      : 0;

    const totalPointsBalance = profiles?.reduce((sum, p) => sum + (p.points || 0), 0) || 0;
    const totalCustomersWithPoints = profiles?.length || 0;
    const averagePointsPerCustomer = totalCustomersWithPoints > 0
      ? totalPointsBalance / totalCustomersWithPoints
      : 0;
    const totalFinancialValue = totalPointsBalance * avgPointValue;

    const topCustomers = (profiles || []).slice(0, 10).map(p => ({
      customer_id: p.id,
      customer_name: p.full_name || 'غير معروف',
      points_balance: p.points || 0,
      financial_value: (p.points || 0) * avgPointValue,
    }));

    return {
      total_customers_with_points: totalCustomersWithPoints,
      total_points_balance: totalPointsBalance,
      total_financial_value: totalFinancialValue,
      average_points_per_customer: averagePointsPerCustomer,
      top_customers: topCustomers,
    };
  },
};
