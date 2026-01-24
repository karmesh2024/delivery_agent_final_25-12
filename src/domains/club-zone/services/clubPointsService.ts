/**
 * Club Points Service
 * إدارة نقاط النادي (كسب، استخدام، تحويل)
 */

import { supabase } from '@/lib/supabase';
import {
  ClubPointsWallet,
  ClubPointsTransaction,
  ClubPointsTransactionType,
  PointsSource,
  PointsStats,
  PointsConversionRequest,
  RecyclingConversionRequest,
  RecyclingConversionRequestStatus,
} from '../types';

export const clubPointsService = {
  /**
   * الحصول على محفظة نقاط النادي لمستخدم محدد
   */
  async getPointsWallet(userId: string): Promise<ClubPointsWallet | null> {
    const { data, error } = await supabase
      .from('club_points_wallet')
      .select(`
        *,
        new_profiles:user_id (
          id,
          full_name
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
    };
  },

  /**
   * ملخص رصيد النقاط للمستخدم (V1.3)
   * يستخدم Database Function: get_user_points_summary
   */
  async getUserPointsSummary(userId: string): Promise<{
    pending_points: number;
    available_points: number;
    used_points: number;
    total_balance: number;
    lifetime_points: number;
  } | null> {
    const { data, error } = await supabase.rpc('get_user_points_summary', {
      p_user_id: userId,
    });

    if (error) throw error;
    if (!data) return null;
    // Supabase may return an array for RETURNS TABLE
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return null;

    return {
      pending_points: row.pending_points ?? 0,
      available_points: row.available_points ?? 0,
      used_points: row.used_points ?? 0,
      total_balance: row.total_balance ?? 0,
      lifetime_points: row.lifetime_points ?? 0,
    };
  },

  /**
   * الحصول على معاملات نقاط النادي مع فلاتر
   */
  async getPointsTransactions(filters?: {
    user_id?: string;
    transaction_type?: ClubPointsTransactionType;
    source?: PointsSource;
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: ClubPointsTransaction[]; count: number }> {
    let query = supabase
      .from('club_points_transactions')
      .select(`
        *,
        new_profiles:user_id (
          id,
          full_name,
          phone_number
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    if (filters?.transaction_type) {
      query = query.eq('transaction_type', filters.transaction_type);
    }

    if (filters?.source) {
      query = query.eq('source', filters.source);
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
        user_name: item.new_profiles?.full_name,
        user_phone: item.new_profiles?.phone_number,
      })),
      count: count || 0,
    };
  },

  /**
   * إضافة نقاط (كسب)
   * يستخدم Database Function: update_club_points_wallet
   */
  async addPoints(
    userId: string,
    points: number,
    transactionType: ClubPointsTransactionType,
    source?: PointsSource,
    reason?: string,
    description?: string,
    createdBy?: string
  ): Promise<string> {
    const { data, error } = await supabase.rpc('update_club_points_wallet', {
      p_user_id: userId,
      p_points: points,
      p_transaction_type: transactionType,
      p_reason: reason || null,
      p_source: source || null,
      p_description: description || null,
      p_created_by: createdBy || null,
    });

    if (error) throw error;
    return data; // transaction_id
  },

  /**
   * خصم نقاط (استخدام)
   */
  async deductPoints(
    userId: string,
    points: number,
    reason?: string,
    source?: PointsSource,
    description?: string
  ): Promise<string> {
    return this.addPoints(
      userId,
      -Math.abs(points),
      ClubPointsTransactionType.USED,
      source,
      reason,
      description
    );
  },

  /**
   * طلب تحويل نقاط المخلفات إلى نقاط النادي (Request Only) - V1.3
   */
  async createRecyclingConversionRequest(params: {
    userId: string;
    recyclingPoints: number;
    conversionRate?: number; // default 30%
  }): Promise<RecyclingConversionRequest> {
    const rate = params.conversionRate ?? 0.3;
    const expected = Math.floor(params.recyclingPoints * rate);

    const { data, error } = await supabase
      .from('recycling_conversion_requests')
      .insert([
        {
          user_id: params.userId,
          recycling_points: params.recyclingPoints,
          club_points_expected: expected,
          status: 'PENDING',
        },
      ])
      .select(`
        *,
        new_profiles:user_id (
          full_name,
          phone_number
        )
      `)
      .single();

    if (error) throw error;

    return {
      ...(data as any),
      user_name: (data as any).new_profiles?.full_name,
      user_phone: (data as any).new_profiles?.phone_number,
    };
  },

  async listRecyclingConversionRequests(filters?: {
    user_id?: string;
    status?: RecyclingConversionRequestStatus;
    limit?: number;
    offset?: number;
  }): Promise<{ data: RecyclingConversionRequest[]; count: number }> {
    let query = supabase
      .from('recycling_conversion_requests')
      .select(
        `
        *,
        new_profiles:user_id (
          full_name,
          phone_number
        )
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false });

    if (filters?.user_id) query = query.eq('user_id', filters.user_id);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.limit) query = query.limit(filters.limit);
    if (filters?.offset !== undefined) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error, count } = await query;
    if (error) {
      console.error('[clubPointsService] Error fetching conversion requests:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      throw error;
    }

    return {
      data: (data || []).map((row: any) => ({
        ...row,
        user_name: row.new_profiles?.full_name,
        user_phone: row.new_profiles?.phone_number,
      })),
      count: count || 0,
    };
  },

  async approveRecyclingConversionRequest(params: {
    requestId: string;
    processedBy: string;
  }): Promise<{ clubTransactionId: string }> {
    // 1) load request
    const { data: req, error: reqErr } = await supabase
      .from('recycling_conversion_requests')
      .select('*')
      .eq('id', params.requestId)
      .single();
    if (reqErr) throw reqErr;
    if (!req) throw new Error('طلب التحويل غير موجود');
    if (req.status !== 'PENDING') throw new Error('لا يمكن اعتماد طلب غير معلّق');

    // 2) deduct waste points (Economic) - V1.3 minimal integration:
    // we record a waste points transaction row; the actual economic balance is handled by that subsystem.
    const { data: wasteProfile, error: wasteProfileErr } = await supabase
      .from('new_profiles')
      .select('points')
      .eq('id', req.user_id)
      .single();
    if (wasteProfileErr) throw wasteProfileErr;
    if ((wasteProfile.points || 0) < req.recycling_points) {
      throw new Error('رصيد نقاط المخلفات غير كافي');
    }

    // 3) update economic points balance and insert into points_transactions (financial-management table)
    const balanceBefore = wasteProfile.points || 0;
    const balanceAfter = balanceBefore - req.recycling_points;

    const { error: updWasteErr } = await supabase
      .from('new_profiles')
      .update({ points: balanceAfter })
      .eq('id', req.user_id);
    if (updWasteErr) throw updWasteErr;

    await supabase.from('points_transactions').insert([
      {
        profile_id: req.user_id,
        transaction_type: 'USED',
        points: -Math.abs(req.recycling_points),
        points_value: null,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        description: `خصم نقاط مخلفات مقابل مكافأة نقاط نادي (طلب ${req.id})`,
        created_by: params.processedBy,
      },
    ]);

    // 4) award club points as EARNED (pending) via function
    const clubTransactionId = await this.addPoints(
      req.user_id,
      req.club_points_expected,
      ClubPointsTransactionType.EARNED,
      'waste_collection',
      'مكافأة نقاط نادي من المخلفات',
      `مكافأة ${req.club_points_expected} نقطة نادي مقابل ${req.recycling_points} نقطة مخلفات (طلب ${req.id})`,
      params.processedBy
    );

    // 5) mark request approved
    const { error: updReqErr } = await supabase
      .from('recycling_conversion_requests')
      .update({
        status: 'APPROVED',
        processed_by: params.processedBy,
        processed_at: new Date().toISOString(),
        rejection_reason: null,
      })
      .eq('id', req.id);
    if (updReqErr) throw updReqErr;

    return { clubTransactionId };
  },

  async rejectRecyclingConversionRequest(params: {
    requestId: string;
    processedBy: string;
    rejectionReason: string;
  }): Promise<void> {
    const { data: req, error: reqErr } = await supabase
      .from('recycling_conversion_requests')
      .select('id,status')
      .eq('id', params.requestId)
      .single();
    if (reqErr) throw reqErr;
    if (!req) throw new Error('طلب التحويل غير موجود');
    if (req.status !== 'PENDING') throw new Error('لا يمكن رفض طلب غير معلّق');

    const { error } = await supabase
      .from('recycling_conversion_requests')
      .update({
        status: 'REJECTED',
        processed_by: params.processedBy,
        processed_at: new Date().toISOString(),
        rejection_reason: params.rejectionReason,
      })
      .eq('id', params.requestId);
    if (error) throw error;
  },

  /**
   * الحصول على نسبة التحويل من الإعدادات
   */
  async getConversionRate(): Promise<number> {
    const { data, error } = await supabase
      .from('club_settings')
      .select('value')
      .eq('key', 'waste_to_club_conversion')
      .single();

    if (error || !data) return 0.3; // Default 30%

    const setting = data.value as { rate: number; enabled: boolean };
    return setting.enabled ? setting.rate : 0;
  },

  /**
   * الحصول على إحصائيات النقاط
   */
  async getPointsStats(userId?: string): Promise<PointsStats> {
    const filters: any = {};
    if (userId) filters.user_id = userId;

    const { data: transactions, error } = await supabase
      .from('club_points_transactions')
      .select('transaction_type, points, source')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (userId) {
      filters.user_id = userId;
      const wallet = await this.getPointsWallet(userId);
      if (!wallet) {
        return {
          total_balance: 0,
          total_earned: 0,
          total_used: 0,
          total_pending: 0,
          by_source: [],
        };
      }
    }

    let total_earned = 0;
    let total_used = 0;
    const by_source: Record<string, number> = {};

    (transactions || []).forEach((tx: any) => {
      if (userId && tx.user_id !== userId) return;

      if (tx.transaction_type === 'EARNED' || tx.transaction_type === 'BONUS' || tx.transaction_type === 'CONVERTED') {
        total_earned += tx.points || 0;
        if (tx.source) {
          by_source[tx.source] = (by_source[tx.source] || 0) + (tx.points || 0);
        }
      } else if (tx.transaction_type === 'USED') {
        total_used += Math.abs(tx.points || 0);
      }
    });

    const stats: PointsStats = {
      total_balance: 0, // TODO: من wallet إذا userId محدد
      total_earned,
      total_used,
      total_pending: total_earned - total_used,
      by_source: Object.entries(by_source).map(([source, points]) => ({
        source: source as PointsSource,
        points,
      })),
    };

    if (userId) {
      const wallet = await this.getPointsWallet(userId);
      stats.total_balance = wallet?.points_balance || 0;
    }

    return stats;
  },

  /**
   * اعتماد النقاط الشهرية (V1.3)
   * يستدعي Database Function: activate_monthly_points
   */
  async activateMonthlyPoints(params: {
    settlementMonth: string; // 'YYYY-MM'
    processedBy: string;
    notes?: string;
  }): Promise<{ settlementId: string }> {
    try {
      // التأكد من أن المعاملات بالترتيب الصحيح: p_settlement_month, p_processed_by, p_notes
      const { data, error } = await supabase.rpc('activate_monthly_points', {
        p_settlement_month: params.settlementMonth,
        p_processed_by: params.processedBy,
        p_notes: params.notes || null,
      });

      if (error) {
        console.error('[clubPointsService] Error activating monthly points:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        
        // ✅ V1.5.1: معالجة خطأ duplicate key
        if (error.message?.includes('duplicate key') || 
            error.message?.includes('monthly_points_settlement_settlement_month_key') ||
            error.message?.includes('تم اعتماد نقاطه مسبقاً')) {
          throw new Error(
            `شهر ${params.settlementMonth} تم اعتماد نقاطه مسبقاً. لا يمكن اعتماد نفس الشهر مرتين.`
          );
        }
        
        // إذا كانت المشكلة أن الدالة غير موجودة، نعطي رسالة أوضح
        if (error.message?.includes('Could not find the function') || error.code === '42883') {
          throw new Error(
            'الدالة activate_monthly_points غير موجودة في قاعدة البيانات. ' +
            'يرجى التأكد من تطبيق Migration: 20250121_ensure_activate_monthly_points.sql أو ' +
            '20250122_fix_activate_monthly_points_duplicate_check.sql'
          );
        }
        
        throw error;
      }

      if (!data) {
        throw new Error('لم يتم إرجاع معرف التسوية من قاعدة البيانات');
      }

      return { settlementId: data };
    } catch (err: any) {
      // ✅ V1.5.1: معالجة خطأ "Failed to fetch"
      if (err?.message?.includes('Failed to fetch') || 
          err?.name === 'TypeError' && err?.message?.includes('fetch')) {
        console.error('[clubPointsService] Network error - Failed to fetch:', {
          error: err,
          name: err?.name,
          message: err?.message,
          stack: err?.stack,
          params: {
            settlementMonth: params.settlementMonth,
            processedBy: params.processedBy,
            notes: params.notes,
          },
        });
        
        // التحقق من Supabase connection
        try {
          const { data: { session } } = await supabase.auth.getSession();
          console.log('[clubPointsService] Supabase session check:', {
            hasSession: !!session,
            userId: session?.user?.id,
          });
        } catch (sessionErr) {
          console.error('[clubPointsService] Error checking Supabase session:', sessionErr);
        }
        
        throw new Error(
          '❌ فشل الاتصال بخادم قاعدة البيانات.\n\n' +
          'الأسباب المحتملة:\n' +
          '1. مشكلة في الاتصال بالإنترنت\n' +
          '2. Supabase غير متاح مؤقتاً\n' +
          '3. مشكلة في إعدادات CORS\n' +
          '4. الدالة activate_monthly_points غير موجودة\n\n' +
          'الحل:\n' +
          '- تحقق من اتصالك بالإنترنت\n' +
          '- حاول مرة أخرى بعد بضع ثوان\n' +
          '- تحقق من Supabase Dashboard للتأكد من أن الخدمة تعمل\n' +
          '- تأكد من تطبيق Migration: 20250122_fix_activate_monthly_points_duplicate_check.sql\n' +
          '- افتح Console في المتصفح لمزيد من التفاصيل'
        );
      }
      
      // إعادة رمي الخطأ الأصلي إذا لم يكن "Failed to fetch"
      throw err;
    }
  },
};
