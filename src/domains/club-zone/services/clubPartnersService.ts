/**
 * Club Partners Service
 * إدارة الرعاة والشركاء
 */

import { supabase } from '@/lib/supabase';
import { ClubPartner, ClubPartnerFormData, PartnerType } from '../types';

export const clubPartnersService = {
  /**
   * الحصول على جميع الشركاء مع فلاتر
   */
  async getPartners(filters?: {
    partner_type?: PartnerType;
    is_active?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ data: ClubPartner[]; count: number }> {
    let query = supabase
      .from('club_partners')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (filters?.partner_type) {
      query = query.eq('partner_type', filters.partner_type);
    }

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    // Calculate stats for each partner (simplified - can be optimized later)
    const partnersWithStats = await Promise.all(
      (data || []).map(async (item: any) => {
        // Get rewards count for this partner
        const { count: rewardsCount } = await supabase
          .from('club_rewards')
          .select('*', { count: 'exact', head: true })
          .eq('partner_id', item.id);

        // Get reward IDs for this partner
        const { data: rewards } = await supabase
          .from('club_rewards')
          .select('id')
          .eq('partner_id', item.id);

        const rewardIds = rewards?.map((r: any) => r.id) || [];

        // Get redemptions for this partner's rewards
        let redemptions: any[] = [];
        if (rewardIds.length > 0) {
          const { data: redemptionsData } = await supabase
            .from('club_reward_redemptions')
            .select('points_spent, user_id')
            .in('reward_id', rewardIds);
          redemptions = redemptionsData || [];
        }

        const uniqueUsers = new Set(redemptions.map((r: any) => r.user_id));
        const totalPointsRedeemed = redemptions.reduce(
          (sum: number, r: any) => sum + (r.points_spent || 0),
          0
        );

        return {
          ...item,
          total_rewards: rewardsCount || 0,
          total_redemptions: redemptions.length,
          total_points_redeemed: totalPointsRedeemed,
          unique_customers: uniqueUsers.size,
        };
      })
    );

    return {
      data: partnersWithStats,
      count: count || 0,
    };
  },

  /**
   * الحصول على شريك محدد
   */
  async getPartnerById(id: string): Promise<ClubPartner | null> {
    const { data, error } = await supabase
      .from('club_partners')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    if (!data) return null;

    // Get rewards count
    const { count: rewardsCount } = await supabase
      .from('club_rewards')
      .select('*', { count: 'exact', head: true })
      .eq('partner_id', id);

    // Get reward IDs for this partner
    const { data: rewards } = await supabase
      .from('club_rewards')
      .select('id')
      .eq('partner_id', id);

    const rewardIds = rewards?.map((r: any) => r.id) || [];

    // Get redemptions
    const { data: redemptions } = await supabase
      .from('club_reward_redemptions')
      .select('points_spent, user_id')
      .in('reward_id', rewardIds);

    const uniqueUsers = new Set((redemptions || []).map((r: any) => r.user_id));
    const totalPointsRedeemed = (redemptions || []).reduce(
      (sum: number, r: any) => sum + (r.points_spent || 0),
      0
    );

    return {
      ...data,
      total_rewards: rewardsCount || 0,
      total_redemptions: redemptions?.length || 0,
      total_points_redeemed: totalPointsRedeemed,
      unique_customers: uniqueUsers.size,
    };
  },

  /**
   * إنشاء شريك جديد
   */
  async createPartner(partnerData: ClubPartnerFormData): Promise<ClubPartner> {
    const { data, error } = await supabase
      .from('club_partners')
      .insert([partnerData])
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      total_rewards: 0,
      total_redemptions: 0,
      total_points_redeemed: 0,
      unique_customers: 0,
    };
  },

  /**
   * تحديث شريك
   */
  async updatePartner(id: string, updates: Partial<ClubPartnerFormData>): Promise<ClubPartner> {
    const { data, error } = await supabase
      .from('club_partners')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      total_rewards: 0,
      total_redemptions: 0,
      total_points_redeemed: 0,
      unique_customers: 0,
    };
  },

  /**
   * حذف شريك
   */
  async deletePartner(id: string): Promise<void> {
    const { error } = await supabase
      .from('club_partners')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * الحصول على إحصائيات شريك محدد
   */
  async getPartnerStats(partnerId: string): Promise<{
    total_rewards: number;
    total_redemptions: number;
    total_points_redeemed: number;
    unique_customers: number;
  }> {
    const partner = await this.getPartnerById(partnerId);
    if (!partner) {
      throw new Error('الشريك غير موجود');
    }

    return {
      total_rewards: partner.total_rewards || 0,
      total_redemptions: partner.total_redemptions || 0,
      total_points_redeemed: partner.total_points_redeemed || 0,
      unique_customers: partner.unique_customers || 0,
    };
  },

  /**
   * الحصول على الشركاء النشطين فقط
   */
  async getActivePartners(): Promise<ClubPartner[]> {
    const { data } = await this.getPartners({ is_active: true });
    return data;
  },
};
