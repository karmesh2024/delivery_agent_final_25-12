import { supabase } from '@/lib/supabase';
import { toast } from 'react-toastify';
import { setSubcategoryExchangePrice } from './subcategoryExchangePriceService';

export type SubcategoryApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface SubcategoryPriceApprovalRequest {
  id?: string;
  subcategory_id: number;
  old_price?: number;
  new_price: number;
  price_change_percentage: number;
  reason: string;
  requested_by: string;
  status: SubcategoryApprovalStatus;
  approved_by?: string | null;
  approval_notes?: string | null;
  created_at?: string;
  approved_at?: string | null;
  rejected_at?: string | null;
  subcategory_name?: string;
}

const TABLE = 'subcategory_price_approval_requests';

export const subcategoryPriceApprovalService = {
  async createRequest(
    subcategoryId: number,
    oldPrice: number | null,
    newPrice: number,
    reason: string,
    userId: string
  ): Promise<SubcategoryPriceApprovalRequest | null> {
    if (!supabase) {
      toast.error('خدمة Supabase غير متاحة');
      return null;
    }
    const old = oldPrice ?? 0;
    const priceChangePercentage = old > 0
      ? ((newPrice - old) / old) * 100
      : 0;

    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        subcategory_id: subcategoryId,
        old_price: oldPrice,
        new_price: newPrice,
        price_change_percentage: priceChangePercentage,
        reason,
        requested_by: userId,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('خطأ في إنشاء طلب موافقة سعر الفئة:', error);
      toast.error(error.message || 'فشل في إنشاء طلب الموافقة');
      return null;
    }
    toast.success('تم إرسال طلب الموافقة. التغيير كبير (≥10%) ويحتاج موافقة.');
    return data as SubcategoryPriceApprovalRequest;
  },

  async getPending(): Promise<SubcategoryPriceApprovalRequest[]> {
    if (!supabase) return [];
    let data: Record<string, unknown>[] | null = null;
    const withJoin = await supabase
      .from(TABLE)
      .select('*, waste_sub_categories(name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (!withJoin.error && withJoin.data) {
      data = withJoin.data;
    } else {
      const fallback = await supabase
        .from(TABLE)
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (fallback.error) {
        console.error('خطأ في جلب طلبات موافقة الفئات:', fallback.error);
        return [];
      }
      data = fallback.data;
    }
    return (data || []).map((row: Record<string, unknown>) => {
      const { waste_sub_categories: wsc, ...rest } = row;
      const name = (wsc as { name?: string } | null)?.name ?? String(row.subcategory_id);
      return { ...rest, subcategory_name: name } as SubcategoryPriceApprovalRequest;
    });
  },

  async approve(requestId: string, approverId: string, notes?: string): Promise<boolean> {
    if (!supabase) {
      toast.error('خدمة Supabase غير متاحة');
      return false;
    }
    const { data: req, error: fetchError } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', requestId)
      .eq('status', 'pending')
      .single();

    if (fetchError || !req) {
      toast.error('طلب الموافقة غير موجود أو تمت معالجته');
      return false;
    }

    const { error: updateError } = await supabase
      .from(TABLE)
      .update({
        status: 'approved',
        approved_by: approverId,
        approval_notes: notes ?? null,
        approved_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (updateError) {
      toast.error('فشل في تحديث حالة الطلب');
      return false;
    }

    const updated = await setSubcategoryExchangePrice(
      req.subcategory_id,
      req.new_price,
      req.new_price * 1.2,
      approverId
    );
    if (!updated) {
      toast.error('تمت الموافقة لكن فشل تطبيق السعر على الفئة');
      return false;
    }
    toast.success('تمت الموافقة وتطبيق السعر على الفئة بنجاح');
    return true;
  },

  async reject(requestId: string, approverId: string, reason: string): Promise<boolean> {
    if (!supabase) {
      toast.error('خدمة Supabase غير متاحة');
      return false;
    }
    const { error } = await supabase
      .from(TABLE)
      .update({
        status: 'rejected',
        approved_by: approverId,
        approval_notes: reason,
        rejected_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (error) {
      toast.error('فشل في رفض الطلب');
      return false;
    }
    toast.success('تم رفض طلب تغيير السعر');
    return true;
  },
};
