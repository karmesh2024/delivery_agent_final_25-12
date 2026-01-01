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
  last_actual_purchase_price?: number; // آخر سعر تم الشراء به فعلياً من العملاء
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
    main_category?: { name: string; full_path?: string };
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
          .from("warehouse_sectors")
          .select("id, name, code")
          .in("id", Array.from(sectorIds))
          .eq("is_active", true);
        sectors = sectorData || [];
      }

      // جلب categories و subcategories للمطابقة بالاسم
      const { data: categoriesData } = await supabase!
        .from("categories")
        .select("id, name");
      const categoriesMap = new Map((categoriesData || []).map(cat => [cat.name, cat.id]));
      
      const { data: subcategoriesData } = await supabase!
        .from("subcategories")
        .select("id, name");
      const subcategoriesMap = new Map((subcategoriesData || []).map(sub => [sub.name, sub.id]));

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

      // الخطوة 3: جلب waste_data_admin للربط بين catalog_waste_materials و stock_exchange
      // نحتاج إلى ربط catalog_waste_materials.waste_no مع waste_data_admin.name
      // ثم ربط waste_data_admin.id مع stock_exchange.product_id
      const wasteNos = catalogItems.map(item => item.waste_no).filter(Boolean);
      let wasteDataAdminMap = new Map();
      
      if (wasteNos.length > 0) {
        const { data: wasteDataAdmin } = await supabase!
          .from("waste_data_admin")
          .select("id, name")
          .in("name", wasteNos);
        
        if (wasteDataAdmin) {
          wasteDataAdmin.forEach(wda => {
            wasteDataAdminMap.set(wda.name, wda.id);
          });
        }
      }

      // الخطوة 4: دمج البيانات - كل مادة من الكتالوج مع سعرها من البورصة
      const mergedData: StockExchange[] = catalogItems.map(item => {
        // البحث عن product_id من waste_data_admin باستخدام waste_no
        const productId = wasteDataAdminMap.get(item.waste_no);
        const existingPrice = productId ? pricesMap.get(productId) : null;
        
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
          ? sector.name
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
          // تحويل Decimal إلى number
          const basePrice = Number(existingPrice.base_price) || Number(item.expected_price) || 0;
          const buyPrice = Number(existingPrice.buy_price) || basePrice;
          const sellPrice = Number(existingPrice.sell_price) || (basePrice * 1.2);
          
          // حساب نسبة التغيير إذا لم تكن موجودة
          let priceChangePercent = existingPrice.price_change_percentage;
          if (priceChangePercent === undefined || priceChangePercent === null) {
            if (basePrice > 0 && buyPrice !== basePrice) {
              priceChangePercent = ((buyPrice - basePrice) / basePrice) * 100;
            } else {
              priceChangePercent = 0;
            }
          } else {
            priceChangePercent = Number(priceChangePercent);
          }
          
          return {
            ...existingPrice,
            // التأكد من استخدام product_id الصحيح من existingPrice (UUID من waste_data_admin)
            product_id: existingPrice.product_id || productId || item.id?.toString() || '',
            base_price: basePrice,
            buy_price: buyPrice,
            sell_price: sellPrice,
            price_change_percentage: priceChangePercent,
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
        
        // استخدام UUID الصحيحة للفئات من categories و subcategories
        // محاولة المطابقة بالاسم أولاً
        let categoryId = '';
        let subcategoryId = '';
        
        if (oldMainCategory?.name) {
          // البحث عن category_id من categories بالاسم
          for (const [catName, catId] of categoriesMap.entries()) {
            if (catName.includes(oldMainCategory.name) || oldMainCategory.name.includes(catName)) {
              categoryId = catId;
              break;
            }
          }
        }
        
        if (oldSubCategory?.name) {
          // البحث عن subcategory_id من subcategories بالاسم
          for (const [subName, subId] of subcategoriesMap.entries()) {
            if (subName.includes(oldSubCategory.name) || oldSubCategory.name.includes(subName)) {
              subcategoryId = subId;
              break;
            }
          }
        }
        
        // إذا لم نجد مطابقة بالاسم، نستخدم قيم افتراضية من stock_exchange الموجود
        if (!categoryId) {
          // استخدام category_id من stock_exchange الموجود كقيمة افتراضية
          categoryId = '30f1c4b7-041a-4524-81a0-f9c2b6eea208'; // مخلفات بلاستيك
        }
        
        if (!subcategoryId) {
          // استخدام subcategory_id من stock_exchange الموجود كقيمة افتراضية
          subcategoryId = 'aa5c3f93-e406-4f54-a464-e1050f1b3906'; // زجاجات
        }
        
        return {
          id: 0, // سيتم تحديثه عند الحفظ
          product_id: productId || item.id?.toString() || '', // سيتم تحديثه عند إنشاء waste_data_admin
          category_id: categoryId,
          subcategory_id: subcategoryId,
          base_price: basePrice,
          buy_price: basePrice,
          sell_price: basePrice * 1.2, // هامش ربح 20%
          auto_update_enabled: false,
          last_update: new Date().toISOString(),
          demand_level: "normal",
          supply_level: "normal",
          price_change_percentage: 0, // لا يوجد تغيير لأن buy_price = base_price
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
      // جلب أحدث سجل لكل stock_exchange_id
      // نستخدم طريقة أفضل: نجلب جميع السجلات ثم نختار الأحدث لكل stock_exchange_id
      const { data, error } = await supabase!
        .from("exchange_price_history")
        .select("stock_exchange_id, product_id, old_buy_price, new_buy_price, created_at")
        .order("created_at", { ascending: false })
        .limit(200); // زيادة الحد لضمان الحصول على جميع السجلات

      if (error) {
        console.error("خطأ في جلب trends:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log("لا توجد بيانات في exchange_price_history");
        return [];
      }

      // جلب الأسعار الحالية من stock_exchange للمطابقة
      const stockExchangeIds = data
        .map(item => item.stock_exchange_id)
        .filter((id): id is number => id !== null && id !== undefined)
        .map(id => Number(id))
        .filter(id => id > 0);
      
      let currentPricesMap = new Map<number, number>();
      if (stockExchangeIds.length > 0) {
        const { data: currentPrices, error: pricesError } = await supabase!
          .from("stock_exchange")
          .select("id, buy_price")
          .in("id", stockExchangeIds);
        
        if (!pricesError && currentPrices) {
          currentPrices.forEach(price => {
            currentPricesMap.set(Number(price.id), Number(price.buy_price) || 0);
          });
        }
      }

      // تصفية للحصول على آخر سجلين لكل stock_exchange_id
      // نحتاج السجل الثاني (قبل الأخير) للحصول على السعر الذي تم الشراء به فعلياً
      const trendsByStockExchange = new Map<number, any[]>();
      
      data.forEach(curr => {
        const stockExchangeId = curr.stock_exchange_id ? Number(curr.stock_exchange_id) : null;
        if (!stockExchangeId) return;
        
        if (!trendsByStockExchange.has(stockExchangeId)) {
          trendsByStockExchange.set(stockExchangeId, []);
        }
        trendsByStockExchange.get(stockExchangeId)!.push(curr);
      });
      
      // جلب last_actual_purchase_price من stock_exchange
      let lastActualPurchasePricesMap = new Map<number, number>();
      if (stockExchangeIds.length > 0) {
        const { data: actualPurchasePrices, error: actualPricesError } = await supabase!
          .from("stock_exchange")
          .select("id, last_actual_purchase_price")
          .in("id", stockExchangeIds);
        
        if (!actualPricesError && actualPurchasePrices) {
          actualPurchasePrices.forEach(price => {
            if (price.last_actual_purchase_price) {
              lastActualPurchasePricesMap.set(Number(price.id), Number(price.last_actual_purchase_price));
            }
          });
        }
      }
      
      // بناء latestTrends باستخدام last_actual_purchase_price كسعر مرجعي أولاً
      const latestTrends: any[] = [];
      
      trendsByStockExchange.forEach((records, stockExchangeId) => {
        // ترتيب السجلات حسب التاريخ (الأحدث أولاً)
        records.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        // السعر الحالي من stock_exchange
        const currentPrice = currentPricesMap.get(stockExchangeId) || 0;
        
        // استخدام last_actual_purchase_price كسعر مرجعي أولاً (الحل الاحترافي)
        let price24hAgo = lastActualPurchasePricesMap.get(stockExchangeId) || 0;
        
        // إذا لم يكن هناك last_actual_purchase_price، نستخدم السعر من السجل الثاني (قبل الأخير)
        if (price24hAgo === 0) {
          if (records.length === 1) {
            // سجل واحد فقط: نستخدم old_buy_price
            price24hAgo = Number(records[0].old_buy_price) || 0;
          } else if (records.length >= 2) {
            // سجلان أو أكثر: نستخدم new_buy_price من السجل الثاني (قبل الأخير)
            price24hAgo = Number(records[1].new_buy_price) || Number(records[1].old_buy_price) || 0;
          }
          
          // إذا لم نجد سعر مرجعي، نستخدم old_buy_price من آخر سجل
          if (price24hAgo === 0 && records.length > 0) {
            price24hAgo = Number(records[0].old_buy_price) || 0;
          }
        }
        
        latestTrends.push({
          stock_exchange_id: stockExchangeId,
          product_id: records[0].product_id,
          price_24h_ago: price24hAgo, // السعر المرجعي (آخر سعر تم الشراء به فعلياً من last_actual_purchase_price أو من التاريخ)
          current_price: currentPrice, // السعر الحالي من stock_exchange
          diff: currentPrice - price24hAgo, // الفرق بين السعر الحالي والسعر المرجعي
          created_at: records[0].created_at,
        });
      });

      console.log(`✅ تم جلب ${latestTrends.length} trend من exchange_price_history:`, latestTrends);
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
  // يدعم نظام الموافقات للتغييرات الكبيرة (>= 10%)
  async updateExchangeProduct(id: number, product: Partial<StockExchange>, userId?: string) {
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
      let priceChangePercentage = 0;
      
      // إذا كان هناك base_price في updateData، استخدمه
      if (updateData.buy_price !== undefined) {
        if (updateData.base_price && updateData.base_price > 0) {
          priceChangePercentage =
            ((updateData.buy_price - updateData.base_price) /
              updateData.base_price) * 100;
        } else if (id !== 0) {
          // جلب base_price من السجل الموجود
          const { data: existing } = await supabase!
            .from("stock_exchange")
            .select("base_price, buy_price")
            .eq("id", id)
            .single();
          
          if (existing) {
            const basePrice = existing.base_price || existing.buy_price || 0;
            if (basePrice > 0) {
              priceChangePercentage =
                ((updateData.buy_price - basePrice) / basePrice) * 100;
            }
          }
        }
        
        updateData.price_change_percentage = priceChangePercentage;
        
        // التحقق من الحاجة للموافقة (تغييرات >= 10%)
        if (Math.abs(priceChangePercentage) >= 10 && userId) {
          try {
            // استيراد خدمة الموافقة
            const { priceApprovalService } = await import('./priceApprovalService');
            
            // جلب السعر القديم
            let oldPrice = updateData.base_price;
            if (id !== 0) {
              const { data: existing } = await supabase!
                .from("stock_exchange")
                .select("buy_price")
                .eq("id", id)
                .single();
              if (existing) {
                oldPrice = existing.buy_price;
              }
            }
            
            // إنشاء طلب موافقة
            const approvalRequest = await priceApprovalService.createApprovalRequest({
              waste_material_id: updateData.product_id || '',
              stock_exchange_id: id !== 0 ? id : undefined,
              approval_type: 'price_change',
              old_price: oldPrice,
              new_price: updateData.buy_price!,
              price_change_percentage: priceChangePercentage,
              reason: `تغيير سعر المخلفات بنسبة ${priceChangePercentage.toFixed(2)}%`,
              requested_by: userId,
              status: 'pending',
            });
            
            if (approvalRequest) {
              toast.info('تم إنشاء طلب موافقة على تغيير السعر. سيتم تطبيق التغيير بعد الموافقة.');
              return null; // لا نطبق التغيير مباشرة
            }
          } catch (approvalError) {
            console.error('خطأ في إنشاء طلب الموافقة:', approvalError);
            // نستمر في التحديث العادي إذا فشل إنشاء طلب الموافقة
          }
        }
      }

      // إذا كان id = 0، يعني أنها مادة جديدة من الكتالوج نريد إضافتها للبورصة
      if (id === 0) {
        // التأكد من وجود product_id
        if (!updateData.product_id) {
          const errorMsg = "معرف المنتج مطلوب لإنشاء سجل جديد";
          console.error(errorMsg);
          toast.error(errorMsg);
          return null;
        }

        // التحقق إذا كان السجل موجود بالفعل حسب product_id و region_id
        const regionId = updateData.region_id || 1;
        const { data: existing, error: checkError } = await supabase!
          .from("stock_exchange")
          .select("id")
          .eq("product_id", updateData.product_id)
          .eq("region_id", regionId)
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error("خطأ في التحقق من وجود السجل:", checkError);
          throw checkError;
        }

        if (existing) {
          // جلب السعر القديم قبل التحديث
          const { data: oldData } = await supabase!
            .from("stock_exchange")
            .select("buy_price, sell_price")
            .eq("product_id", updateData.product_id)
            .eq("region_id", regionId)
            .single();
          
          const oldBuyPrice = oldData?.buy_price || updateData.buy_price || 0;
          const oldSellPrice = oldData?.sell_price || updateData.sell_price || 0;
          
          // السجل موجود، نحدثه
          const { data, error } = await supabase!
            .from("stock_exchange")
            .update(updateData)
            .eq("product_id", updateData.product_id)
            .eq("region_id", regionId)
            .select();

          if (error) {
            console.error("خطأ في تحديث stock_exchange:", error);
            console.error("تفاصيل الخطأ:", {
              code: error.code,
              message: error.message,
              details: error.details,
              hint: error.hint
            });
            throw error;
          }
          
          if (!data || data.length === 0) {
            console.error("لم يتم تحديث أي سجل");
            return null;
          }
          
          // تسجيل التاريخ بعد التحديث الناجح
          const newBuyPrice = Number(updateData.buy_price) || Number(oldBuyPrice) || 0;
          const newSellPrice = Number(updateData.sell_price) || Number(oldSellPrice) || 0;
          
          // التأكد من أن stock_exchange_id هو number وليس null
          const stockExchangeId = Number(existing.id);
          
          if ((oldBuyPrice !== newBuyPrice || oldSellPrice !== newSellPrice) && stockExchangeId > 0) {
            try {
              console.log("📝 تسجيل تاريخ السعر:", {
                stock_exchange_id: stockExchangeId,
                old_buy_price: Number(oldBuyPrice),
                new_buy_price: newBuyPrice,
                old_sell_price: Number(oldSellPrice),
                new_sell_price: newSellPrice
              });
              
              await exchangeService.logPriceHistory({
                stock_exchange_id: stockExchangeId,
                product_id: updateData.product_id || '',
                region_id: regionId,
                old_buy_price: Number(oldBuyPrice),
                new_buy_price: newBuyPrice,
                old_sell_price: Number(oldSellPrice),
                new_sell_price: newSellPrice,
                change_reason: 'manual_price_update',
                change_source: 'dashboard',
                changed_by: userId
              });
              
              console.log("✅ تم تسجيل تاريخ السعر بنجاح");
            } catch (historyError) {
              console.error("❌ خطأ في تسجيل تاريخ السعر:", historyError);
              // لا نوقف العملية إذا فشل تسجيل التاريخ
            }
          } else {
            console.log("⚠️ لم يتم تسجيل التاريخ:", {
              reason: stockExchangeId <= 0 ? "stock_exchange_id غير صحيح" : "لا يوجد تغيير في السعر",
              stock_exchange_id: stockExchangeId,
              old_buy_price: oldBuyPrice,
              new_buy_price: newBuyPrice
            });
          }
          
          toast.success("تم تحديث معلومات المنتج في البورصة بنجاح");
          return data[0] as StockExchange;
        } else {
          // السجل غير موجود، ننشئه
          // التأكد من وجود جميع الحقول المطلوبة
          if (!updateData.category_id) {
            const errorMsg = "معرف الفئة مطلوب لإنشاء سجل جديد في البورصة";
            console.error(errorMsg);
            toast.error(errorMsg);
            return null;
          }

          const insertData: any = {
            product_id: updateData.product_id,
            category_id: updateData.category_id,
            subcategory_id: updateData.subcategory_id || null,
            region_id: regionId,
            base_price: updateData.base_price || updateData.buy_price || 0,
            buy_price: updateData.buy_price || updateData.base_price || 0,
            sell_price: updateData.sell_price || (updateData.base_price || updateData.buy_price || 0) * 1.2,
            auto_update_enabled: updateData.auto_update_enabled ?? false,
            last_update: new Date().toISOString(),
          };

          // إزالة الحقول undefined
          Object.keys(insertData).forEach(key => {
            if (insertData[key] === undefined) {
              delete insertData[key];
            }
          });

          console.log("محاولة إدراج في stock_exchange:", insertData);
          
          const { data, error } = await supabase!
            .from("stock_exchange")
            .insert([insertData])
            .select();

          if (error) {
            console.error("خطأ في إدراج stock_exchange:", error);
            console.error("تفاصيل الخطأ:", {
              code: error.code,
              message: error.message,
              details: error.details,
              hint: error.hint
            });
            console.error("البيانات المرسلة:", insertData);
            throw error;
          }
          
          if (!data || data.length === 0) {
            console.error("لم يتم إنشاء أي سجل");
            return null;
          }
          
          // تسجيل التاريخ بعد إنشاء السجل الجديد
          const newRecord = data[0];
          const newBuyPrice = Number(newRecord.buy_price) || 0;
          const newSellPrice = Number(newRecord.sell_price) || 0;
          
          if (newRecord.id && newBuyPrice > 0) {
            try {
              console.log("📝 تسجيل تاريخ السعر للسجل الجديد:", {
                stock_exchange_id: newRecord.id,
                product_id: newRecord.product_id,
                old_buy_price: 0, // لا يوجد سعر قديم للسجل الجديد
                new_buy_price: newBuyPrice,
                old_sell_price: 0,
                new_sell_price: newSellPrice
              });
              
              await exchangeService.logPriceHistory({
                stock_exchange_id: Number(newRecord.id),
                product_id: newRecord.product_id || '',
                region_id: regionId,
                old_buy_price: 0, // لا يوجد سعر قديم للسجل الجديد
                new_buy_price: newBuyPrice,
                old_sell_price: 0,
                new_sell_price: newSellPrice,
                change_reason: 'initial_price_setup',
                change_source: 'dashboard',
                changed_by: userId
              });
              
              console.log("✅ تم تسجيل تاريخ السعر للسجل الجديد بنجاح");
            } catch (historyError) {
              console.error("❌ خطأ في تسجيل تاريخ السعر للسجل الجديد:", historyError);
              // لا نوقف العملية إذا فشل تسجيل التاريخ
            }
          }
          
          toast.success("تم إضافة المنتج للبورصة بنجاح");
          return data[0] as StockExchange;
        }
      } else {
        // جلب السعر القديم قبل التحديث
        const { data: oldData } = await supabase!
          .from("stock_exchange")
          .select("buy_price, sell_price, product_id, region_id")
          .eq("id", id)
          .single();
        
        const oldBuyPrice = oldData?.buy_price || 0;
        const oldSellPrice = oldData?.sell_price || 0;
        
        // تحديث سجل موجود حسب id
        const { data, error } = await supabase!
          .from("stock_exchange")
          .update(updateData)
          .eq("id", id)
          .select();

        if (error) {
          console.error("خطأ في تحديث stock_exchange:", error);
          throw error;
        }

        if (!data || data.length === 0) {
          console.error("لم يتم تحديث أي سجل");
          return null;
        }
        
        // تسجيل التاريخ بعد التحديث الناجح
        const newBuyPrice = Number(updateData.buy_price) || Number(oldBuyPrice) || 0;
        const newSellPrice = Number(updateData.sell_price) || Number(oldSellPrice) || 0;
        
        // التأكد من أن stock_exchange_id هو number وليس null
        const stockExchangeId = Number(id);
        
        if ((oldBuyPrice !== newBuyPrice || oldSellPrice !== newSellPrice) && stockExchangeId > 0) {
          try {
            console.log("📝 تسجيل تاريخ السعر:", {
              stock_exchange_id: stockExchangeId,
              old_buy_price: Number(oldBuyPrice),
              new_buy_price: newBuyPrice,
              old_sell_price: Number(oldSellPrice),
              new_sell_price: newSellPrice
            });
            
            await exchangeService.logPriceHistory({
              stock_exchange_id: stockExchangeId,
              product_id: oldData?.product_id || updateData.product_id || '',
              region_id: oldData?.region_id || updateData.region_id || 1,
              old_buy_price: Number(oldBuyPrice),
              new_buy_price: newBuyPrice,
              old_sell_price: Number(oldSellPrice),
              new_sell_price: newSellPrice,
              change_reason: 'manual_price_update',
              change_source: 'dashboard',
              changed_by: userId
            });
            
            console.log("✅ تم تسجيل تاريخ السعر بنجاح");
          } catch (historyError) {
            console.error("❌ خطأ في تسجيل تاريخ السعر:", historyError);
            // لا نوقف العملية إذا فشل تسجيل التاريخ
          }
        } else {
          console.log("⚠️ لم يتم تسجيل التاريخ:", {
            reason: stockExchangeId <= 0 ? "stock_exchange_id غير صحيح" : "لا يوجد تغيير في السعر",
            stock_exchange_id: stockExchangeId,
            old_buy_price: oldBuyPrice,
            new_buy_price: newBuyPrice
          });
        }

        toast.success("تم تحديث معلومات المنتج في البورصة بنجاح");
        return data[0] as StockExchange;
      }
    } catch (error: any) {
      console.error(`خطأ في تحديث المنتج رقم ${id} في البورصة:`, error);
      const errorMessage = error?.message || error?.details || 'حدث خطأ غير معروف';
      console.error("تفاصيل الخطأ:", {
        code: error?.code,
        message: errorMessage,
        hint: error?.hint,
        details: error?.details,
      });
      toast.error(`حدث خطأ أثناء تحديث معلومات المنتج: ${errorMessage}`);
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
      if (!supabase) {
        console.error("Supabase client is not initialized.");
        return;
      }

      // التأكد من أن stock_exchange_id موجود وليس null
      if (!log.stock_exchange_id || log.stock_exchange_id <= 0) {
        console.error("⚠️ لا يمكن تسجيل التاريخ: stock_exchange_id غير صحيح", log);
        return;
      }

      const insertData = {
        stock_exchange_id: Number(log.stock_exchange_id),
        product_id: log.product_id || null,
        region_id: log.region_id || null,
        old_buy_price: Number(log.old_buy_price) || 0,
        new_buy_price: Number(log.new_buy_price) || 0,
        old_sell_price: Number(log.old_sell_price) || 0,
        new_sell_price: Number(log.new_sell_price) || 0,
        change_reason: log.change_reason || 'manual_price_update',
        change_source: log.change_source || 'dashboard',
        changed_by: log.changed_by || null,
        created_at: new Date().toISOString(),
      };

      console.log("📤 إرسال بيانات التاريخ إلى قاعدة البيانات:", insertData);

      const { data, error } = await supabase!
        .from("exchange_price_history")
        .insert([insertData])
        .select();

      if (error) {
        console.error("❌ Failed to log price history:", error);
        console.error("تفاصيل الخطأ:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        // We don't throw here to avoid blocking the main operation if logging fails
      } else {
        console.log("✅ تم تسجيل التاريخ بنجاح:", data);
      }
    } catch (err) {
      console.error("❌ Error logging price history:", err);
    }
  },
};

export default exchangeService;

