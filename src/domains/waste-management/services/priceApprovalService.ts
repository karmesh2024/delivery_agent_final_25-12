import { supabase } from '@/lib/supabase';
import { toast } from 'react-toastify';

/**
 * أنواع طلبات الموافقة على التسعير
 */
export type PriceApprovalType = 'price_change' | 'base_price_set';

/**
 * حالة طلب الموافقة
 */
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

/**
 * طلب موافقة على تغيير السعر
 */
export interface PriceApprovalRequest {
  id?: string;
  waste_material_id: string; // من catalog_waste_materials
  stock_exchange_id?: number; // من stock_exchange (إن وجد)
  approval_type: PriceApprovalType;
  old_price?: number;
  new_price: number;
  price_change_percentage: number; // نسبة التغيير
  reason: string;
  requested_by: string; // user_id
  status: ApprovalStatus;
  approved_by?: string;
  approval_notes?: string;
  created_at?: string;
  approved_at?: string;
  rejected_at?: string;
}

/**
 * خدمة الموافقة على التسعير
 */
export const priceApprovalService = {
  /**
   * إنشاء طلب موافقة على تغيير السعر
   */
  async createApprovalRequest(
    request: Omit<PriceApprovalRequest, 'id' | 'status' | 'created_at'>
  ): Promise<PriceApprovalRequest | null> {
    try {
      if (!supabase) {
        toast.error('خدمة Supabase غير متاحة');
        return null;
      }

      // حساب نسبة التغيير إذا كان هناك سعر قديم
      let priceChangePercentage = 0;
      if (request.old_price && request.old_price > 0) {
        priceChangePercentage = ((request.new_price - request.old_price) / request.old_price) * 100;
      }

      // التأكد من وجود requested_by
      if (!request.requested_by) {
        toast.error('لم يتم تحديد المستخدم مقدم الطلب');
        return null;
      }

      const approvalRequest: Omit<PriceApprovalRequest, 'id' | 'created_at'> = {
        ...request,
        price_change_percentage: priceChangePercentage,
        status: 'pending',
      };

      if (!supabase) throw new Error('Supabase client is not initialized');
      const { data, error } = await supabase
        .from('waste_price_approval_requests')
        .insert([approvalRequest])
        .select()
        .single();

      if (error) {
        console.error('خطأ في إنشاء طلب الموافقة:', JSON.stringify(error, null, 2));
        toast.error(`فشل في إنشاء طلب الموافقة: ${error.message || 'خطأ غير معروف'}`);
        return null;
      }

      toast.success('تم إنشاء طلب الموافقة بنجاح');
      return data as PriceApprovalRequest;
    } catch (error) {
      console.error('خطأ في إنشاء طلب الموافقة:', error);
      toast.error('حدث خطأ أثناء إنشاء طلب الموافقة');
      return null;
    }
  },

  /**
   * جلب طلبات الموافقة المعلقة
   */
  async getPendingApprovals(): Promise<PriceApprovalRequest[]> {
    try {
      if (!supabase) {
        return [];
      }

      if (!supabase) throw new Error('Supabase client is not initialized');
      const { data, error } = await supabase
        .from('waste_price_approval_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('خطأ في جلب طلبات الموافقة:', error);
        return [];
      }

      return (data || []) as PriceApprovalRequest[];
    } catch (error) {
      console.error('خطأ في جلب طلبات الموافقة:', error);
      return [];
    }
  },

  /**
   * الموافقة على طلب تغيير السعر
   */
  async approveRequest(
    requestId: string,
    approverId: string,
    notes?: string
  ): Promise<boolean> {
    try {
      if (!supabase) {
        toast.error('خدمة Supabase غير متاحة');
        return false;
      }

      // جلب طلب الموافقة
      if (!supabase) throw new Error('Supabase client is not initialized');
      const { data: request, error: fetchError } = await supabase
        .from('waste_price_approval_requests')
        .select('*')
        .eq('id', requestId)
        .eq('status', 'pending')
        .single();

      if (fetchError || !request) {
        toast.error('طلب الموافقة غير موجود أو تمت معالجته');
        return false;
      }

      // تحديث حالة الطلب
      if (!supabase) throw new Error('Supabase client is not initialized');
      const { error: updateError } = await supabase
        .from('waste_price_approval_requests')
        .update({
          status: 'approved',
          approved_by: approverId,
          approval_notes: notes,
          approved_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (updateError) {
        console.error('خطأ في الموافقة على الطلب:', updateError);
        toast.error('فشل في الموافقة على الطلب');
        return false;
      }

      // تطبيق تغيير السعر في stock_exchange
      if (request.stock_exchange_id) {
        if (!supabase) throw new Error('Supabase client is not initialized');
        const { error: priceUpdateError } = await supabase
          .from('stock_exchange')
          .update({
            buy_price: request.new_price,
            last_update: new Date().toISOString(),
            price_change_percentage: request.price_change_percentage,
          })
          .eq('id', request.stock_exchange_id);

        if (priceUpdateError) {
          console.error('خطأ في تحديث السعر:', priceUpdateError);
          toast.error('تمت الموافقة لكن فشل تحديث السعر');
          return false;
        }
      } else {
        // إنشاء سجل جديد في stock_exchange
        if (!supabase) throw new Error('Supabase client is not initialized');
        const { error: createError } = await supabase
          .from('stock_exchange')
          .insert([{
            product_id: request.waste_material_id,
            buy_price: request.new_price,
            base_price: request.new_price,
            sell_price: request.new_price * 1.2, // هامش ربح 20%
            auto_update_enabled: false,
            last_update: new Date().toISOString(),
            price_change_percentage: request.price_change_percentage,
          }]);

        if (createError) {
          console.error('خطأ في إنشاء سجل السعر:', createError);
          toast.error('تمت الموافقة لكن فشل إنشاء سجل السعر');
          return false;
        }
      }

      // تسجيل في تاريخ الأسعار
      await this.logPriceHistory(request);

      toast.success('تمت الموافقة على تغيير السعر بنجاح');
      return true;
    } catch (error) {
      console.error('خطأ في الموافقة على الطلب:', error);
      toast.error('حدث خطأ أثناء الموافقة على الطلب');
      return false;
    }
  },

  /**
   * رفض طلب تغيير السعر
   */
  async rejectRequest(
    requestId: string,
    approverId: string,
    reason: string
  ): Promise<boolean> {
    try {
      if (!supabase) {
        toast.error('خدمة Supabase غير متاحة');
        return false;
      }

      if (!supabase) throw new Error('Supabase client is not initialized');
      const { error } = await supabase
        .from('waste_price_approval_requests')
        .update({
          status: 'rejected',
          approved_by: approverId,
          approval_notes: reason,
          rejected_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) {
        console.error('خطأ في رفض الطلب:', error);
        toast.error('فشل في رفض الطلب');
        return false;
      }

      toast.success('تم رفض طلب تغيير السعر');
      return true;
    } catch (error) {
      console.error('خطأ في رفض الطلب:', error);
      toast.error('حدث خطأ أثناء رفض الطلب');
      return false;
    }
  },

  /**
   * تسجيل تغيير السعر في التاريخ
   */
  async logPriceHistory(request: PriceApprovalRequest): Promise<void> {
    try {
      if (!supabase || !request.stock_exchange_id) return;

      if (!supabase) throw new Error('Supabase client is not initialized');
      await supabase
        .from('exchange_price_history')
        .insert([{
          stock_exchange_id: request.stock_exchange_id,
          product_id: request.waste_material_id,
          old_buy_price: request.old_price || 0,
          new_buy_price: request.new_price,
          old_sell_price: 0,
          new_sell_price: request.new_price * 1.2,
          change_reason: request.reason,
          change_source: 'approval_system',
          changed_by: request.approved_by,
        }]);
    } catch (error) {
      console.error('خطأ في تسجيل تاريخ السعر:', error);
    }
  },
};


