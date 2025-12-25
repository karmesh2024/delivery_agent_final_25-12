import { supabase } from '@/lib/supabase';
import { toast } from 'react-toastify';

// استدعاء خدمة إدارة الموردين لاستخدام وظائف الحصول على متوسط الأسعار
import { supplierService } from '../../supplier-management/services/supplierService';

// تعريف نوع البيانات لبورصة المنتجات
export interface StockExchange {
  id: number;
  category_id: string;
  subcategory_id?: string;
  product_id: string;
  base_price: number;
  current_price: number;
  last_manual_price?: number;
  last_manual_price_set_at?: string;
  min_allowed_price: number;
  max_allowed_price: number;
  total_available_stock?: number;
  avg_supplier_buy_price?: number;
  demand_level?: 'low' | 'normal' | 'high' | 'critical';
  supply_level?: 'low' | 'normal' | 'high' | 'over_supplied';
  price_change_percentage?: number;
  auto_update_enabled: boolean;
  last_price_update?: string;
  next_scheduled_update?: string;
  category?: { name: string };
  subcategory?: { name: string };
  product?: { name: string };
}

// خدمة إدارة نظام البورصة
export const exchangeService = {
  // جلب جميع أسعار البورصة
  async getAllPrices() {
    try {
      if (!supabase) {
        console.error('Supabase client is not initialized.');
        toast.error('خدمة Supabase غير متاحة.');
        return [];
      }
      const { data, error } = await supabase!
        .from('stock_exchange')
        .select(`
          *,
          category:categories(name),
          subcategory:subcategories(name),
          product:waste_data_admin(name)
        `)
        .order('category_id');

      if (error) {
        throw error;
      }
      
      return data as StockExchange[];
    } catch (error) {
      console.error('خطأ في جلب أسعار البورصة:', error);
      toast.error('حدث خطأ أثناء جلب أسعار البورصة');
      return [];
    }
  },

  // جلب سعر منتج محدد في البورصة
  async getPriceByProductId(productId: string) {
    try {
      if (!supabase) {
        console.error('Supabase client is not initialized.');
        toast.error('خدمة Supabase غير متاحة.');
        return null;
      }
      const { data, error } = await supabase!
        .from('stock_exchange')
        .select(`
          *,
          category:categories(name),
          subcategory:subcategories(name),
          product:waste_data_admin(name)
        `)
        .eq('product_id', productId)
        .single();

      if (error) {
        throw error;
      }
      
      return data as StockExchange;
    } catch (error) {
      console.error(`خطأ في جلب سعر المنتج ${productId}:`, error);
      return null;
    }
  },

  // إضافة منتج جديد للبورصة
  async addProductToExchange(product: Omit<StockExchange, 'id'>) {
    try {
      // التأكد من ضبط الأسعار الافتراضية
      const newProduct = {
        ...product,
        current_price: product.current_price || product.base_price,
        min_allowed_price: product.min_allowed_price || 0,
        max_allowed_price: product.max_allowed_price || 9999.99,
        auto_update_enabled: typeof product.auto_update_enabled === 'boolean' ? product.auto_update_enabled : true,
        last_price_update: new Date().toISOString()
      };

      if (!supabase) {
        console.error('Supabase client is not initialized.');
        toast.error('خدمة Supabase غير متاحة.');
        return null;
      }
      const { data, error } = await supabase!
        .from('stock_exchange')
        .insert([newProduct])
        .select();

      if (error) {
        throw error;
      }
      
      toast.success('تم إضافة المنتج للبورصة بنجاح');
      return data?.[0] as StockExchange;
    } catch (error) {
      console.error('خطأ في إضافة المنتج للبورصة:', error);
      toast.error('حدث خطأ أثناء إضافة المنتج للبورصة');
      return null;
    }
  },

  // تحديث معلومات منتج في البورصة
  async updateExchangeProduct(id: number, product: Partial<StockExchange>) {
    try {
      // التحقق مما إذا كان هناك تغيير في السعر يدوياً
      const updateData: Partial<StockExchange> = { ...product };
      
      if ('current_price' in product) {
        updateData.last_manual_price = product.current_price;
        updateData.last_manual_price_set_at = new Date().toISOString();
        updateData.last_price_update = new Date().toISOString();
      }

      if (!supabase) {
        console.error('Supabase client is not initialized.');
        toast.error('خدمة Supabase غير متاحة.');
        return null;
      }
      const { data, error } = await supabase!
        .from('stock_exchange')
        .update(updateData)
        .eq('id', id)
        .select();

      if (error) {
        throw error;
      }
      
      toast.success('تم تحديث معلومات المنتج في البورصة بنجاح');
      return data?.[0] as StockExchange;
    } catch (error) {
      console.error(`خطأ في تحديث المنتج رقم ${id} في البورصة:`, error);
      toast.error('حدث خطأ أثناء تحديث معلومات المنتج في البورصة');
      return null;
    }
  },

  // حذف منتج من البورصة
  async deleteExchangeProduct(id: number) {
    try {
      if (!supabase) {
        console.error('Supabase client is not initialized.');
        toast.error('خدمة Supabase غير متاحة.');
        return false;
      }
      const { error } = await supabase!
        .from('stock_exchange')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }
      
      toast.success('تم حذف المنتج من البورصة بنجاح');
      return true;
    } catch (error) {
      console.error(`خطأ في حذف المنتج رقم ${id} من البورصة:`, error);
      toast.error('حدث خطأ أثناء حذف المنتج من البورصة');
      return false;
    }
  },

  // تحديث السعر الديناميكي للمنتج (تنفيذ خوارزمية حساب السعر)
  async calculateAndUpdatePrice(productId: string) {
    try {
      if (!supabase) {
        console.error('Supabase client is not initialized.');
        toast.error('خدمة Supabase غير متاحة.');
        return null;
      }
      // 1. جلب معلومات المنتج الحالية
      const { data: product, error: productError } = await supabase!
        .from('stock_exchange')
        .select('*')
        .eq('product_id', productId)
        .single();

      if (productError) {
        throw productError;
      }

      if (!product) {
        throw new Error(`المنتج غير موجود في البورصة: ${productId}`);
      }

      if (!product.auto_update_enabled) {
        console.log(`التحديث التلقائي للسعر غير مفعل للمنتج: ${productId}`);
        return null;
      }

      // 2. جلب المخزون الحالي للمنتج
      const { data: inventoryItems, error: inventoryError } = await supabase!
        .from('warehouse_inventory')
        .select('quantity, unit')
        .eq('product_id', productId);

      if (inventoryError) {
        throw inventoryError;
      }

      // 3. جلب عروض أسعار الموردين النشطة للمنتج
      const avgSupplierPrice = await supplierService.getAveragePrice(productId);
      
      // 4. حساب السعر الجديد
      const newPrice = await this.calculateNewPrice(product, inventoryItems || [], avgSupplierPrice);
      
      // 5. تحديث السعر في قاعدة البيانات
      const { data: updatedProduct, error: updateError } = await supabase!
        .from('stock_exchange')
        .update({
          current_price: newPrice.price,
          total_available_stock: newPrice.totalStock,
          avg_supplier_buy_price: avgSupplierPrice || product.avg_supplier_buy_price,
          supply_level: newPrice.supplyLevel,
          demand_level: newPrice.demandLevel,
          price_change_percentage: newPrice.priceChangePercentage,
          last_price_update: new Date().toISOString(),
          next_scheduled_update: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString() // 6 ساعات لاحقاً
        })
        .eq('id', product.id)
        .select();

      if (updateError) {
        throw updateError;
      }
      
      console.log(`تم تحديث سعر المنتج ${productId} بنجاح، السعر الجديد: ${newPrice.price}`);
      return updatedProduct?.[0] as StockExchange;
    } catch (error) {
      console.error(`خطأ في حساب وتحديث سعر المنتج ${productId}:`, error);
      return null;
    }
  },

  // خوارزمية حساب السعر الديناميكي
  async calculateNewPrice(
    product: StockExchange, 
    inventoryItems: { quantity: number; unit: string }[],
    avgSupplierPrice?: number | null
  ) {
    const basePrice = product.base_price;
    let newPrice = basePrice;

    // 1. حساب إجمالي المخزون المتاح
    const totalStock = inventoryItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    
    // 2. تأثير المخزون (العرض) - كلما زاد المخزون، انخفض السعر
    let supplyMultiplier = 1.0;
    let supplyLevel: StockExchange['supply_level'] = 'normal';

    if (totalStock < 200) { // نقص حاد في العرض
      supplyMultiplier = 1.15;
      supplyLevel = 'low';
    } else if (totalStock < 500) { // نقص في العرض
      supplyMultiplier = 1.08;
      supplyLevel = 'normal';
    } else if (totalStock > 1000) { // زيادة في العرض
      supplyMultiplier = 0.90;
      supplyLevel = 'high';
    } else if (totalStock > 2000) { // عرض زائد جداً
      supplyMultiplier = 0.80;
      supplyLevel = 'over_supplied';
    } else {
      supplyLevel = 'normal';
    }

    newPrice *= supplyMultiplier;

    // 3. تأثير الطلب (عروض الموردين) - كلما زاد الطلب وارتفعت عروض الموردين، ارتفع سعر الشراء
    let demandLevel: StockExchange['demand_level'] = 'normal';
    
    // إذا كان متوسط سعر الموردين متوفراً، فإنه يؤثر على السعر النهائي
    if (avgSupplierPrice && avgSupplierPrice > 0) {
      // إذا كان متوسط سعر الموردين أعلى بكثير من السعر الأساسي، فهذا يعني طلبًا مرتفعًا
      if (avgSupplierPrice > basePrice * 1.2) {
        demandLevel = 'high';
      } else if (avgSupplierPrice > basePrice * 1.5) {
        demandLevel = 'critical';
      } else if (avgSupplierPrice < basePrice * 0.8) {
        demandLevel = 'low';
      }
      
      // دمج تأثير متوسط سعر الموردين (مثال: 70% وزن للسعر الأساسي المعدل، 30% لمتوسط سعر الموردين)
      newPrice = (newPrice * 0.7) + (avgSupplierPrice * 0.3);
    } else {
      demandLevel = 'normal';
    }

    // 4. تطبيق حدود التغيير للحماية من التقلبات الشديدة
    const maxAllowedPrice = product.max_allowed_price || basePrice * 1.5; // 50% زيادة كحد أقصى
    const minAllowedPrice = product.min_allowed_price || basePrice * 0.5; // 50% انخفاض كحد أقصى
    
    newPrice = Math.max(minAllowedPrice, Math.min(maxAllowedPrice, newPrice));

    // 5. حساب نسبة التغيير
    const priceChangePercentage = ((newPrice - basePrice) / basePrice) * 100;

    return {
      price: newPrice,
      totalStock,
      supplyLevel,
      demandLevel,
      priceChangePercentage
    };
  },

  // تحديث أسعار جميع المنتجات في البورصة
  async updateAllPrices() {
    try {
      if (!supabase) {
        console.error('Supabase client is not initialized.');
        toast.error('خدمة Supabase غير متاحة.');
        return false;
      }
      // 1. جلب جميع المنتجات التي لديها تحديث تلقائي للسعر مفعل
      const { data: products, error } = await supabase!
        .from('stock_exchange')
        .select('product_id')
        .eq('auto_update_enabled', true);

      if (error) {
        throw error;
      }

      // 2. تحديث سعر كل منتج على حدة
      const updatePromises = products.map(product => 
        this.calculateAndUpdatePrice(product.product_id)
      );

      await Promise.all(updatePromises);

      return true;
    } catch (error) {
      console.error('خطأ في تحديث أسعار البورصة:', error);
      return false;
    }
  }
};

export default exchangeService; 