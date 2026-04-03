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
  show_on_ticker: boolean;
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
      // جلب الأسعار المنشورة فقط (للبورصة العامة)
      async getPublishedPrices() {
        try {
          if (!supabase) throw new Error('Supabase client is not initialized');

          // 1. جلب بيانات البورصة (المنشورة فقط)
          const { data: stockPrices, error: stockError } = await supabase
            .from("stock_exchange")
            .select(`
              *,
              catalog_item:catalog_waste_materials!left (
                waste_no,
                name,
                main_category_id,
                sub_category_id
              )
            `);
    
          if (stockError) throw stockError;
          if (!stockPrices || stockPrices.length === 0) return [];
    
          // 2. تحسين البيانات (إضافة أسماء الفئات والمسارات)
          // هذا الجزء مشابه لما كان يحدث في getAllPrices لكن بشكل معكوس (البدء من البورصة)
          // سنقوم بتبسيط العملية هنا والاعتماد على البيانات المخزنة أو جلبها عند الحاجة
          
          return stockPrices.map(price => ({
            ...price,
            product_id: price.product_id || '',
            buy_price: Number(price.buy_price) || 0,
            sell_price: Number(price.sell_price) || 0,
            base_price: Number(price.base_price) || 0,
            // يمكن تحسين جلب بيانات الكتالوج هنا إذا لزم الأمر
            catalog_item: price.catalog_item || { name: 'منتج غير معروف', waste_no: '---' }
          })) as StockExchange[];
    
        } catch (error) {
          console.error("خطأ في جلب الأسعار المنشورة:", error);
          return [];
        }
      },
    
      // جلب المواد غير المسعرة (الموجودة في الكتالوج وليست في البورصة)
      async getUnlistedItems() {
        try {
          if (!supabase) throw new Error('Supabase client is not initialized');
    
          // 1. جلب كل المواد من الكتالوج
          const { data: catalogItems, error: catalogError } = await supabase
            .from("catalog_waste_materials")
            .select("*");
            
          if (catalogError) throw catalogError;
    
          // 2. جلب معرفات المواد الموجودة في البورصة
          const { data: existingStock, error: stockError } = await supabase
            .from("stock_exchange")
            .select("product_id");
            
          if (stockError) throw stockError;
    
          const existingProductIds = new Set(existingStock?.map(s => s.product_id) || []);
    
          // 3. تصفية المواد التي ليست في البورصة
          // ملاحظة: نفترض أن الربط يتم عبر product_id الذي يطابق waste_data_admin.id
          // هذا يتطلب خطوة إضافية للربط بين catalog_waste_materials.waste_no و waste_data_admin.name
          // للتبسيط، سنفترض أننا بحاجة للبحث عن waste_no في waste_data_admin للحصول على ID
    
          // جلب waste_data_admin للربط
          const wasteNos = catalogItems?.map(i => i.waste_no) || [];
          if (!supabase) throw new Error('Supabase client is not initialized');
          const { data: wasteDataAdmin } = await supabase
            .from("waste_data_admin")
            .select("id, name")
            .in("name", wasteNos);
            
          const wasteNameToIdMap = new Map();
          wasteDataAdmin?.forEach(w => wasteNameToIdMap.set(w.name, w.id));
    
          // التصفية
          const unlistedItems = catalogItems?.filter(item => {
            const productId = wasteNameToIdMap.get(item.waste_no);
            // إذا لم يكن للمادة ID في waste_data_admin، فهي بالتأكيد غير موجودة في البورصة
            if (!productId) return true;
            // إذا كان لها ID، نتحقق هل هو موجود في البورصة
            return !existingProductIds.has(productId);
          });
    
          return unlistedItems || [];
    
        } catch (error) {
          console.error("خطأ في جلب المواد غير المسعرة:", error);
          return [];
        }
      },

      // جلب جميع أسعار البورصة (المنشورة فقط)
      async getAllPrices() {
        try {
          if (!supabase) throw new Error('Supabase client is not initialized');
    
          // 1. جلب بيانات البورصة مع اسم المنتج
          const { data: stockPrices, error: stockError } = await supabase
            .from("stock_exchange")
            .select(`
              *,
              product:waste_data_admin (
                name
              )
            `);
    
          if (stockError) throw stockError;
          if (!stockPrices || stockPrices.length === 0) return [];

          if (!supabase) throw new Error('Supabase client is not initialized');
          // 2. جلب الكتالوج للحصول على تفاصيل الفئات
          const { data: catalogItems, error: catalogError } = await supabase
            .from("catalog_waste_materials")
            .select("*");
            
          if (catalogError) console.warn("Could not fetch catalog items for enrichment", catalogError);
          
          const catalogMap = new Map((catalogItems || []).map(c => [c.waste_no, c]));
    
          // 3. دمج البيانات
          const formattedPrices: StockExchange[] = stockPrices.map(price => {
             const productName = (price.product as any)?.name;
             const catalogItem = productName ? catalogMap.get(productName) : null;
             
             // تحديد الفئة الرئيسية والفرعية
             // الأولوية 1: من الكتالوج
             // الأولوية 2: من سجل البورصة
             
             return {
               ...price,
               id: price.id,
               product_id: price.product_id,
               waste_no: productName || '', 
               name: catalogItem?.name || productName || 'مادة غير معروفة',
               
               // استخدام الفئات من الكتالوج (النظام الجديد) أو البورصة (القديم)
               category_id: catalogItem?.main_category_id || price.category_id,
               subcategory_id: catalogItem?.sub_category_id || price.subcategory_id,
               
               base_price: Number(price.base_price) || 0,
               buy_price: Number(price.buy_price) || 0,
               sell_price: Number(price.sell_price) || 0,
               
               is_published: true, // منشورة لأنها في جدول البورصة
               
               // إرفاق كائن الكتالوج للعرض
               catalog_item: catalogItem ? {
                 waste_no: catalogItem.waste_no,
                 name: catalogItem.name,
                 main_category_id: catalogItem.main_category_id,
                 sub_category_id: catalogItem.sub_category_id
               } : undefined
             };
          });

          console.log(`تم جلب ${formattedPrices.length} مادة منشورة في البورصة`);
          return formattedPrices;
    
        } catch (error) {
          console.error("خطأ في جلب الأسعار المنشورة:", error);
          return [];
        }
      },

  // جلب سعر منتج محدد في البورصة
  async getPriceByProductId(productId: string) {
    try {
      if (!supabase) throw new Error('Supabase client is not initialized');
      const { data, error } = await supabase
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
      if (!supabase) throw new Error('Supabase client is not initialized');
      // جلب أحدث سجل لكل stock_exchange_id
      // نستخدم طريقة أفضل: نجلب جميع السجلات ثم نختار الأحدث لكل stock_exchange_id
      const { data, error } = await supabase
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
        if (!supabase) throw new Error('Supabase client is not initialized');
        // جلب الأسعار الحالية مع last_actual_purchase_price في نفس الاستعلام
        const { data: currentPrices, error: pricesError } = await supabase
          .from("stock_exchange")
          .select("id, buy_price, last_actual_purchase_price, base_price")
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
      
      // جلب last_actual_purchase_price و base_price من stock_exchange
      let lastActualPurchasePricesMap = new Map<number, number>();
      let basePricesMap = new Map<number, number>();
      
      if (stockExchangeIds.length > 0) {
        if (!supabase) throw new Error('Supabase client is not initialized');
        const { data: actualPurchasePrices, error: actualPricesError } = await supabase
          .from("stock_exchange")
          .select("id, last_actual_purchase_price, base_price")
          .in("id", stockExchangeIds);
        
        if (!actualPricesError && actualPurchasePrices) {
          actualPurchasePrices.forEach(price => {
            if (price.last_actual_purchase_price) {
              lastActualPurchasePricesMap.set(Number(price.id), Number(price.last_actual_purchase_price));
            }
            if (price.base_price) {
              basePricesMap.set(Number(price.id), Number(price.base_price));
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
        
        // إذا لم يكن هناك last_actual_purchase_price، نستخدم السعر من exchange_price_history أولاً
        // هذا يعطي مؤشراً دقيقاً عن التغير الفعلي في السعر
        if (price24hAgo === 0) {
          // البحث عن أول سجل في التاريخ حيث السعر مختلف عن السعر الحالي
          // نبحث عن new_buy_price أو old_buy_price مختلف عن currentPrice
          let foundPrice = 0;
          
          for (let i = 0; i < records.length; i++) {
            const record = records[i];
            const recordNewPrice = Number(record.new_buy_price) || 0;
            const recordOldPrice = Number(record.old_buy_price) || 0;
            
            // نستخدم new_buy_price إذا كان مختلفاً عن السعر الحالي
            if (recordNewPrice > 0 && Math.abs(recordNewPrice - currentPrice) > 0.01) {
              foundPrice = recordNewPrice;
              break;
            }
            
            // إذا لم نجد، نستخدم old_buy_price إذا كان مختلفاً
            if (recordOldPrice > 0 && Math.abs(recordOldPrice - currentPrice) > 0.01) {
              foundPrice = recordOldPrice;
              break;
            }
          }
          
          // إذا لم نجد سعر مختلف، نستخدم old_buy_price من آخر سجل
          if (foundPrice === 0 && records.length > 0) {
            foundPrice = Number(records[0].old_buy_price) || 0;
          }
          
          price24hAgo = foundPrice;
        }
        
        // فقط إذا لم نجد أي سعر مرجعي من last_actual_purchase_price أو exchange_price_history
        // نستخدم base_price كحل أخير (لكن فقط إذا كان مختلفاً عن السعر الحالي)
        if (price24hAgo === 0 || Math.abs(price24hAgo - currentPrice) < 0.01) {
          const basePrice = basePricesMap.get(stockExchangeId) || 0;
          // نستخدم base_price فقط إذا كان مختلفاً عن السعر الحالي
          if (basePrice > 0 && Math.abs(basePrice - currentPrice) > 0.01) {
            price24hAgo = basePrice;
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

      if (!supabase) throw new Error('Supabase client is not initialized');
      const { data, error } = await supabase
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

      console.log(`بدء تحديث المنتج ${id} في البورصة:`, { product, userId });

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
          if (!supabase) throw new Error('Supabase client is not initialized');
          const { data: existing } = await supabase
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
              if (!supabase) throw new Error('Supabase client is not initialized');
              const { data: existing } = await supabase
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
        if (!supabase) throw new Error('Supabase client is not initialized');
        const { data: existing, error: checkError } = await supabase
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
          if (!supabase) throw new Error('Supabase client is not initialized');
          const { data: oldData } = await supabase
            .from("stock_exchange")
            .select("buy_price, sell_price")
            .eq("product_id", updateData.product_id)
            .eq("region_id", regionId)
            .single();
          
          const oldBuyPrice = oldData?.buy_price || updateData.buy_price || 0;
          const oldSellPrice = oldData?.sell_price || updateData.sell_price || 0;
          
          // تحديث السجل الموجود: نرسل فقط حقول الأسعار لتجنب تعارض FK (category_id/subcategory_id قد تكون من waste_* وليست UUID)
          const safeUpdatePayload: Record<string, unknown> = {
            base_price: updateData.base_price ?? updateData.buy_price ?? 0,
            buy_price: updateData.buy_price ?? updateData.base_price ?? 0,
            sell_price: updateData.sell_price ?? (Number(updateData.buy_price ?? updateData.base_price ?? 0) * 1.2),
            last_update: updateData.last_update ?? new Date().toISOString(),
            price_change_percentage: updateData.price_change_percentage ?? 0,
          };
          if (updateData.auto_update_enabled !== undefined) safeUpdatePayload.auto_update_enabled = updateData.auto_update_enabled;

          if (!supabase) throw new Error('Supabase client is not initialized');
          const { data, error } = await supabase
            .from("stock_exchange")
            .update(safeUpdatePayload)
            .eq("product_id", updateData.product_id)
            .eq("region_id", regionId)
            .select();

          if (error) {
            console.error("خطأ في تحديث stock_exchange:", error?.message ?? error);
            console.error("تفاصيل الخطأ:", {
              code: (error as { code?: string })?.code,
              message: (error as { message?: string })?.message,
              details: (error as { details?: string })?.details,
              hint: (error as { hint?: string })?.hint
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
          // stock_exchange يربط category_id و subcategory_id بجداول categories و subcategories (UUID فقط)
          // إذا كانت القيم غير صحيحة (legacy integer IDs)، نستخدم قيم افتراضية لضمان الإنشاء
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          let categoryId = String(updateData.category_id ?? "").trim();
          let subcategoryId = updateData.subcategory_id ? String(updateData.subcategory_id).trim() : "";

          // Fallback for Category
          if (!categoryId || !uuidRegex.test(categoryId)) {
            console.warn(`استخدام category_id افتراضي للمنتج ${updateData.product_id} لأن القيمة "${categoryId}" غير صالحة UUID.`);
            categoryId = '30f1c4b7-041a-4524-81a0-f9c2b6eea208'; // مخلفات بلاستيك (افتراضي)
          }

          // Fallback for SubCategory
          if (subcategoryId && !uuidRegex.test(subcategoryId)) {
             console.warn(`استخدام subcategory_id افتراضي للمنتج ${updateData.product_id} بأن القيمة "${subcategoryId}" غير صالحة UUID.`);
             subcategoryId = 'aa5c3f93-e406-4f54-a464-e1050f1b3906'; // زجاجات (افتراضي)
          } else if (!subcategoryId) {
             subcategoryId = 'aa5c3f93-e406-4f54-a464-e1050f1b3906'; // زجاجات (افتراضي إذا لم يوجد)
          }

          const insertData: any = {
            product_id: updateData.product_id,
            category_id: categoryId,
            subcategory_id: subcategoryId || null,
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
          
          if (!supabase) throw new Error('Supabase client is not initialized');
          const { data, error } = await supabase
            .from("stock_exchange")
            .insert([insertData])
            .select();

          if (error) {
            const err = error as { code?: string; message?: string; details?: string; hint?: string };
            console.error("خطأ في إدراج stock_exchange:", err?.message ?? err);
            console.error("تفاصيل الخطأ:", { code: err?.code, message: err?.message, details: err?.details, hint: err?.hint });
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
        if (!supabase) throw new Error('Supabase client is not initialized');
        const { data: oldData } = await supabase
          .from("stock_exchange")
          .select("buy_price, sell_price, product_id, region_id")
          .eq("id", id)
          .single();
        
        const oldBuyPrice = oldData?.buy_price || 0;
        const oldSellPrice = oldData?.sell_price || 0;
        
        // تحديث سجل موجود حسب id (نرسل فقط الحقول القابلة للتحديث لتجنب تعارض FK)
        const safeUpdate: Record<string, unknown> = {
          last_update: updateData.last_update ?? new Date().toISOString(),
        };
        if (updateData.base_price !== undefined) safeUpdate.base_price = updateData.base_price;
        if (updateData.buy_price !== undefined) safeUpdate.buy_price = updateData.buy_price;
        if (updateData.sell_price !== undefined) safeUpdate.sell_price = updateData.sell_price;
        if (updateData.price_change_percentage !== undefined) safeUpdate.price_change_percentage = updateData.price_change_percentage;
        if (updateData.auto_update_enabled !== undefined) safeUpdate.auto_update_enabled = updateData.auto_update_enabled;

        if (!supabase) throw new Error('Supabase client is not initialized');
        const { data, error } = await supabase
          .from("stock_exchange")
          .update(safeUpdate)
          .eq("id", id)
          .select();

        if (error) {
          const err = error as { message?: string };
          console.error(`خطأ في تحديث stock_exchange (ID: ${id}):`, err?.message ?? error);
          throw error;
        }

        if (!data || data.length === 0) {
          console.error(`لم يتم تحديث أي سجل للمنتج ID: ${id}. تأكد من صحة الـ ID أو صلاحيات المستخدم.`);
          console.error("البيانات التي تمت محاولة تحديثها:", safeUpdate);
          
          // محاولة معرفة السبب: هل السجل موجود أصلاً؟
          if (!supabase) throw new Error('Supabase client is not initialized');
          const { count } = await supabase
            .from("stock_exchange")
            .select("id", { count: "exact", head: true })
            .eq("id", id);
            
          console.error(`هل السجل موجود؟ ${count === 1 ? "نعم" : "لا (count: " + count + ")"}`);
          
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
      
      // Rethrow to allow caller (slice/UI) to handle specific message
      throw new Error(errorMessage);
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
      if (!supabase) throw new Error('Supabase client is not initialized');
      const { error } = await supabase
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

      if (!supabase) throw new Error('Supabase client is not initialized');
      const { data, error } = await supabase
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

  /** تبديل حالة الظهور في شريط الأسعار للمنتج */
  async toggleProductShowOnTicker(id: number, show: boolean): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase
      .from("stock_exchange")
      .update({ show_on_ticker: show })
      .eq("id", id);
    
    if (error) {
      console.error("خطأ في تحديث حالة الظهور في التيكر للمنتج:", error);
      toast.error("فشل في تحديث حالة الظهور");
      return false;
    }
    return true;
  },

  /** جلب نقاط السعر التاريخية للمنتجات (للرسم البياني) */
  async getProductSparklineData(limit = 10) {
    try {
      if (!supabase) return {};
      
      const { data, error } = await supabase
        .from("exchange_price_history")
        .select("stock_exchange_id, new_buy_price, created_at")
        .order("created_at", { ascending: false })
        .limit(1000); // نجلب كمية كافية لتغطية معظم المنتجات والتواريخ

      if (error) throw error;
      
      // تجميع النقاط حسب stock_exchange_id
      const sparkMap: Record<number, number[]> = {};
      (data || []).forEach(record => {
        const id = Number(record.stock_exchange_id);
        if (!sparkMap[id]) sparkMap[id] = [];
        if (sparkMap[id].length < limit) {
          sparkMap[id].push(Number(record.new_buy_price));
        }
      });

      // عكس الترتيب ليكون من الأقدم للأحدث
      Object.keys(sparkMap).forEach(id => {
        sparkMap[Number(id)].reverse();
      });

      return sparkMap;
    } catch (error) {
      console.error("خطأ في جلب بيانات sparkline للمنتجات:", error);
      return {};
    }
  }
};

export default exchangeService;

