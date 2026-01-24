/**
 * Points Transactions Service
 * Handles all operations related to points transactions
 */

import { supabase } from '@/lib/supabase';
import { PointsTransaction, PointsTransactionType } from '../types';

export const pointsTransactionsService = {
  /**
   * Get all points transactions with filters
   */
  async getPointsTransactions(filters?: {
    profile_id?: string;
    transaction_type?: PointsTransactionType;
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: PointsTransaction[]; count: number }> {
    let query = supabase
      .from('points_transactions')
      .select(`
        *,
        profiles:profile_id (
          id,
          full_name,
          phone_number
        ),
        delivery_orders:related_order_id (
          id,
          order_number
        ),
        agent_collections:related_collection_id (
          id
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (filters?.profile_id) {
      query = query.eq('profile_id', filters.profile_id);
    }

    if (filters?.transaction_type) {
      query = query.eq('transaction_type', filters.transaction_type);
    }

    if (filters?.start_date) {
      query = query.gte('created_at', filters.start_date);
    }

    if (filters?.end_date) {
      query = query.lte('created_at', filters.end_date);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: (data || []).map((item: any) => ({
        ...item,
        customer_name: item.profiles?.full_name,
        customer_phone: item.profiles?.phone_number,
        order_number: item.delivery_orders?.order_number,
      })),
      count: count || 0,
    };
  },

  /**
   * Get points transaction by ID
   */
  async getPointsTransactionById(id: string): Promise<PointsTransaction> {
    const { data, error } = await supabase
      .from('points_transactions')
      .select(`
        *,
        profiles:profile_id (
          id,
          full_name,
          phone_number
        ),
        delivery_orders:related_order_id (
          id,
          order_number
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    return {
      ...data,
      customer_name: data.profiles?.full_name,
      customer_phone: data.profiles?.phone_number,
      order_number: data.delivery_orders?.order_number,
    };
  },

  /**
   * Create points transaction
   */
  async createPointsTransaction(
    transaction: Omit<PointsTransaction, 'id' | 'created_at'>
  ): Promise<PointsTransaction> {
    const { data, error } = await supabase
      .from('points_transactions')
      .insert([transaction])
      .select()
      .single();

    if (error) throw error;

    return data;
  },
};
