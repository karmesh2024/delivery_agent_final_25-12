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
  // جلب جميع أسعار البورصة (من كتالوج المخلفات كمصدر أساسي)
  async getAllPrices() {
    try {
      if (!supabase) {
        console.error("Supabase client is not initialized.");
        toast.error("خدمة Supabase غير متاحة.");
        return [];
      }
      
      // الخطوة 1: جلب جميع المخلفات من الكتالوج
      const { data: catalogItems, error: catalogError } = await supabase!
        .from("catalog_waste_materials")
        .select(`
          id,
          waste_no,
          name,
          main_category_id,
          sub_category_id,
          expected_price,
          weight,
          created_at
        `)
        .order("created_at", { ascending: false });

      if (catalogError) {
        console.error("خطأ في جلب كتالوج المخلفات:", catalogError);
        throw catalogError;
      }

      // جلب الفئات بشكل منفصل - أولاً من الجداول القديمة ثم البحث عن الموحدة
      const mainCategoryIds = new Set<number>();
      const subCategoryIds = new Set<number>();
      catalogItems?.forEach(item => {
        if (item.main_category_id) mainCategoryIds.add(Number(item.main_category_id));
        if (item.sub_category_id) subCategoryIds.add(Number(item.sub_category_id));
      });

      // جلب الفئات من الجداول القديمة أولاً
      let oldMainCategories: any[] = [];
      let oldSubCategories: any[] = [];
      
      if (mainCategoryIds.size > 0) {
        const { data } = await supabase!
          .from("waste_main_categories")
          .select("id, code, name")
          .in("id", Array.from(mainCategoryIds));
        oldMainCategories = data || [];
      }

      if (subCategoryIds.size > 0) {
        const { data } = await supabase!
          .from("waste_sub_categories")
          .select("id, code, name")
          .in("id", Array.from(subCategoryIds));
        oldSubCategories = data || [];
      }

      // البحث عن الفئات الموحدة المقابلة باستخدام code
      const codes = new Set<string>();
      oldMainCategories.forEach(cat => { if (cat.code) codes.add(cat.code); });
      oldSubCategories.forEach(cat => { if (cat.code) codes.add(cat.code); });

      let unifiedMainCategories: any[] = [];
      let unifiedSubCategories: any[] = [];
      
      if (codes.size > 0) {
        const { data: unifiedMain } = await supabase!
          .from("unified_main_categories")
          .select("id, code, name, name_ar, classification_id")
          .in("code", Array.from(codes))
          .eq("is_active", true);
        unifiedMainCategories = unifiedMain || [];

        const { data: unifiedSub } = await supabase!
          .from("unified_sub_categories")
          .select("id, code, name, name_ar, main_category_id")
          .in("code", Array.from(codes))
          .eq("is_active", true);
        unifiedSubCategories = unifiedSub || [];
      }

      // جلب التصنيفات لعرض التصنيف الكامل
      const classificationIds = new Set<string>();
      unifiedMainCategories.forEach(cat => {
        if (cat.classification_id) classificationIds.add(cat.classification_id);
      });

      let classifications: any[] = [];
      if (classificationIds.size > 0) {
        const { data: classData } = await supabase!
          .from("unified_classifications")
          .select("id, name, name_ar, sector_id")
          .in("id", Array.from(classificationIds))
          .eq("is_active", true);
        classifications = classData || [];
      }

      // جلب القطاعات
      const sectorIds = new Set<string>();
      classifications.forEach(cls => {
        if (cls.sector_id) sectorIds.add(cls.sector_id);
      });

      let sectors: any[] = [];
      if (sectorIds.size > 0) {
        const { data: sectorData } = await supabase!
          .from("unified_sectors")
          .select("id, name, name_ar")
          .in("id", Array.from(sectorIds))
          .eq("is_active", true);
        sectors = sectorData || [];
      }

      // إنشاء خرائط للبحث السريع
      const oldMainCategoryMap = new Map(oldMainCategories.map(cat => [cat.id, cat]));
      const oldSubCategoryMap = new Map(oldSubCategories.map(cat => [cat.id, cat]));
      const unifiedMainCategoryMap = new Map(unifiedMainCategories.map(cat => [cat.code, cat]));
      const unifiedSubCategoryMap = new Map(unifiedSubCategories.map(cat => [cat.code, cat]));
      const classificationMap = new Map(classifications.map(cls => [cls.id, cls]));
      const sectorMap = new Map(sectors.map(sec => [sec.id, sec]));

      if (!catalogItems || catalogItems.length === 0) {
        console.log("لا توجد مواد في كتالوج المخلفات");
        return [];
      }

      // الخطوة 2: جلب أسعار البورصة (إن وجدت)
      const { data: stockPrices, error: stockError } = await supabase!
        .from("stock_exchange")
        .select("*");

      // إنشاء خريطة للأسعار حسب product_id
      const pricesMap = new Map();
      if (stockPrices && !stockError) {
        stockPrices.forEach(price => {
          pricesMap.set(price.product_id, price);
        });
      }

      // الخطوة 3: دمج البيانات - كل مادة من الكتالوج مع سعرها من البورصة
      const mergedData: StockExchange[] = catalogItems.map(item => {
        const existingPrice = pricesMap.get(item.id);
        
        // جلب الفئات من الجداول القديمة أولاً
        const oldMainCategory = item.main_category_id 
          ? oldMainCategoryMap.get(Number(item.main_category_id))
          : null;
        const oldSubCategory = item.sub_category_id 
          ? oldSubCategoryMap.get(Number(item.sub_category_id))
          : null;

        // البحث عن الفئات الموحدة المقابلة
        const unifiedMainCategory = oldMainCategory?.code 
          ? unifiedMainCategoryMap.get(oldMainCategory.code)
          : null;
        const unifiedSubCategory = oldSubCategory?.code 
          ? unifiedSubCategoryMap.get(oldSubCategory.code)
          : null;

        // جلب التصنيف والقطاع
        const classification = unifiedMainCategory?.classification_id
          ? classificationMap.get(unifiedMainCategory.classification_id)
          : null;
        const sector = classification?.sector_id
          ? sectorMap.get(classification.sector_id)
          : null;

        // بناء المسار الكامل: القطاع > التصنيف > الفئة الأساسية
        const mainCategoryName = unifiedMainCategory 
          ? (unifiedMainCategory.name_ar || unifiedMainCategory.name)
          : (oldMainCategory?.name || 'تصنيف عام');
        
        const classificationName = classification 
          ? (classification.name_ar || classification.name)
          : null;
        
        const sectorName = sector 
          ? (sector.name_ar || sector.name)
          : null;

        // بناء المسار الكامل
        let fullPathParts: string[] = [];
        if (sectorName) fullPathParts.push(sectorName);
        if (classificationName) fullPathParts.push(classificationName);
        if (mainCategoryName) fullPathParts.push(mainCategoryName);
        
        const fullPath = fullPathParts.length > 0 
          ? fullPathParts.join(' > ')
          : 'تصنيف عام';
        
        // اسم مختصر للعرض (الفئة الأساسية فقط)
        const shortName = mainCategoryName;
        
        const mainCategory = {
          name: shortName,
          full_path: fullPath
        };
        
        const subCategory = unifiedSubCategory 
          ? { name: unifiedSubCategory.name_ar || unifiedSubCategory.name }
          : (oldSubCategory ? { name: oldSubCategory.name } : null);
        
        // إذا كان للمادة سعر موجود في البورصة، استخدمه
        if (existingPrice) {
          return {
            ...existingPrice,
            catalog_item: {
              waste_no: item.waste_no,
              name: item.name || item.waste_no,
              main_category: mainCategory,
              sub_category: subCategory,
            }
          };
        }
        
        // إذا لم يكن للمادة سعر، أنشئ سجل افتراضي
        const basePrice = item.expected_price || 10; // سعر افتراضي
        return {
          id: 0, // سيتم تحديثه عند الحفظ
          product_id: item.id?.toString() || '',
          category_id: item.main_category_id?.toString() || '',
          subcategory_id: item.sub_category_id?.toString() || '',
          base_price: basePrice,
          buy_price: basePrice,
          sell_price: basePrice * 1.2, // هامش ربح 20%
          auto_update_enabled: false,
          last_update: new Date().toISOString(),
          demand_level: "normal",
          supply_level: "normal",
          price_change_percentage: 0,
          catalog_item: {
            waste_no: item.waste_no,
            name: item.name || item.waste_no,
            main_category: mainCategory,
            sub_category: subCategory,
          },
          total_available_stock: item.weight || 0,
        } as StockExchange;
      });

      console.log(`تم دمج ${mergedData.length} مادة من الكتالوج مع أسعار البورصة`);
      return mergedData;
      
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
  // إذا كان id = 0 يعني أنها مادة جديدة من الكتالوج، سيتم إنشاء سجل جديد
  async updateExchangeProduct(id: number, product: Partial<StockExchange>) {
    try {
      if (!supabase) {
        console.error("Supabase client is not initialized.");
        toast.error("خدمة Supabase غير متاحة.");
        return null;
      }

      const updateData: Partial<StockExchange> = { ...product };

      // تحديث وقت التعديل دائماً
      updateData.last_update = new Date().toISOString();

      // إعادة حساب نسبة التغيير إذا تغير سعر الشراء
      if (updateData.buy_price !== undefined && updateData.base_price) {
        updateData.price_change_percentage =
          ((updateData.buy_price - updateData.base_price) /
            updateData.base_price) * 100;
      }

      // إذا كان id = 0، يعني أنها مادة جديدة من الكتالوج نريد إضافتها للبورصة
      if (id === 0) {
        // التأكد من وجود product_id
        if (!updateData.product_id) {
          toast.error("معرف المنتج مطلوب لإنشاء سجل جديد");
          return null;
        }

        // التحقق إذا كان السجل موجود بالفعل حسب product_id
        const { data: existing } = await supabase!
          .from("stock_exchange")
          .select("id")
          .eq("product_id", updateData.product_id)
          .single();

        if (existing) {
          // السجل موجود، نحدثه
          const { data, error } = await supabase!
            .from("stock_exchange")
            .update(updateData)
            .eq("product_id", updateData.product_id)
            .select();

          if (error) throw error;
          
          toast.success("تم تحديث معلومات المنتج في البورصة بنجاح");
          return data?.[0] as StockExchange;
        } else {
          // السجل غير موجود، ننشئه
          const { data, error } = await supabase!
            .from("stock_exchange")
            .insert([updateData])
            .select();

          if (error) throw error;
          
          toast.success("تم إضافة المنتج للبورصة بنجاح");
          return data?.[0] as StockExchange;
        }
      } else {
        // تحديث سجل موجود حسب id
        const { data, error } = await supabase!
          .from("stock_exchange")
          .update(updateData)
          .eq("id", id)
          .select();

        if (error) throw error;

        toast.success("تم تحديث معلومات المنتج في البورصة بنجاح");
        return data?.[0] as StockExchange;
      }
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
