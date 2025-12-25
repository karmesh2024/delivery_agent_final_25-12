import { supabase } from '@/lib/supabase';
import { toast } from 'react-toastify';

// تعريف نوع التنبيه
export interface SystemAlert {
  id: string;
  alert_type: 'stock_low' | 'supplier_offer' | 'price_change' | 'demand_high' | 'supply_low' | 'warehouse_capacity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  warehouse_id?: string;
  supplier_id?: string;
  category_id?: string;
  subcategory_id?: string;
  product_id?: string;
  is_read: boolean;
  created_at?: string;
  resolved_at?: string;
  warehouse?: { name: string };
  supplier?: { name: string };
  category?: { name: string };
  subcategory?: { name: string };
  product?: { name: string };
}

// خدمة إدارة التنبيهات
export const alertService = {
  // جلب جميع التنبيهات
  async getAll(includeResolved: boolean = false) {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      let query = supabase!
        .from('system_alerts')
        .select(`
          *,
          warehouse:warehouses(name),
          supplier:suppliers(name),
          category:categories(name),
          subcategory:subcategories(name),
          product:waste_data_admin(name)
        `)
        .order('created_at', { ascending: false });

      if (!includeResolved) {
        query = query.is('resolved_at', null);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }
      
      return data as SystemAlert[];
    } catch (error) {
      console.error('خطأ في جلب التنبيهات:', error);
      toast.error('حدث خطأ أثناء جلب التنبيهات');
      return [];
    }
  },

  // جلب التنبيهات حسب النوع
  async getByType(type: SystemAlert['alert_type'], includeResolved: boolean = false) {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      let query = supabase!
        .from('system_alerts')
        .select(`
          *,
          warehouse:warehouses(name),
          supplier:suppliers(name),
          category:categories(name),
          subcategory:subcategories(name),
          product:waste_data_admin(name)
        `)
        .eq('alert_type', type)
        .order('created_at', { ascending: false });

      if (!includeResolved) {
        query = query.is('resolved_at', null);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }
      
      return data as SystemAlert[];
    } catch (error) {
      console.error(`خطأ في جلب التنبيهات من نوع ${type}:`, error);
      toast.error('حدث خطأ أثناء جلب التنبيهات');
      return [];
    }
  },

  // إنشاء تنبيه جديد
  async createAlert(alert: Omit<SystemAlert, 'id' | 'is_read' | 'created_at' | 'resolved_at'>) {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      const { data, error } = await supabase!
        .from('system_alerts')
        .insert([{ 
          ...alert, 
          is_read: false,
          created_at: new Date().toISOString()
        }])
        .select();

      if (error) {
        throw error;
      }
      
      return data?.[0] as SystemAlert;
    } catch (error) {
      console.error('خطأ في إنشاء تنبيه جديد:', error);
      toast.error('حدث خطأ أثناء إنشاء تنبيه جديد');
      return null;
    }
  },

  // وضع علامة "مقروء" على التنبيه
  async markAsRead(id: string) {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      const { data, error } = await supabase!
        .from('system_alerts')
        .update({ is_read: true })
        .eq('id', id)
        .select();

      if (error) {
        throw error;
      }
      
      return data?.[0] as SystemAlert;
    } catch (error) {
      console.error(`خطأ في وضع علامة قراءة على التنبيه ${id}:`, error);
      toast.error('حدث خطأ أثناء تحديث حالة التنبيه');
      return null;
    }
  },

  // وضع علامة "تمت معالجته" على التنبيه
  async resolveAlert(id: string) {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      const { data, error } = await supabase!
        .from('system_alerts')
        .update({ 
          is_read: true, 
          resolved_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select();

      if (error) {
        throw error;
      }
      
      return data?.[0] as SystemAlert;
    } catch (error) {
      console.error(`خطأ في وضع علامة معالجة على التنبيه ${id}:`, error);
      toast.error('حدث خطأ أثناء تحديث حالة التنبيه');
      return null;
    }
  },

  // حذف تنبيه
  async deleteAlert(id: string) {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      const { error } = await supabase!
        .from('system_alerts')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }
      
      toast.success('تم حذف التنبيه بنجاح');
      return true;
    } catch (error) {
      console.error(`خطأ في حذف التنبيه ${id}:`, error);
      toast.error('حدث خطأ أثناء حذف التنبيه');
      return false;
    }
  },

  // تنبيهات المخزون المنخفض: فحص المخزون وإنشاء تنبيهات إذا وصل أي منتج لمستوى منخفض
  async checkLowStockLevels() {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      // جلب المنتجات التي وصلت لمستوى منخفض
      const { data, error } = await supabase!
        .from('warehouse_inventory')
        .select(`
          *,
          warehouse:warehouses(name),
          product:waste_data_admin(name)
        `)
        .filter('quantity', 'lte', 'min_level')
        .gt('min_level', 0);

      if (error) {
        throw error;
      }

      // إنشاء تنبيه لكل منتج منخفض المخزون
      for (const item of data) {
        // تحقق مما إذا كان هناك تنبيه مشابه غير معالج
        const { data: existingAlerts } = await supabase!
          .from('system_alerts')
          .select('id')
          .eq('alert_type', 'stock_low')
          .eq('warehouse_id', item.warehouse_id)
          .eq('product_id', item.product_id)
          .is('resolved_at', null)
          .limit(1);

        if (existingAlerts && existingAlerts.length > 0) {
          // تنبيه مشابه موجود بالفعل، تخطي
          continue;
        }

        // إنشاء تنبيه جديد
        await this.createAlert({
          alert_type: 'stock_low',
          severity: item.quantity <= 0 ? 'critical' : 
                   (item.quantity <= item.min_level / 2) ? 'high' : 'medium',
          message: `المخزون منخفض للمنتج "${item.product?.name}" في المخزن "${item.warehouse?.name}". الكمية الحالية: ${item.quantity} ${item.unit}، الحد الأدنى: ${item.min_level} ${item.unit}.`,
          warehouse_id: item.warehouse_id,
          product_id: item.product_id,
          category_id: item.category_id,
          subcategory_id: item.subcategory_id
        });
      }

      return true;
    } catch (error) {
      console.error('خطأ في فحص مستويات المخزون المنخفضة:', error);
      return false;
    }
  },

  // تنبيهات عروض الموردين: إنشاء تنبيهات لعروض الأسعار الجديدة من الموردين
  async createSupplierOfferAlert(
    supplierId: string,
    supplierName: string, 
    productId: string,
    productName: string,
    proposedPrice: number
  ) {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      await this.createAlert({
        alert_type: 'supplier_offer',
        severity: 'medium',
        message: `عرض سعر جديد من ${supplierName} للمنتج ${productName} بسعر ${proposedPrice} جنيه/كجم. `,
        supplier_id: supplierId,
        product_id: productId,
      });
    } catch (error) {
      console.error('خطأ في إنشاء تنبيه عرض المورد:', error);
    }
  },

  // تنبيهات تغير السعر: إنشاء تنبيه عند تغير كبير في السعر
  async createPriceChangeAlert(
    productId: string,
    productName: string,
    oldPrice: number,
    newPrice: number,
    changePercentage: number
  ) {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      await this.createAlert({
        alert_type: 'price_change',
        severity: 'high',
        message: `تغير كبير في سعر ${productName}: من ${oldPrice} إلى ${newPrice} (${changePercentage}%).`,
        product_id: productId,
      });
    } catch (error) {
      console.error('خطأ في إنشاء تنبيه تغير السعر:', error);
    }
  },

  // جلب عدد التنبيهات غير المقروءة
  async getUnreadCount() {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      const { count, error } = await supabase!
        .from('system_alerts')
        .select('id', { count: 'exact', head: true })
        .is('is_read', false);

      if (error) {
        throw error;
      }
      
      return count || 0;
    } catch (error) {
      console.error('خطأ في جلب عدد التنبيهات غير المقروءة:', error);
      return 0;
    }
  }
};

export default alertService; 