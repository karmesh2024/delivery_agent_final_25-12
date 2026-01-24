/**
 * Club Rewards Service
 * إدارة الجوائز والاستبدال
 */

import { supabase } from '@/lib/supabase';
import {
  ClubReward,
  ClubRewardFormData,
  RewardRedemption,
  RewardRedemptionRequest,
  RewardType,
} from '../types';
import { clubPointsService } from './clubPointsService';
import { v4 as uuidv4 } from 'uuid';

export const clubRewardsService = {
  /**
   * الحصول على جميع الجوائز مع فلاتر
   */
  async getRewards(filters?: {
    partner_id?: string;
    reward_type?: RewardType;
    is_active?: boolean;
    is_featured?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ data: ClubReward[]; count: number }> {
    let query = supabase
      .from('club_rewards')
      .select(`
        *,
        club_partners:partner_id (
          id,
          company_name
        ),
        club_reward_redemptions (
          id
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (filters?.partner_id) {
      query = query.eq('partner_id', filters.partner_id);
    }

    if (filters?.reward_type) {
      query = query.eq('reward_type', filters.reward_type);
    }

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    if (filters?.is_featured !== undefined) {
      query = query.eq('is_featured', filters.is_featured);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[clubRewardsService] Error fetching rewards:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      throw error;
    }

    return {
      data: (data || []).map((item: any) => ({
        ...item,
        partner_name: item.club_partners?.company_name,
        total_redemptions: Array.isArray(item.club_reward_redemptions) 
          ? item.club_reward_redemptions.length 
          : 0,
        club_partners: undefined,
        club_reward_redemptions: undefined,
      })),
      count: count || 0,
    };
  },

  /**
   * الحصول على جائزة محددة
   */
  async getRewardById(id: string): Promise<ClubReward | null> {
    const { data, error } = await supabase
      .from('club_rewards')
      .select(`
        *,
        club_partners:partner_id (
          id,
          company_name
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    if (!data) return null;

    return {
      ...data,
      partner_name: (data as any).club_partners?.company_name,
      total_redemptions: 0,
    };
  },

  /**
   * إنشاء جائزة جديدة
   */
  async createReward(rewardData: ClubRewardFormData): Promise<ClubReward> {
    const { data, error } = await supabase
      .from('club_rewards')
      .insert([rewardData])
      .select(`
        *,
        club_partners:partner_id (
          id,
          company_name
        )
      `)
      .single();

    if (error) throw error;

    return {
      ...data,
      partner_name: (data as any).club_partners?.company_name,
      total_redemptions: 0,
    };
  },

  /**
   * تحديث جائزة
   */
  async updateReward(id: string, updates: Partial<ClubRewardFormData>): Promise<ClubReward> {
    const { data, error } = await supabase
      .from('club_rewards')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        club_partners:partner_id (
          id,
          company_name
        )
      `)
      .single();

    if (error) throw error;

    return {
      ...data,
      partner_name: (data as any).club_partners?.company_name,
      total_redemptions: 0,
    };
  },

  /**
   * حذف جائزة
   */
  async deleteReward(id: string): Promise<void> {
    const { error } = await supabase
      .from('club_rewards')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * استبدال جائزة
   */
  async redeemReward(request: RewardRedemptionRequest): Promise<RewardRedemption> {
    // 1. الحصول على الجائزة
    const reward = await this.getRewardById(request.rewardId);
    if (!reward) {
      throw new Error('الجائزة غير موجودة');
    }

    // 2. التحقق من الجائزة (نشطة، متاحة، صالحة)
    if (!reward.is_active) {
      throw new Error('الجائزة غير نشطة');
    }

    if (reward.valid_until && new Date(reward.valid_until) < new Date()) {
      throw new Error('الجائزة منتهية الصلاحية');
    }

    if (reward.quantity_available !== null && reward.quantity_redeemed >= reward.quantity_available) {
      throw new Error('الجائزة غير متاحة (الكمية منتهية)');
    }

    // 3. التحقق من رصيد النقاط
    const wallet = await clubPointsService.getPointsWallet(request.userId);
    const available = wallet?.available_points ?? wallet?.points_balance ?? 0;
    if (!wallet || available < reward.points_required) {
      throw new Error('رصيد النقاط غير كافي');
    }

    // 4. خصم النقاط
    await clubPointsService.deductPoints(
      request.userId,
      reward.points_required,
      'استبدال جائزة',
      'reward_redeem',
      `استبدال: ${reward.title}`
    );

    // 5. إنشاء redemption record
    const redemptionCode = `SCOPE-${uuidv4().substring(0, 8).toUpperCase()}`;
    const redemptionData: any = {};

    // إعداد redemption_data حسب نوع الجائزة
    if (reward.reward_type === 'wallet_credit') {
      // TODO: إضافة للمحفظة عبر wallet service
      redemptionData.amount = 0; // سيتم ملؤه من redemption_instructions أو إعدادات
      redemptionData.currency = 'EGP';
    } else if (reward.reward_type === 'discount_code') {
      redemptionData.code = redemptionCode;
      redemptionData.discount_percent = 0; // سيتم ملؤه من redemption_instructions
    }

    const { data: redemption, error: redemptionError } = await supabase
      .from('club_reward_redemptions')
      .insert([
        {
          user_id: request.userId,
          reward_id: request.rewardId,
          points_spent: reward.points_required,
          redemption_code: redemptionCode,
          redemption_type: reward.reward_type,
          redemption_data: redemptionData,
          status: 'completed',
          redeemed_at: new Date().toISOString(),
          expires_at: reward.valid_until || null,
        },
      ])
      .select(`
        *,
        club_rewards:reward_id (
          title,
          image_url
        ),
        new_profiles:user_id (
          full_name,
          phone_number
        )
      `)
      .single();

    if (redemptionError) throw redemptionError;

    // 6. تحديث quantity_redeemed
    await supabase
      .from('club_rewards')
      .update({
        quantity_redeemed: reward.quantity_redeemed + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', request.rewardId);

    // 7. تطبيق الجائزة (حسب النوع)
    if (reward.reward_type === 'wallet_credit') {
      // TODO: إضافة للمحفظة
      // await walletService.addBalance(request.userId, redemptionData.amount);
    }

    return {
      ...redemption,
      reward_title: (redemption as any).club_rewards?.title,
      reward_image: (redemption as any).club_rewards?.image_url,
      user_name: (redemption as any).new_profiles?.full_name,
      user_phone: (redemption as any).new_profiles?.phone_number,
    };
  },

  /**
   * الحصول على سجلات الاستبدال
   */
  async getRedemptions(filters?: {
    user_id?: string;
    reward_id?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: RewardRedemption[]; count: number }> {
    let query = supabase
      .from('club_reward_redemptions')
      .select(`
        *,
        club_rewards:reward_id (
          title,
          image_url
        ),
        new_profiles:user_id (
          full_name,
          phone_number
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    if (filters?.reward_id) {
      query = query.eq('reward_id', filters.reward_id);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
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
        reward_title: item.club_rewards?.title,
        reward_image: item.club_rewards?.image_url,
        user_name: item.new_profiles?.full_name,
        user_phone: item.new_profiles?.phone_number,
        club_rewards: undefined,
        new_profiles: undefined,
      })),
      count: count || 0,
    };
  },

  /**
   * الحصول على جائزة مستبدلة محددة
   */
  async getRedemptionById(id: string): Promise<RewardRedemption | null> {
    const { data, error } = await supabase
      .from('club_reward_redemptions')
      .select(`
        *,
        club_rewards:reward_id (
          title,
          image_url
        ),
        new_profiles:user_id (
          full_name,
          phone_number
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    if (!data) return null;

    return {
      ...data,
      reward_title: (data as any).club_rewards?.title,
      reward_image: (data as any).club_rewards?.image_url,
      user_name: (data as any).new_profiles?.full_name,
      user_phone: (data as any).new_profiles?.phone_number,
    };
  },
};
