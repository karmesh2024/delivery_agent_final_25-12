import { supabase } from "@/lib/supabase";
import { toast } from "react-toastify";

// استدعاء خدمة إدارة الموردين لاستخدام وظائف الحصول على متوسط الأسعار
import { supplierService } from "../../supplier-management/services/supplierService";

// تعريف نوع البيانات لبورصة المنتجات (مطابق لجدول stock_exchange)
export interface StockExchange {
  id: number;
  category_id: string;
  subcategory_id?: string;
  product_id: string;
  region_id?: number; // Added field
  base_price: number;
  buy_price: number; // السعر الذي نشتري به من العملاء
  sell_price: number; // السعر الذي نبيع به للمصانع
  demand_level?: "low" | "normal" | "high" | "critical";
  supply_level?: "low" | "normal" | "high" | "over_supplied";
  price_change_percentage?: number;
  auto_update_enabled: boolean;
  last_update?: string;
  next_update?: string;
  // علاقات
  category?: { name: string };
  subcategory?: { name: string };
  product?: { name: string };
  catalog_item?: {
    waste_no: string;
    name: string;
    main_category?: { name: string };
    sub_category?: { name: string };
  };
  // حقول إضافية للعرض (يمكن حسابها أو جلبها)
  total_available_stock?: number;
}

export interface PriceHistoryLog {
  stock_exchange_id: number;
  product_id?: string;
  region_id?: number;
  old_buy_price: number;
  new_buy_price: number;
  old_sell_price: number;
  new_sell_price: number;
  change_reason: string;
  change_source: "dashboard" | "system_cron";
  changed_by?: string;
}

// خدمة إدارة نظام البورصة
export const exchangeService = {
  // جلب جميع أسعار البورصة
  async getAllPrices() {
    try {
      if (!supabase) {
        console.error("Supabase client is not initialized.");
        toast.error("خدمة Supabase غير متاحة.");
        return [];
      }
      const { data, error } = await supabase!
        .from("stock_exchange")
        .select(`
          *,
          catalog_item:catalog_waste_materials(
            waste_no,
            name,
            main_category:waste_main_categories(name),
            sub_category:waste_sub_categories(name)
          )
        `)
        .order("id");

      if (error) {
        throw error;
      }

      return data as StockExchange[];
    } catch (error) {
      console.error("خطأ في جلب أسعار البورصة:", error);
      toast.error("حدث خطأ أثناء جلب أسعار البورصة");
      return [];
    }
  },

  // جلب سعر منتج محدد في البورصة
  async getPriceByProductId(productId: string) {
    try {
      if (!supabase) {
        console.error("Supabase client is not initialized.");
        toast.error("خدمة Supabase غير متاحة.");
        return null;
      }
      const { data, error } = await supabase!
        .from("stock_exchange")
        .select(`
          *,
          category:categories(name),
          subcategory:subcategories(name),
          product:waste_data_admin(name)
        `)
        .eq("product_id", productId)
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

  async getMarketTrends() {
    try {
      if (!supabase) {
        console.error("Supabase client is not initialized.");
        return [];
      }
      // Fetch the latest history entry for each item to show immediate trends
      // We use a workaround since 'distinct on' might be tricky with simple client
      // We fetch the last 100 history items and process in JS for now (simpler than complex SQL view update)
      const { data, error } = await supabase!
        .from("exchange_price_history")
        .select("stock_exchange_id, old_buy_price, new_buy_price, created_at")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Filter to keep only the latest per stock_exchange_id
      const latestTrends = data.reduce((acc: any[], curr) => {
        if (
          !acc.find((item) => item.stock_exchange_id === curr.stock_exchange_id)
        ) {
          acc.push({
            stock_exchange_id: curr.stock_exchange_id,
            price_24h_ago: curr.old_buy_price, // Treat old price of latest change as the baseline
            diff: curr.new_buy_price - curr.old_buy_price,
          });
        }
        return acc;
      }, []);

      return latestTrends;
    } catch (error) {
      console.error("Error fetching market trends:", error);
      return [];
    }
  },

  // إضافة منتج جديد للبورصة
  async addProductToExchange(product: Omit<StockExchange, "id">) {
    try {
      // التأكد من ضبط الأسعار الافتراضية
      const newProduct = {
        ...product,
        region_id: product.region_id || 1, // Default region ID (Cairo)
        buy_price: product.buy_price || product.base_price,
        sell_price: product.sell_price || (product.base_price * 1.2), // افتراض هامش ربح 20%
        auto_update_enabled: typeof product.auto_update_enabled === "boolean"
          ? product.auto_update_enabled
          : false, // افتراضي يدوي
        last_update: new Date().toISOString(),
      };

      if (!supabase) {
        console.error("Supabase client is not initialized.");
        toast.error("خدمة Supabase غير متاحة.");
        return null;
      }
      const { data, error } = await supabase!
        .from("stock_exchange")
        .insert([newProduct])
        .select();

      if (error) {
        throw error;
      }

      toast.success("تم إضافة المنتج للبورصة بنجاح");
      return data?.[0] as StockExchange;
    } catch (error) {
      console.error("خطأ في إضافة المنتج للبورصة:", error);
      toast.error("حدث خطأ أثناء إضافة المنتج للبورصة");
      return null;
    }
  },

  // تحديث معلومات منتج في البورصة (تحديث يدوي للسعر)
  async updateExchangeProduct(id: number, product: Partial<StockExchange>) {
    try {
      const updateData: Partial<StockExchange> = { ...product };

      // تحديث وقت التعديل دائماً
      updateData.last_update = new Date().toISOString();

      // إعادة حساب نسبة التغيير إذا تغير سعر الشراء
      if (updateData.buy_price !== undefined && updateData.base_price) {
        updateData.price_change_percentage =
          ((updateData.buy_price - updateData.base_price) /
            updateData.base_price) * 100;
      }

      if (!supabase) {
        console.error("Supabase client is not initialized.");
        toast.error("خدمة Supabase غير متاحة.");
        return null;
      }
      const { data, error } = await supabase!
        .from("stock_exchange")
        .update(updateData)
        .eq("id", id)
        .select();

      if (error) {
        throw error;
      }

      toast.success("تم تحديث معلومات المنتج في البورصة بنجاح");
      return data?.[0] as StockExchange;
    } catch (error) {
      console.error(`خطأ في تحديث المنتج رقم ${id} في البورصة:`, error);
      toast.error("حدث خطأ أثناء تحديث معلومات المنتج في البورصة");
      return null;
    }
  },

  // حذف منتج من البورصة
  async deleteExchangeProduct(id: number) {
    try {
      if (!supabase) {
        console.error("Supabase client is not initialized.");
        toast.error("خدمة Supabase غير متاحة.");
        return false;
      }
      const { error } = await supabase!
        .from("stock_exchange")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }

      toast.success("تم حذف المنتج من البورصة بنجاح");
      return true;
    } catch (error) {
      console.error(`خطأ في حذف المنتج رقم ${id} من البورصة:`, error);
      toast.error("حدث خطأ أثناء حذف المنتج من البورصة");
      return false;
    }
  },

  // تسجيل تاريخ تغيير السعر
  async logPriceHistory(log: PriceHistoryLog) {
    try {
      if (!supabase) return;

      const { error } = await supabase!
        .from("exchange_price_history")
        .insert([{
          ...log,
          created_at: new Date().toISOString(),
        }]);

      if (error) {
        console.error("Failed to log price history:", error);
        // We don't throw here to avoid blocking the main operation if logging fails
      }
    } catch (err) {
      console.error("Error logging price history:", err);
    }
  },
};

export default exchangeService;
