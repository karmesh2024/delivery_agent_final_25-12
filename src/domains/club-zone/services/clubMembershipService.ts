/**
 * Club Membership Service
 * إدارة عضوية النادي
 */

import { supabase } from '@/lib/supabase';
import { ClubMembership, ClubMembershipFormData, MembershipLevel, MembershipStats } from '../types';

export const clubMembershipService = {
  /**
   * الحصول على جميع العضويات مع فلاتر
   */
  async getMemberships(filters?: {
    membership_level?: MembershipLevel;
    is_active?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ data: ClubMembership[]; count: number }> {
    let query = supabase
      .from('club_memberships')
      .select(`
        *,
        new_profiles:user_id (
          id,
          full_name,
          phone_number,
          email
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (filters?.membership_level) {
      query = query.eq('membership_level', filters.membership_level);
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

    return {
      data: (data || []).map((item: any) => ({
        ...item,
        user_name: item.new_profiles?.full_name,
        user_phone: item.new_profiles?.phone_number,
        user_email: item.new_profiles?.email,
      })),
      count: count || 0,
    };
  },

  /**
   * الحصول على عضوية مستخدم محدد
   */
  async getMembershipByUserId(userId: string): Promise<ClubMembership | null> {
    const { data, error } = await supabase
      .from('club_memberships')
      .select(`
        *,
        new_profiles:user_id (
          id,
          full_name,
          phone_number,
          email
        )
      `)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    if (!data) return null;

    return {
      ...data,
      user_name: (data as any).new_profiles?.full_name,
      user_phone: (data as any).new_profiles?.phone_number,
      user_email: (data as any).new_profiles?.email,
    };
  },

  /**
   * تحديث مستوى العضوية
   */
  async updateMembershipLevel(
    userId: string,
    newLevel: MembershipLevel,
    endDate?: string
  ): Promise<ClubMembership> {
    const { data, error } = await supabase
      .from('club_memberships')
      .update({
        membership_level: newLevel,
        end_date: endDate || null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select(`
        *,
        new_profiles:user_id (
          id,
          full_name,
          phone_number,
          email
        )
      `)
      .single();

    if (error) throw error;

    return {
      ...data,
      user_name: (data as any).new_profiles?.full_name,
      user_phone: (data as any).new_profiles?.phone_number,
      user_email: (data as any).new_profiles?.email,
    };
  },

  /**
   * إنشاء عضوية جديدة (يدوي - غالباً للشركاء)
   */
  async createMembership(membershipData: ClubMembershipFormData): Promise<ClubMembership> {
    const { data, error } = await supabase
      .from('club_memberships')
      .insert([membershipData])
      .select(`
        *,
        new_profiles:user_id (
          id,
          full_name,
          phone_number,
          email
        )
      `)
      .single();

    if (error) throw error;

    return {
      ...data,
      user_name: (data as any).new_profiles?.full_name,
      user_phone: (data as any).new_profiles?.phone_number,
      user_email: (data as any).new_profiles?.email,
    };
  },

  /**
   * الحصول على إحصائيات العضويات
   */
  async getMembershipStats(): Promise<MembershipStats> {
    const { data, error } = await supabase
      .from('club_memberships')
      .select('membership_level')
      .eq('is_active', true);

    if (error) throw error;

    const stats: MembershipStats = {
      community: 0,
      active: 0,
      ambassador: 0,
      partner: 0,
    };

    (data || []).forEach((item: any) => {
      const level = item.membership_level as MembershipLevel;
      if (level in stats) {
        stats[level]++;
      }
    });

    return stats;
  },

  /**
   * الحصول على عدد الأعضاء الإجمالي
   */
  async getTotalMembers(): Promise<number> {
    const { count, error } = await supabase
      .from('club_memberships')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (error) throw error;
    return count || 0;
  },
};
