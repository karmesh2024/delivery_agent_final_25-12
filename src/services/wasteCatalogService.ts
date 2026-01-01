import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface WasteCatalogItem {
  id?: number;
  waste_no: string;
  warehouse_id: number | null;
  registration_date: string;
  source?: string; // للتوافق الخلفي
  // الحقول الجديدة
  sector_id?: number;
  client_type_id?: number;
  source_code?: string;
  reason_id?: number;
  related_product_id?: number;
  main_category_id?: number;
  sub_category_id?: number;
  plastic_type_id?: number;
  metal_type_id?: number;
  plastic_code?: string;
  plastic_shape?: string;
  plastic_color?: string;
  plastic_cleanliness?: string;
  plastic_hardness?: string;
  metal_shape?: string;
  metal_condition?: string;
  paper_type?: string;
  paper_condition?: string;
  paper_print_type?: string;
  glass_type?: string;
  glass_shape?: string;
  fabric_type?: string;
  fabric_condition?: string;
  fabric_cut_type?: string;
  unit_mode: "weight" | "volume" | "count" | "dimension";
  unit_id?: number;
  weight?: number;
  volume?: number;
  count?: number;
  length?: number;
  width?: number;
  height?: number;
  recyclable?: boolean;
  quality_grade?: string;
  impurities_percent?: number;
  sorting_status?: string;
  contamination_level?: string;
  disposal_reason?: string;
  disposal_method?: string;
  expected_price?: number;
  expected_total?: number;
  temp_location?: string;
  rack_row_col?: string;
  storage_conditions?: string;
  stackable?: boolean;
  max_stack_height?: number;
  max_storage_days?: number;
  alert_on_exceed?: boolean;
  status?: string;
  images?: string[];
  documents?: string[];
  env_carbon_saving?: number;
  env_energy_saving?: number;
  env_water_saving?: number;
  env_trees_saved?: number;
  qr_code?: string;
  notes?: string;
  emergency_flags?: {
    urgent_processing: boolean;
    special_approvals: boolean;
    health_hazard: boolean;
    environmental_hazard: boolean;
  };
  // حقول إدارة المخازن الجديدة
  is_returnable_after_sorting?: boolean; // قابل أن يكون مرتجع بعد الفرز أم لا
  initial_sorting_from_supplier?: string | null; // الفرز الأولى من المورد
  initial_sorting_percentage?: number | null; // نسبة الفرز الأولى من المورد
  pollution_percentage?: number | null; // نسبة مستوى التلوث
  created_at?: string;
  warehouse?: { name: string };
  main_category?: { name: string };
  sub_category?: { name: string };
  unit?: { name: string };
  related_product?: { name: string; sku: string };
}

// واجهات جديدة للنظام المحسن
export interface WasteSector {
  id: number | string; // دعم number (للجداول القديمة) و string/UUID (للجداول الجديدة)
  name: string;
  description?: string;
  code?: string;
}

export interface ClientType {
  id: number;
  sector_id: number; // العودة إلى number
  name: string;
  description?: string;
}

export interface SourceReason {
  id: number;
  name: string;
  description?: string;
}

export interface WasteMainCategory {
  id: number | string; // تغيير لتسهيل التعامل مع المصادر النصية
  code: string;
  name: string;
  description?: string;
}

export interface WasteSubCategory {
  id: number;
  code: string;
  name: string;
  main_id: number;
}

export interface PlasticType {
  id: number;
  sub_id?: number; // رقم التصنيف الفرعي المرتبط
  code?: string;
  name: string;
  description?: string;
}

export interface MetalType {
  id: number;
  sub_id?: number;
  name: string;
}

export interface PaperType {
  id: number;
  sub_id?: number;
  name: string;
}

export interface WasteSource {
  id: string;
  name: string;
  description?: string;
}

export interface AvailableSourceData {
  source_id: string;
  waste_sources: WasteSource[]; // Supabase join returns array
  priority_order: number;
}

export interface AvailableReasonData {
  reason_id: number;
  source_reasons: SourceReason[]; // Supabase join returns array
  priority_order: number;
}

class WasteCatalogService {
  // إضافة مخلفات جديدة
  async addWaste(
    waste: Omit<WasteCatalogItem, "id" | "created_at">,
  ): Promise<WasteCatalogItem | null> {
    try {
      // تحويل UUID من unified_main_categories إلى bigint من waste_main_categories
      let mainCategoryIdBigInt: number | null = null;
      let subCategoryIdBigInt: number | null = null;

      if (waste.main_category_id) {
        // إذا كان UUID (string)، نحتاج للبحث عن code ثم bigint
        const mainCategoryIdStr = waste.main_category_id.toString();
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(mainCategoryIdStr);
        
        if (isUUID) {
          // البحث عن code في unified_main_categories
          const { data: unifiedMainCategory } = await supabase!
            .from("unified_main_categories")
            .select("code")
            .eq("id", mainCategoryIdStr)
            .single();
          
          if (unifiedMainCategory?.code) {
            // البحث عن bigint في waste_main_categories
            let { data: oldMainCategory, error: oldCategoryError } = await supabase!
              .from("waste_main_categories")
              .select("id")
              .eq("code", unifiedMainCategory.code)
              .maybeSingle();
            
            if (oldMainCategory && !oldCategoryError) {
              mainCategoryIdBigInt = Number(oldMainCategory.id);
            } else {
              // إذا لم نجد في الجدول القديم، ننشئ سجل جديد
              console.log(`📝 إنشاء سجل جديد في waste_main_categories للكود ${unifiedMainCategory.code}`);
              
              // جلب اسم الفئة من unified_main_categories
              const { data: fullCategory } = await supabase!
                .from("unified_main_categories")
                .select("name, name_ar, description")
                .eq("id", mainCategoryIdStr)
                .single();
              
              // إنشاء سجل جديد في waste_main_categories
              // ملاحظة: waste_main_categories يحتوي فقط على id, code, name (لا يوجد description أو is_active)
              const insertData: { code: string; name: string } = {
                code: unifiedMainCategory.code,
                name: fullCategory?.name_ar || fullCategory?.name || unifiedMainCategory.code,
              };
              
              const { data: newMainCategory, error: insertError } = await supabase!
                .from("waste_main_categories")
                .insert(insertData)
                .select("id")
                .single();
              
              if (newMainCategory && !insertError) {
                mainCategoryIdBigInt = Number(newMainCategory.id);
                console.log(`✅ تم إنشاء الفئة الأساسية بنجاح: ${mainCategoryIdBigInt}`);
              } else {
                // إذا فشل الإدراج (مثلاً بسبب duplicate code)، نحاول البحث مرة أخرى
                if (insertError?.code === '23505' || insertError?.message?.includes('duplicate') || insertError?.message?.includes('unique')) {
                  console.log(`⚠️ الكود موجود بالفعل، البحث مرة أخرى...`);
                  const { data: existingCategory } = await supabase!
                    .from("waste_main_categories")
                    .select("id")
                    .eq("code", unifiedMainCategory.code)
                    .maybeSingle();
                  
                  if (existingCategory) {
                    mainCategoryIdBigInt = Number(existingCategory.id);
                    console.log(`✅ تم العثور على الفئة الأساسية الموجودة: ${mainCategoryIdBigInt}`);
                  } else {
                    console.error(`❌ فشل في إنشاء الفئة الأساسية:`, insertError);
                    mainCategoryIdBigInt = null;
                  }
                } else {
                  console.error(`❌ فشل في إنشاء الفئة الأساسية:`, insertError);
                  mainCategoryIdBigInt = null;
                }
              }
            }
          }
        } else {
          // إذا كان bigint بالفعل، استخدمه مباشرة
          mainCategoryIdBigInt = Number(waste.main_category_id);
        }
      }

      if (waste.sub_category_id) {
        const subCategoryIdStr = waste.sub_category_id.toString();
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(subCategoryIdStr);
        
        if (isUUID) {
          // البحث عن code في unified_sub_categories
          const { data: unifiedSubCategory } = await supabase!
            .from("unified_sub_categories")
            .select("code")
            .eq("id", subCategoryIdStr)
            .single();
          
          if (unifiedSubCategory?.code) {
            // البحث عن bigint في waste_sub_categories
            // إذا لم نجد في الجدول القديم، نستخدم null
            const { data: oldSubCategory, error: oldSubCategoryError } = await supabase!
              .from("waste_sub_categories")
              .select("id")
              .eq("code", unifiedSubCategory.code)
              .single();
            
            if (oldSubCategory && !oldSubCategoryError) {
              subCategoryIdBigInt = Number(oldSubCategory.id);
            } else {
              // إذا لم نجد في الجدول القديم، ننشئ سجل جديد
              console.log(`📝 إنشاء سجل جديد في waste_sub_categories للكود ${unifiedSubCategory.code}`);
              
              // جلب اسم الفئة من unified_sub_categories
              const { data: fullSubCategory } = await supabase!
                .from("unified_sub_categories")
                .select("name, name_ar, main_category_id")
                .eq("id", subCategoryIdStr)
                .single();
              
              // نحتاج لـ main_category_id في waste_main_categories (bigint)
              let mainCategoryIdForSub: number | null = null;
              if (fullSubCategory?.main_category_id) {
                // البحث عن main_category_id في waste_main_categories
                const { data: mainCatInUnified } = await supabase!
                  .from("unified_main_categories")
                  .select("code")
                  .eq("id", fullSubCategory.main_category_id)
                  .single();
                
                if (mainCatInUnified?.code) {
                  const { data: oldMainCat } = await supabase!
                    .from("waste_main_categories")
                    .select("id")
                    .eq("code", mainCatInUnified.code)
                    .maybeSingle();
                  
                  if (oldMainCat) {
                    mainCategoryIdForSub = Number(oldMainCat.id);
                  }
                }
              }
              
              // إنشاء سجل جديد في waste_sub_categories
              // ملاحظة: waste_sub_categories يحتوي فقط على id, code, name, main_id (لا يوجد description أو is_active)
              const insertSubData: { code: string; name: string; main_id?: number | null } = {
                code: unifiedSubCategory.code,
                name: fullSubCategory?.name_ar || fullSubCategory?.name || unifiedSubCategory.code,
              };
              
              if (mainCategoryIdForSub !== null) {
                insertSubData.main_id = mainCategoryIdForSub;
              }
              
              const { data: newSubCategory, error: insertSubError } = await supabase!
                .from("waste_sub_categories")
                .insert(insertSubData)
                .select("id")
                .single();
              
              if (newSubCategory && !insertSubError) {
                subCategoryIdBigInt = Number(newSubCategory.id);
                console.log(`✅ تم إنشاء الفئة الفرعية بنجاح: ${subCategoryIdBigInt}`);
              } else {
                // إذا فشل الإدراج (مثلاً بسبب duplicate code)، نحاول البحث مرة أخرى
                if (insertSubError?.code === '23505' || insertSubError?.message?.includes('duplicate') || insertSubError?.message?.includes('unique')) {
                  console.log(`⚠️ الكود موجود بالفعل، البحث مرة أخرى...`);
                  const { data: existingSubCategory } = await supabase!
                    .from("waste_sub_categories")
                    .select("id")
                    .eq("code", unifiedSubCategory.code)
                    .maybeSingle();
                  
                  if (existingSubCategory) {
                    subCategoryIdBigInt = Number(existingSubCategory.id);
                    console.log(`✅ تم العثور على الفئة الفرعية الموجودة: ${subCategoryIdBigInt}`);
                  } else {
                    console.error(`❌ فشل في إنشاء الفئة الفرعية:`, insertSubError);
                    subCategoryIdBigInt = null;
                  }
                } else {
                  console.error(`❌ فشل في إنشاء الفئة الفرعية:`, insertSubError);
                  subCategoryIdBigInt = null;
                }
              }
            }
          }
        } else {
          subCategoryIdBigInt = Number(waste.sub_category_id);
        }
      }

      // تحضير البيانات للحفظ
      const sourceCode = waste.source_code || (typeof waste.source === 'string' ? waste.source : null);
      
      const wasteData = {
        ...waste,
        // استخدام bigint IDs للحفظ
        main_category_id: mainCategoryIdBigInt,
        sub_category_id: subCategoryIdBigInt,
        // حفظ الحقول الجديدة
        sector_id: waste.sector_id || null,
        client_type_id: waste.client_type_id || null,
        source_code: sourceCode || null,
        reason_id: waste.reason_id || null,
        // الحفاظ على التوافق الخلفي
        source: sourceCode || null,
      };

      const { data, error } = await supabase!
        .from("catalog_waste_materials")
        .insert([wasteData])
        .select()
        .single();

      if (error) {
        console.error("خطأ في إضافة المخلفات:", error);
        toast.error(`حدث خطأ أثناء إضافة المخلفات: ${error.message}`);
        return null;
      }

      toast.success("تم إضافة المخلفات بنجاح");
      return data;
    } catch (error) {
      console.error("خطأ في إضافة المخلفات:", error);
      toast.error(
        `حدث خطأ أثناء إضافة المخلفات: ${
          error instanceof Error ? error.message : "خطأ غير معروف"
        }`,
      );
      return null;
    }
  }

  // تحديث مخلفات موجودة
  // جلب مخلف واحد بالمعرف
  async getWasteMaterialById(id: string | number): Promise<WasteCatalogItem | null> {
    try {
      const { data, error } = await supabase!
        .from("catalog_waste_materials")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("خطأ في جلب المخلف:", error);
        return null;
      }

      if (!data) return null;

      // استخدام نفس منطق getWasteMaterials لتحويل البيانات
      const items = await this.getWasteMaterials();
      return items.find(item => item.id?.toString() === id.toString()) || null;
    } catch (error) {
      console.error("خطأ في جلب المخلف:", error);
      return null;
    }
  }

  async updateWaste(
    id: number | string,
    waste: Partial<WasteCatalogItem>,
  ): Promise<WasteCatalogItem | null> {
    try {
      // تحويل UUID من unified_main_categories إلى bigint من waste_main_categories
      let mainCategoryIdBigInt: number | null | undefined = undefined;
      let subCategoryIdBigInt: number | null | undefined = undefined;

      if (waste.main_category_id !== undefined) {
        if (waste.main_category_id === null) {
          mainCategoryIdBigInt = null;
        } else {
          const mainCategoryIdStr = waste.main_category_id.toString();
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(mainCategoryIdStr);
          
          if (isUUID) {
            // البحث عن code في unified_main_categories
            const { data: unifiedMainCategory } = await supabase!
              .from("unified_main_categories")
              .select("code")
              .eq("id", mainCategoryIdStr)
              .single();
            
          if (unifiedMainCategory?.code) {
            // البحث عن bigint في waste_main_categories
            // إذا لم نجد في الجدول القديم، نستخدم null (سيتم التعامل معه لاحقاً)
            const { data: oldMainCategory, error: oldCategoryError } = await supabase!
              .from("waste_main_categories")
              .select("id")
              .eq("code", unifiedMainCategory.code)
              .maybeSingle(); // استخدام maybeSingle بدلاً من single لتجنب الخطأ 406
            
            if (oldMainCategory && !oldCategoryError) {
              mainCategoryIdBigInt = Number(oldMainCategory.id);
            } else {
              // إذا لم نجد في الجدول القديم، نستخدم null
              // catalog_waste_materials يتوقع bigint، لكن يمكن أن يكون null
              console.warn(`⚠️ لم يتم العثور على الفئة الأساسية بالكود ${unifiedMainCategory.code} في waste_main_categories. سيتم حفظ null.`);
              mainCategoryIdBigInt = null;
            }
          }
          } else {
            mainCategoryIdBigInt = Number(waste.main_category_id);
          }
        }
      }

      if (waste.sub_category_id !== undefined) {
        if (waste.sub_category_id === null) {
          subCategoryIdBigInt = null;
        } else {
          const subCategoryIdStr = waste.sub_category_id.toString();
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(subCategoryIdStr);
          
          if (isUUID) {
            // البحث عن code في unified_sub_categories
            const { data: unifiedSubCategory } = await supabase!
              .from("unified_sub_categories")
              .select("code")
              .eq("id", subCategoryIdStr)
              .single();
            
          if (unifiedSubCategory?.code) {
            // البحث عن bigint في waste_sub_categories
            let { data: oldSubCategory, error: oldSubCategoryError } = await supabase!
              .from("waste_sub_categories")
              .select("id")
              .eq("code", unifiedSubCategory.code)
              .maybeSingle();
            
            if (oldSubCategory && !oldSubCategoryError) {
              subCategoryIdBigInt = Number(oldSubCategory.id);
            } else {
              // إذا لم نجد في الجدول القديم، ننشئ سجل جديد
              console.log(`📝 إنشاء سجل جديد في waste_sub_categories للكود ${unifiedSubCategory.code}`);
              
              // جلب اسم الفئة من unified_sub_categories
              const { data: fullSubCategory } = await supabase!
                .from("unified_sub_categories")
                .select("name, name_ar, description, main_category_id")
                .eq("id", subCategoryIdStr)
                .single();
              
              // نحتاج لـ main_category_id في waste_main_categories (bigint)
              let mainCategoryIdForSub: number | null = null;
              if (fullSubCategory?.main_category_id) {
                // البحث عن main_category_id في waste_main_categories
                const { data: mainCatInOld } = await supabase!
                  .from("unified_main_categories")
                  .select("code")
                  .eq("id", fullSubCategory.main_category_id)
                  .single();
                
                if (mainCatInOld?.code) {
                  const { data: oldMainCat } = await supabase!
                    .from("waste_main_categories")
                    .select("id")
                    .eq("code", mainCatInOld.code)
                    .maybeSingle();
                  
                  if (oldMainCat) {
                    mainCategoryIdForSub = Number(oldMainCat.id);
                  }
                }
              }
              
              // إنشاء سجل جديد في waste_sub_categories
              const { data: newSubCategory, error: insertSubError } = await supabase!
                .from("waste_sub_categories")
                .insert({
                  code: unifiedSubCategory.code,
                  name: fullSubCategory?.name_ar || fullSubCategory?.name || unifiedSubCategory.code,
                  description: fullSubCategory?.description || null,
                  main_category_id: mainCategoryIdForSub,
                  is_active: true,
                })
                .select("id")
                .single();
              
              if (newSubCategory && !insertSubError) {
                subCategoryIdBigInt = Number(newSubCategory.id);
                console.log(`✅ تم إنشاء الفئة الفرعية بنجاح: ${subCategoryIdBigInt}`);
              } else {
                console.error(`❌ فشل في إنشاء الفئة الفرعية:`, insertSubError);
                subCategoryIdBigInt = null;
              }
            }
          }
          } else {
            subCategoryIdBigInt = Number(waste.sub_category_id);
          }
        }
      }

      const wasteData: any = {
        ...waste,
      };

      // إضافة bigint IDs فقط إذا تم تحديثها
      if (mainCategoryIdBigInt !== undefined) {
        wasteData.main_category_id = mainCategoryIdBigInt;
      }
      if (subCategoryIdBigInt !== undefined) {
        wasteData.sub_category_id = subCategoryIdBigInt;
      }

      const { data, error } = await supabase!
        .from("catalog_waste_materials")
        .update(wasteData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("خطأ في تحديث المخلفات:", error);
        toast.error(`حدث خطأ أثناء تحديث المخلفات: ${error.message}`);
        return null;
      }

      toast.success("تم تحديث المخلفات بنجاح");
      return data;
    } catch (error) {
      console.error("خطأ في تحديث المخلفات:", error);
      toast.error(
        `حدث خطأ أثناء تحديث المخلفات: ${
          error instanceof Error ? error.message : "خطأ غير معروف"
        }`,
      );
      return null;
    }
  }

  // جلب جميع المخلفات
  async getWasteMaterials(): Promise<WasteCatalogItem[]> {
    try {
      // الخطوة 1: جلب المخلفات من الكتالوج
      const { data: catalogItems, error: catalogError } = await supabase!
        .from("catalog_waste_materials")
        .select(`
          *,
          warehouse:warehouses(name),
          unit:units(name),
          related_product:catalog_products(name, sku)
        `)
        .order("created_at", { ascending: false });

      // جلب القطاعات من waste_sectors (sector_id هو Int يشير إلى waste_sectors)
      const sectorIds = new Set<number>();
      catalogItems?.forEach(item => {
        if (item.sector_id) {
          sectorIds.add(Number(item.sector_id));
        }
      });

      let sectors: any[] = [];
      if (sectorIds.size > 0) {
        const { data: sectorsData, error: sectorsError } = await supabase!
          .from("waste_sectors")
          .select("id, name, code")
          .in("id", Array.from(sectorIds));
        
        if (!sectorsError && sectorsData) {
          sectors = sectorsData;
          console.log(`✅ تم جلب ${sectors.length} قطاع من waste_sectors:`, sectors);
        } else if (sectorsError) {
          console.error(`❌ خطأ في جلب القطاعات:`, sectorsError);
        }
      } else {
        console.log(`⚠️ لا توجد sector_ids في catalog_waste_materials`);
      }

      const sectorMap = new Map(sectors.map(s => [Number(s.id), s]));

      if (catalogError) {
        console.error("خطأ في جلب المخلفات:", catalogError);
        toast.error("حدث خطأ أثناء جلب المخلفات");
        return [];
      }

      if (!catalogItems || catalogItems.length === 0) {
        return [];
      }

      // الخطوة 2: جمع IDs الفئات القديمة
      const mainCategoryIds = new Set<number>();
      const subCategoryIds = new Set<number>();
      catalogItems.forEach(item => {
        if (item.main_category_id) mainCategoryIds.add(Number(item.main_category_id));
        if (item.sub_category_id) subCategoryIds.add(Number(item.sub_category_id));
      });

      // الخطوة 3: جلب الفئات من الجداول القديمة
      let oldMainCategories: any[] = [];
      let oldSubCategories: any[] = [];
      
      if (mainCategoryIds.size > 0) {
        const { data, error } = await supabase!
          .from("waste_main_categories")
          .select("id, code, name")
          .in("id", Array.from(mainCategoryIds));
        if (!error && data) {
          oldMainCategories = data;
        }
      }

      if (subCategoryIds.size > 0) {
        const { data, error } = await supabase!
          .from("waste_sub_categories")
          .select("id, code, name")
          .in("id", Array.from(subCategoryIds));
        if (!error && data) {
          oldSubCategories = data;
        }
      }

      // إنشاء maps للبحث السريع
      const oldMainCategoryMap = new Map(oldMainCategories.map(cat => [cat.id, cat]));
      const oldSubCategoryMap = new Map(oldSubCategories.map(cat => [cat.id, cat]));

      // الخطوة 4: جمع codes للبحث في الجداول الموحدة
      const mainCategoryCodes = new Set<string>();
      const subCategoryCodes = new Set<string>();
      oldMainCategories.forEach(cat => { if (cat.code) mainCategoryCodes.add(cat.code); });
      oldSubCategories.forEach(cat => { if (cat.code) subCategoryCodes.add(cat.code); });

      // الخطوة 5: جلب الفئات الموحدة
      let unifiedMainCategories: any[] = [];
      let unifiedSubCategories: any[] = [];
      
      if (mainCategoryCodes.size > 0) {
        const { data, error } = await supabase!
          .from("unified_main_categories")
          .select("id, code, name, name_ar")
          .in("code", Array.from(mainCategoryCodes))
          .eq("is_active", true);
        if (!error && data) {
          unifiedMainCategories = data;
        }
      }

      if (subCategoryCodes.size > 0) {
        const { data, error } = await supabase!
          .from("unified_sub_categories")
          .select("id, code, name, name_ar")
          .in("code", Array.from(subCategoryCodes))
          .eq("is_active", true);
        if (!error && data) {
          unifiedSubCategories = data;
        }
      }

      // إنشاء maps للبحث السريع
      const unifiedMainCategoryMap = new Map(unifiedMainCategories.map(cat => [cat.code, cat]));
      const unifiedSubCategoryMap = new Map(unifiedSubCategories.map(cat => [cat.code, cat]));

      // الخطوة 6: دمج البيانات
      const enrichedItems = catalogItems.map(item => {
        const oldMainCategory = item.main_category_id 
          ? oldMainCategoryMap.get(Number(item.main_category_id))
          : null;
        const oldSubCategory = item.sub_category_id
          ? oldSubCategoryMap.get(Number(item.sub_category_id))
          : null;

        const unifiedMainCategory = oldMainCategory?.code
          ? unifiedMainCategoryMap.get(oldMainCategory.code)
          : null;
        const unifiedSubCategory = oldSubCategory?.code
          ? unifiedSubCategoryMap.get(oldSubCategory.code)
          : null;

        // Debug logging
        if (item.waste_no && !unifiedSubCategory && !oldSubCategory && item.sub_category_id) {
          console.warn(`⚠️ لم يتم العثور على الفئة الفرعية للمخلف ${item.waste_no}:`, {
            sub_category_id: item.sub_category_id,
            oldSubCategory,
            unifiedSubCategory,
            oldSubCategories: oldSubCategories.length,
            unifiedSubCategories: unifiedSubCategories.length
          });
        }

        const sector = item.sector_id ? sectorMap.get(Number(item.sector_id)) : null;
        
        // Debug logging للقطاع
        if (item.waste_no && item.sector_id && !sector) {
          console.warn(`⚠️ لم يتم العثور على القطاع للمخلف ${item.waste_no}:`, {
            sector_id: item.sector_id,
            sectorMapSize: sectorMap.size,
            sectors: sectors.length
          });
        }

        // تحويل images من JSONB إلى array إذا لزم الأمر
        let imagesArray: string[] = [];
        if (item.images) {
          if (Array.isArray(item.images)) {
            imagesArray = item.images;
          } else if (typeof item.images === 'string') {
            try {
              const parsed = JSON.parse(item.images);
              imagesArray = Array.isArray(parsed) ? parsed : [];
            } catch {
              imagesArray = [];
            }
          }
        }

        return {
          ...item,
          main_category: unifiedMainCategory 
            ? { name: unifiedMainCategory.name_ar || unifiedMainCategory.name, name_ar: unifiedMainCategory.name_ar }
            : (oldMainCategory ? { name: oldMainCategory.name, name_ar: oldMainCategory.name } : null),
          sub_category: unifiedSubCategory
            ? { name: unifiedSubCategory.name_ar || unifiedSubCategory.name, name_ar: unifiedSubCategory.name_ar }
            : (oldSubCategory ? { name: oldSubCategory.name, name_ar: oldSubCategory.name } : null),
          sector: sector ? { 
            id: sector.id, 
            name: sector.name, 
            name_ar: sector.name_ar || sector.name 
          } : null,
          images: imagesArray,
        };
      });

      return enrichedItems;
    } catch (error) {
      console.error("خطأ في جلب المخلفات:", error);
      toast.error("حدث خطأ أثناء جلب المخلفات");
      return [];
    }
  }

  // جلب مخلفات واحدة
  async getWasteMaterial(id: number): Promise<WasteCatalogItem | null> {
    try {
      const { data, error } = await supabase!
        .from("catalog_waste_materials")
        .select(`
          *,
          warehouse:warehouses(name),
          main_category:unified_main_categories(name, name_ar),
          sub_category:unified_sub_categories(name, name_ar),
          unit:units(name),
          related_product:catalog_products(name, sku)
        `)
        .eq("id", id)
        .single();

      if (error) {
        console.error("خطأ في جلب المخلفات:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("خطأ في جلب المخلفات:", error);
      return null;
    }
  }

  // حذف مخلفات
  async deleteWasteMaterial(id: number): Promise<boolean> {
    try {
      const { error } = await supabase!
        .from("catalog_waste_materials")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("خطأ في حذف المخلفات:", error);
        toast.error(`حدث خطأ أثناء حذف المخلفات: ${error.message}`);
        return false;
      }

      toast.success("تم حذف المخلفات بنجاح");
      return true;
    } catch (error) {
      console.error("خطأ في حذف المخلفات:", error);
      toast.error(
        `حدث خطأ أثناء حذف المخلفات: ${
          error instanceof Error ? error.message : "خطأ غير معروف"
        }`,
      );
      return false;
    }
  }

  // جلب الفئات الأساسية للمخلفات من الجداول الموحدة
  async getWasteMainCategories(sectorId?: number | string): Promise<WasteMainCategory[]> {
    try {
      let query = supabase!
        .from("unified_main_categories")
        .select("id, code, name, name_ar, description, item_type, classification_id")
        .in("item_type", ["waste", "both"])
        .eq("is_active", true);

      // إذا تم تحديد القطاع، فلترة الفئات حسب القطاع
      if (sectorId) {
        // جلب التصنيفات المرتبطة بهذا القطاع
        // sectorId قد يكون UUID (string) أو number، نحتاج للتعامل معه بشكل صحيح
        let sectorIdForQuery: string;
        
        if (typeof sectorId === 'string') {
          // إذا كان UUID بالفعل
          sectorIdForQuery = sectorId;
        } else {
          // إذا كان number، قد يكون من الجداول القديمة أو index في القائمة
          // نحتاج للبحث عن UUID في warehouse_sectors
          // أولاً، نحاول البحث باستخدام code إذا كان متاحاً
          // أو نحتاج للحصول على القطاع من القائمة المحملة
          
          // محاولة البحث في waste_sectors أولاً (الجداول القديمة)
          const { data: oldSector } = await supabase!
            .from("waste_sectors")
            .select("id, code")
            .eq("id", sectorId)
            .single();
          
          if (oldSector && oldSector.code) {
            // البحث عن القطاع في warehouse_sectors باستخدام code
            const { data: newSector } = await supabase!
              .from("warehouse_sectors")
              .select("id")
              .eq("code", oldSector.code)
              .eq("is_active", true)
              .single();
            
            if (newSector) {
              sectorIdForQuery = newSector.id;
            } else {
              console.warn(`⚠️ لم يتم العثور على القطاع بالكود: ${oldSector.code}`);
              return [];
            }
          } else {
            // إذا لم نجد في waste_sectors، قد يكون index في القائمة
            // في هذه الحالة، نحتاج للحصول على القطاع من getWasteSectors
            // لكن هذا يتطلب تحميل القطاعات أولاً
            // بدلاً من ذلك، سنحاول البحث مباشرة في warehouse_sectors
            // لكن هذا لن يعمل لأن id هو UUID
            
            // الحل الأفضل: البحث في جميع القطاعات النشطة
            const { data: allSectors } = await supabase!
              .from("warehouse_sectors")
              .select("id, code")
              .eq("is_active", true)
              .order("name");
            
            if (allSectors && allSectors.length > 0) {
              // استخدام index (sectorId - 1) للوصول للقطاع
              const sectorIndex = Number(sectorId) - 1;
              if (sectorIndex >= 0 && sectorIndex < allSectors.length) {
                sectorIdForQuery = allSectors[sectorIndex].id;
                console.log(`✅ تم العثور على القطاع باستخدام index: ${sectorIndex} -> ${sectorIdForQuery}`);
              } else {
                console.warn(`⚠️ index القطاع خارج النطاق: ${sectorIndex} من ${allSectors.length}`);
                return [];
              }
            } else {
              console.warn(`⚠️ لم يتم العثور على القطاع بالمعرف: ${sectorId}`);
              return [];
            }
          }
        }

        console.log(`🔍 البحث عن التصنيفات للقطاع: ${sectorIdForQuery}`);
        
        const { data: classifications, error: classError } = await supabase!
          .from("unified_classifications")
          .select("id, name, name_ar, item_type")
          .eq("sector_id", sectorIdForQuery)
          .eq("is_active", true);

        if (classError) {
          console.error("❌ خطأ في جلب التصنيفات:", classError);
          console.error("❌ تفاصيل الخطأ:", JSON.stringify(classError, null, 2));
          return [];
        }

        console.log(`📋 التصنيفات الموجودة: ${classifications?.length || 0}`, classifications);

        if (classifications && classifications.length > 0) {
          // فلترة التصنيفات حسب item_type (waste أو both)
          const wasteClassifications = classifications.filter(c => 
            c.item_type === 'waste' || c.item_type === 'both'
          );
          
          console.log(`📋 التصنيفات للمخلفات: ${wasteClassifications.length}`, wasteClassifications);

          if (wasteClassifications.length > 0) {
            const classificationIds = wasteClassifications.map(c => c.id);
            query = query.in("classification_id", classificationIds);
          } else {
            console.warn(`⚠️ لا توجد تصنيفات للمخلفات في القطاع: ${sectorIdForQuery}`);
            return [];
          }
        } else {
          // إذا لم توجد تصنيفات لهذا القطاع، إرجاع قائمة فارغة
          console.warn(`⚠️ لا توجد تصنيفات مرتبطة بالقطاع: ${sectorIdForQuery}`);
          return [];
        }
      }

      // جلب التصنيفات مع الفئات الأساسية لعرض معلومات التصنيف
      const { data, error } = await query
        .select(`
          id, 
          code, 
          name, 
          name_ar, 
          description, 
          item_type, 
          classification_id,
          classification:unified_classifications!unified_main_categories_classification_id_fkey(
            id,
            name,
            name_ar
          )
        `)
        .order("name_ar", { ascending: true, nullsFirst: false })
        .order("name", { ascending: true });

      if (error) {
        console.error("❌ خطأ في جلب فئات المخلفات الأساسية:", error);
        console.error("❌ تفاصيل الخطأ:", JSON.stringify(error, null, 2));
        return [];
      }

      console.log(`✅ تم جلب ${data?.length || 0} فئة مخلفات أساسية من unified_main_categories${sectorId ? ` للقطاع ${sectorId}` : ''}`);
      if (data && data.length > 0) {
        console.log('📋 الفئات:', data.map((c: any) => ({ 
          id: c.id, 
          name: c.name_ar || c.name, 
          code: c.code,
          classification: c.classification?.name_ar || c.classification?.name 
        })));
      } else {
        console.warn(`⚠️ لم يتم العثور على فئات أساسية${sectorId ? ` للقطاع ${sectorId}` : ''}`);
      }

      // تحويل البيانات إلى الشكل المتوقع مع إضافة معلومات التصنيف
      return (data || []).map((cat: any) => {
        const classificationName = cat.classification?.name_ar || cat.classification?.name || '';
        const categoryName = cat.name_ar || cat.name;
        
        // إضافة اسم التصنيف إلى اسم الفئة إذا كان متاحاً
        const displayName = classificationName 
          ? `${categoryName} (${classificationName})`
          : categoryName;
        
        return {
          id: cat.id, // يمكن أن يكون UUID أو number
          code: cat.code,
          name: displayName, // اسم الفئة مع التصنيف
          description: cat.description,
          classification_id: cat.classification_id,
          classification_name: classificationName,
        };
      });
    } catch (error) {
      console.error("❌ خطأ في جلب فئات المخلفات الأساسية:", error);
      return [];
    }
  }

  // جلب الفئات الفرعية للمخلفات من الجداول الموحدة
  async getWasteSubCategories(
    mainCategoryId?: number | string,
  ): Promise<WasteSubCategory[]> {
    try {
      let query = supabase!
        .from("unified_sub_categories")
        .select("id, code, name, name_ar, main_category_id, item_type")
        .in("item_type", ["waste", "both"])
        .eq("is_active", true)
        .order("name");

      if (mainCategoryId) {
        // mainCategoryId قد يكون UUID (string) أو number
        const mainCategoryIdStr = mainCategoryId.toString();
        
        // استخدام mainCategoryId مباشرة (سواء كان UUID أو number)
        query = query.eq("main_category_id", mainCategoryIdStr);
      }

      const { data, error } = await query;

      if (error) {
        console.error("خطأ في جلب فئات المخلفات الفرعية:", error);
        return [];
      }

      // تحويل البيانات إلى الشكل المتوقع
      // id قد يكون UUID (string) أو number
      return (data || []).map(cat => {
        // التحقق من نوع ID
        let categoryId: string | number;
        if (typeof cat.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cat.id)) {
          // UUID
          categoryId = cat.id;
        } else {
          // number
          categoryId = parseInt(cat.id) || 0;
        }

        let mainCategoryId: string | number | null = null;
        if (cat.main_category_id) {
          if (typeof cat.main_category_id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cat.main_category_id)) {
            mainCategoryId = cat.main_category_id;
          } else {
            mainCategoryId = parseInt(cat.main_category_id) || 0;
          }
        }

        return {
          id: categoryId,
          code: cat.code,
          name: cat.name_ar || cat.name,
          main_id: mainCategoryId,
        };
      });
    } catch (error) {
      console.error("خطأ في جلب فئات المخلفات الفرعية:", error);
      return [];
    }
  }

  // إضافة فئة أساسية جديدة للمخلفات - ملاحظة: يجب استخدام unifiedCategoriesService لإضافة فئات جديدة
  // هذه الدالة محفوظة للتوافق الخلفي فقط
  async addWasteMainCategory(
    code: string,
    name: string,
  ): Promise<WasteMainCategory | null> {
    try {
      toast.error('يرجى استخدام صفحة إدارة التنظيم والتسلسل لإضافة فئات جديدة');
      console.warn('addWasteMainCategory deprecated - use unifiedCategoriesService instead');
      return null;
    } catch (error) {
      console.error("خطأ في إضافة فئة المخلفات الأساسية:", error);
      return null;
    }
  }

  // إضافة فئة فرعية جديدة للمخلفات - ملاحظة: يجب استخدام unifiedCategoriesService لإضافة فئات جديدة
  // هذه الدالة محفوظة للتوافق الخلفي فقط
  async addWasteSubCategory(
    code: string,
    name: string,
    mainId: number,
  ): Promise<WasteSubCategory | null> {
    try {
      toast.error('يرجى استخدام صفحة إدارة التنظيم والتسلسل لإضافة فئات جديدة');
      console.warn('addWasteSubCategory deprecated - use unifiedCategoriesService instead');
      return null;
    } catch (error) {
      console.error("خطأ في إضافة فئة المخلفات الفرعية:", error);
      return null;
    }
  }

  // التحقق من وجود رقم المخلفات
  async checkWasteNumberExists(
    wasteNo: string,
    excludeId?: number,
  ): Promise<boolean> {
    try {
      let query = supabase!
        .from("catalog_waste_materials")
        .select("id")
        .eq("waste_no", wasteNo);

      if (excludeId) {
        query = query.neq("id", excludeId);
      }

      const { data, error } = await query.limit(1);

      if (error) {
        console.error("خطأ في التحقق من رقم المخلفات:", error);
        return false;
      }

      return (data && data.length > 0);
    } catch (error) {
      console.error("خطأ في التحقق من رقم المخلفات:", error);
      return false;
    }
  }

  // توليد رقم مخلفات فريد
  async generateUniqueWasteNumber(): Promise<string> {
    let wasteNo: string;
    let exists = true;
    let attempts = 0;
    const maxAttempts = 10;

    while (exists && attempts < maxAttempts) {
      const year = new Date().getFullYear();
      const timestamp = Date.now().toString().slice(-6);
      wasteNo = `WASTE-${year}-${timestamp}`;

      exists = await this.checkWasteNumberExists(wasteNo);
      attempts++;
    }

    if (exists) {
      throw new Error("فشل في توليد رقم مخلفات فريد");
    }

    return wasteNo!;
  }

  // البحث عن منتجات مرتبطة
  async searchRelatedProducts(
    query: string,
  ): Promise<Array<{ id: number; name: string; sku: string; brand: string }>> {
    try {
      const { data, error } = await supabase!
        .from("catalog_products")
        .select("id, name, sku, brand")
        .or(`name.ilike.%${query}%,sku.ilike.%${query}%,brand.ilike.%${query}%`)
        .limit(10);

      if (error) {
        console.error("خطأ في البحث عن المنتجات:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("خطأ في البحث عن المنتجات:", error);
      return [];
    }
  }

  // حساب القيمة البيئية المحفوظة
  calculateEnvironmentalSavings(wasteType: string, weight: number): {
    carbonSaving: number;
    energySaving: number;
    waterSaving: number;
    treesSaved: number;
  } {
    // معاملات بيئية تقريبية حسب نوع المادة
    const coefficients: {
      [key: string]: {
        carbon: number;
        energy: number;
        water: number;
        trees: number;
      };
    } = {
      "بلاستيك": { carbon: 2.5, energy: 15, water: 50, trees: 0.1 },
      "معادن": { carbon: 4.2, energy: 25, water: 80, trees: 0.15 },
      "كرتون/ورق": { carbon: 1.8, energy: 8, water: 30, trees: 0.05 },
      "زجاج": { carbon: 0.3, energy: 2, water: 5, trees: 0.01 },
      "أقمشة/نسيج": { carbon: 3.1, energy: 18, water: 60, trees: 0.12 },
      "إلكترونيات": { carbon: 5.5, energy: 35, water: 120, trees: 0.2 },
    };

    const coeff = coefficients[wasteType] || coefficients["بلاستيك"];

    return {
      carbonSaving: weight * coeff.carbon,
      energySaving: weight * coeff.energy,
      waterSaving: weight * coeff.water,
      treesSaved: weight * coeff.trees,
    };
  }

  // تحديث حالة المخلفات
  async updateWasteStatus(id: number, status: string): Promise<boolean> {
    try {
      const { error } = await supabase!
        .from("catalog_waste_materials")
        .update({ status })
        .eq("id", id);

      if (error) {
        console.error("خطأ في تحديث حالة المخلفات:", error);
        toast.error(`حدث خطأ أثناء تحديث الحالة: ${error.message}`);
        return false;
      }

      toast.success("تم تحديث حالة المخلفات بنجاح");
      return true;
    } catch (error) {
      console.error("خطأ في تحديث حالة المخلفات:", error);
      toast.error(
        `حدث خطأ أثناء تحديث الحالة: ${
          error instanceof Error ? error.message : "خطأ غير معروف"
        }`,
      );
      return false;
    }
  }

  // جلب إحصائيات المخلفات
  async getWasteStatistics(): Promise<{
    totalWaste: number;
    recyclableWaste: number;
    totalValue: number;
    categoriesBreakdown: { [key: string]: number };
  }> {
    try {
      const { data, error } = await supabase!
        .from("catalog_waste_materials")
        .select(
          "weight, volume, count, recyclable, expected_total, main_category_id",
        );

      if (error) {
        console.error("خطأ في جلب إحصائيات المخلفات:", error);
        return {
          totalWaste: 0,
          recyclableWaste: 0,
          totalValue: 0,
          categoriesBreakdown: {},
        };
      }

      let totalWaste = 0;
      let recyclableWaste = 0;
      let totalValue = 0;
      const categoriesBreakdown: { [key: string]: number } = {};

      data?.forEach((item) => {
        const quantity = item.weight || item.volume || item.count || 0;
        totalWaste += quantity;

        if (item.recyclable) {
          recyclableWaste += quantity;
        }

        totalValue += item.expected_total || 0;

        const categoryId = item.main_category_id?.toString() || "غير محدد";
        categoriesBreakdown[categoryId] =
          (categoriesBreakdown[categoryId] || 0) + quantity;
      });

      return {
        totalWaste,
        recyclableWaste,
        totalValue,
        categoriesBreakdown,
      };
    } catch (error) {
      console.error("خطأ في جلب إحصائيات المخلفات:", error);
      return {
        totalWaste: 0,
        recyclableWaste: 0,
        totalValue: 0,
        categoriesBreakdown: {},
      };
    }
  }

  // جلب المخازن
  async getUnits(): Promise<{ id: number; name: string; symbol: string }[]> {
    try {
      console.log("محاولة جلب الوحدات من قاعدة البيانات...");

      const { data, error } = await supabase!
        .from("units")
        .select("id, name")
        .order("name");

      if (error) {
        console.warn(
          "خطأ في جلب الوحدات من قاعدة البيانات، استخدام البيانات الافتراضية:",
          error.message,
        );
        // إرجاع بيانات افتراضية في حالة عدم وجود الجدول
        return this.getDefaultUnits();
      }

      if (data && data.length > 0) {
        console.log(
          "تم جلب الوحدات بنجاح من قاعدة البيانات:",
          data.length,
          "وحدة",
        );
        return data;
      } else {
        console.warn(
          "لا توجد وحدات في قاعدة البيانات، استخدام البيانات الافتراضية",
        );
        return this.getDefaultUnits();
      }
    } catch (error) {
      console.warn(
        "خطأ في الاتصال بقاعدة البيانات، استخدام البيانات الافتراضية:",
        error instanceof Error ? error.message : "خطأ غير معروف",
      );
      // إرجاع بيانات افتراضية في حالة الخطأ
      return this.getDefaultUnits();
    }
  }

  // دالة للحصول على الوحدات الافتراضية
  private getDefaultUnits(): { id: number; name: string; symbol: string }[] {
    return [
      { id: 1, name: "كيلوجرام", symbol: "كجم" },
      { id: 2, name: "جرام", symbol: "جم" },
      { id: 3, name: "طن", symbol: "طن" },
      { id: 4, name: "لتر", symbol: "لتر" },
      { id: 5, name: "متر مكعب", symbol: "م³" },
      { id: 6, name: "قطعة", symbol: "قطعة" },
      { id: 7, name: "متر", symbol: "م" },
      { id: 8, name: "سنتيمتر", symbol: "سم" },
    ];
  }

  // دالة للحصول على خيارات المصدر الافتراضية
  private getDefaultSourceOptions(): {
    id: string;
    name: string;
    description?: string;
  }[] {
    return [
      {
        id: "damaged_product",
        name: "منتج تالف",
        description: "منتجات تالفة أو معيبة",
      },
      {
        id: "expired_product",
        name: "منتج منتهي الصلاحية",
        description: "منتجات انتهت صلاحيتها",
      },
      {
        id: "empty_containers",
        name: "عبوات فارغة",
        description: "عبوات فارغة من المنتجات",
      },
      {
        id: "returns",
        name: "مرتجعات",
        description: "منتجات مرتجعة من العملاء",
      },
      {
        id: "production_residues",
        name: "بقايا إنتاج/تغليف",
        description: "بقايا من عمليات الإنتاج والتغليف",
      },
      {
        id: "packaging_materials",
        name: "مواد تغليف",
        description: "مواد تغليف مستخدمة",
      },
      {
        id: "office_waste",
        name: "مخلفات مكتبية",
        description: "مخلفات من المكاتب والإدارة",
      },
      {
        id: "other",
        name: "أخرى",
        description: "مصادر أخرى للمخلفات",
      },
    ];
  }

  // جلب خيارات المصدر (محدثة لدعم النظام الجديد)
  async getSourceOptions(
    filters?: { sectorId?: number; clientTypeId?: number },
  ): Promise<{ id: string; name: string; description?: string }[]> {
    try {
      // إذا تم تمرير فلتر القطاع ونوع العميل، استخدم النظام الجديد
      if (filters?.sectorId && filters?.clientTypeId) {
        console.log(
          "استخدام النظام الجديد لجلب خيارات المصدر للقطاع",
          filters.sectorId,
          "ونوع العميل",
          filters.clientTypeId,
        );
        const availableSources = await this.getAvailableSources(
          filters.sectorId,
          filters.clientTypeId,
        );
        return availableSources.map((source) => ({
          id: source.id.toString(),
          name: source.name,
          description: source.name, // يمكن إضافة description منفصل لاحقاً
        }));
      }

      // النظام القديم - جلب جميع المصادر
      console.log("جلب جميع خيارات المصدر من قاعدة البيانات...");

      const { data, error } = await supabase!
        .from("waste_sources")
        .select("id, name, description")
        .order("name");

      if (error) {
        console.warn(
          "خطأ في جلب خيارات المصدر من قاعدة البيانات، استخدام البيانات الافتراضية:",
          error.message,
        );
        return this.getDefaultSourceOptions();
      }

      if (data && data.length > 0) {
        console.log(
          "تم جلب خيارات المصدر بنجاح من قاعدة البيانات:",
          data.length,
          "خيار",
        );
        return data;
      } else {
        console.warn(
          "لا توجد خيارات مصدر في قاعدة البيانات، استخدام البيانات الافتراضية",
        );
        return this.getDefaultSourceOptions();
      }
    } catch (error) {
      console.warn(
        "خطأ في الاتصال بقاعدة البيانات، استخدام البيانات الافتراضية:",
        error instanceof Error ? error.message : "خطأ غير معروف",
      );
      return this.getDefaultSourceOptions();
    }
  }

  async getWarehouses(): Promise<{ id: number; name: string }[]> {
    try {
      const { data, error } = await supabase!
        .from("warehouses")
        .select("id, name")
        .order("name");

      if (error) {
        console.error("خطأ في جلب المخازن:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("خطأ في جلب المخازن:", error);
      return [];
    }
  }

  // ===== الدوال الجديدة للنظام المحسن =====

  // جلب جميع القطاعات
  async getWasteSectors(): Promise<WasteSector[]> {
    try {
      console.log("جلب القطاعات من جدول waste_sectors...");
      const { data, error } = await supabase!
        .from("waste_sectors")
        .select("id, name, description, code")
        .order("name");

      if (error) {
        console.error("خطأ في جلب القطاعات من waste_sectors:", error);
        // محاولة بديلة من warehouse_sectors إذا فشل الأول
        console.log("محاولة جلب القطاعات من warehouse_sectors كخيار بديل...");
        const { data: whData, error: whError } = await supabase!
          .from("warehouse_sectors")
          .select("id, name, description, code")
          .eq("is_active", true)
          .order("name");
          
        if (whError) {
          console.error("خطأ في جلب القطاعات من warehouse_sectors أيضاً:", whError);
          return [];
        }
        
        // إرجاع UUID كـ string للتوافق مع النظام الجديد
        return whData?.map(item => ({
          id: item.id, // استخدام UUID مباشرة
          name: item.name,
          description: item.description,
          code: item.code
        })) || [];
      }

      return data || [];
    } catch (error) {
      console.error("خطأ في جلب القطاعات:", error);
      return [];
    }
  }

  // دالة مساعدة للحصول على اسم القطاع المعروض
  getSectorDisplayName(code: string): string {
    const nameMap: { [key: string]: string } = {
      "ADMINISTRATIVE": "إداري",
      "COMMERCIAL": "تجاري",
      "حكومى": "حكومي",
      "خدمي": "خدمي",
      "AGRICULTURAL": "زراعي",
      "TOURISM": "سياحي",
      "INDUSTRIAL": "صناعي",
      "MEDICAL": "طبي",
      "HOUSEHOLD": "منزلي",
    };
    return nameMap[code] || code;
  }

  // دالة مساعدة للحصول على وصف القطاع
  getSectorDescription(code: string): string {
    const descriptionMap: { [key: string]: string } = {
      "ADMINISTRATIVE": "القطاع الإداري والحكومي",
      "COMMERCIAL": "القطاع التجاري والتجارة",
      "حكومى": "القطاع الحكومي والخدمات العامة",
      "خدمي": "القطاع الخدمي والخدمات",
      "AGRICULTURAL": "القطاع الزراعي والبيئي",
      "TOURISM": "القطاع السياحي والترفيهي",
      "INDUSTRIAL": "القطاع الصناعي والتصنيع",
      "MEDICAL": "القطاع الطبي والصحي",
      "HOUSEHOLD": "القطاع المنزلي والأسري",
    };
    return descriptionMap[code] || "قطاع عام";
  }

  // جلب أنواع العملاء حسب القطاع
  async getClientTypes(sectorId?: number): Promise<ClientType[]> {
    try {
      let query = supabase!
        .from("client_types")
        .select("*")
        .order("name");

      if (sectorId) {
        query = query.eq("sector_id", sectorId);
      }

      const { data, error } = await query;

      if (error) {
        console.warn("خطأ في جلب أنواع العملاء من قاعدة البيانات، استخدام البيانات الافتراضية:", error.message);
        return this.getDefaultClientTypes(sectorId);
      }

      if (data && data.length > 0) {
        return data;
      } else {
        return this.getDefaultClientTypes(sectorId);
      }
    } catch (error) {
      console.warn("خطأ في جلب أنواع العملاء، استخدام البيانات الافتراضية");
      return this.getDefaultClientTypes(sectorId);
    }
  }

  private getDefaultClientTypes(sectorId?: number): ClientType[] {
    const allTypes = [
      { id: 1, sector_id: 1, name: 'مطاعم', description: 'مطاعم وكافيهات' },
      { id: 2, sector_id: 1, name: 'محلات تجارية', description: 'متاجر تجزئة' },
      { id: 3, sector_id: 2, name: 'مصانع أغذية', description: 'منشآت إنتاج غذائي' },
      { id: 4, sector_id: 2, name: 'مصانع بلاستيك', description: 'منشآت إنتاج بلاستيك' },
      { id: 5, sector_id: 3, name: 'مستشفيات', description: 'منشآت طبية كبرى' },
      { id: 6, sector_id: 3, name: 'عيادات', description: 'مراكز طبية صغيرة' },
      { id: 7, sector_id: 4, name: 'منازل', description: 'وحدات سكنية' }
    ];
    
    if (sectorId) {
      return allTypes.filter(t => t.sector_id === sectorId);
    }
    return allTypes;
  }

  // جلب المصادر المتاحة حسب القطاع ونوع العميل
  async getAvailableSources(
    sectorId: number,
    clientTypeId: number,
  ): Promise<WasteMainCategory[]> {
    try {
      const { data, error } = await supabase!
        .from("sector_client_source_reason")
        .select(`
          source_id,
          waste_sources!inner (id, name, description),
          priority_order
        `)
        .eq("sector_id", sectorId)
        .eq("client_type_id", clientTypeId)
        .eq("is_active", true)
        .order("priority_order", { ascending: true });

      if (error) {
        console.warn("خطأ في جلب المصادر المتاحة من قاعدة البيانات، استخدام البيانات الافتراضية:", error.message);
        return this.getDefaultAvailableSources();
      }

      if (data && data.length > 0) {
        return data?.map((item: AvailableSourceData) => {
          const source = Array.isArray(item.waste_sources)
            ? item.waste_sources[0]
            : item.waste_sources;
          return {
            id: source.id,
            code: source.id,
            name: source.name,
            description: source.description || source.name,
          };
        });
      } else {
        return this.getDefaultAvailableSources();
      }
    } catch (error) {
      console.warn("خطأ في جلب المصادر المتاحة، استخدام البيانات الافتراضية");
      return this.getDefaultAvailableSources();
    }
  }

  private getDefaultAvailableSources(): WasteMainCategory[] {
    return [
      { id: 'damaged_product', code: 'damaged_product', name: 'منتج تالف' },
      { id: 'expired_product', code: 'expired_product', name: 'منتج منتهي الصلاحية' },
      { id: 'empty_containers', code: 'empty_containers', name: 'عبوات فارغة' },
      { id: 'returns', code: 'returns', name: 'مرتجعات' },
      { id: 'production_residues', code: 'production_residues', name: 'بقايا إنتاج/تغليف' },
      { id: 'packaging_materials', code: 'packaging_materials', name: 'مواد تغليف' },
      { id: 'office_waste', code: 'office_waste', name: 'مخلفات مكتبية' },
      { id: 'other', code: 'other', name: 'أخرى' }
    ];
  }

  // جلب الأسباب المتاحة حسب المصدر (محدثة)
  async getAvailableReasons(
    sectorId: number,
    clientTypeId: number,
    sourceId: string,
  ): Promise<SourceReason[]> {
    try {
      const { data, error } = await supabase!
        .from("sector_client_source_reason")
        .select(`
          reason_id,
          source_reasons!inner (id, name, description),
          priority_order
        `)
        .eq("sector_id", sectorId)
        .eq("client_type_id", clientTypeId)
        .eq("source_id", sourceId)
        .eq("is_active", true)
        .order("priority_order", { ascending: true });

      if (error) {
        console.warn("خطأ في جلب الأسباب المتاحة من قاعدة البيانات، استخدام البيانات الافتراضية:", error.message);
        return this.getDefaultAvailableReasons();
      }

      if (data && data.length > 0) {
        return data?.map((item: AvailableReasonData) => {
          const reason = Array.isArray(item.source_reasons)
            ? item.source_reasons[0]
            : item.source_reasons;
          return {
            id: reason.id,
            name: reason.name,
            description: reason.description,
          };
        });
      } else {
        return this.getDefaultAvailableReasons();
      }
    } catch (error) {
      console.warn("خطأ في جلب الأسباب المتاحة، استخدام البيانات الافتراضية");
      return this.getDefaultAvailableReasons();
    }
  }

  private getDefaultAvailableReasons(): SourceReason[] {
    return [
      { id: 1, name: 'تلف ناتج عن سوء التخزين', description: 'تلف بسبب ظروف تخزين غير مناسبة' },
      { id: 2, name: 'انتهاء الصلاحية', description: 'تجاوز تاريخ الاستخدام الموصى به' },
      { id: 3, name: 'كسر أو ضرر مادي', description: 'ضرر ناتج عن السقوط أو الضغط' },
      { id: 4, name: 'عيب مصنعي', description: 'مشكلة ناتجة عن عملية الإنتاج' }
    ];
  }

  // دالة مساعدة لتحديد نوع مصدر البيانات
  private isLegacySourceId(id: string): boolean {
    // التحقق من النوع المطلوب بناءً على تنسيق ID
    return id.includes("_") || /^[a-z_]+$/.test(id);
  }

  // دالة للحصول على معلومات المصدر حسب نوعه
  private async getSourceInfoById(
    sourceId: string,
  ): Promise<{ id: string; name: string; description?: string } | null> {
    try {
      // جرب جلب من جدول waste_sources أولاً
      const { data, error } = await supabase!
        .from("waste_sources")
        .select("id, name, description")
        .eq("id", sourceId)
        .single();

      if (data && !error) {
        return data;
      }

      // إذا لم يجد في قاعدة البيانات، استخدم الافتراضي
      const defaultOptions = this.getDefaultSourceOptions();
      return defaultOptions.find((option) => option.id === sourceId) || null;
    } catch (error) {
      console.warn("خطأ في جلب معلومات المصدر:", error);
      const defaultOptions = this.getDefaultSourceOptions();
      return defaultOptions.find((option) => option.id === sourceId) || null;
    }
  }

  // إضافة قطاع جديد
  async addWasteSector(
    sector: { name: string; description?: string },
  ): Promise<WasteSector | null> {
    try {
      const { data, error } = await supabase!
        .from("waste_sectors")
        .insert([sector])
        .select()
        .single();

      if (error) {
        console.error("خطأ في إضافة القطاع:", error);
        toast.error(`حدث خطأ أثناء إضافة القطاع: ${error.message}`);
        return null;
      }

      toast.success("تم إضافة القطاع بنجاح");
      return data;
    } catch (error) {
      console.error("خطأ في إضافة القطاع:", error);
      toast.error(
        `حدث خطأ أثناء إضافة القطاع: ${
          error instanceof Error ? error.message : "خطأ غير معروف"
        }`,
      );
      return null;
    }
  }

  // إضافة نوع عميل جديد
  async addClientType(
    clientType: { sector_id: number; name: string; description?: string },
  ): Promise<ClientType | null> {
    try {
      const { data, error } = await supabase!
        .from("client_types")
        .insert([clientType])
        .select()
        .single();

      if (error) {
        console.error("خطأ في إضافة نوع العميل:", error);
        toast.error(`حدث خطأ أثناء إضافة نوع العميل: ${error.message}`);
        return null;
      }

      toast.success("تم إضافة نوع العميل بنجاح");
      return data;
    } catch (error) {
      console.error("خطأ في إضافة نوع العميل:", error);
      toast.error(
        `حدث خطأ أثناء إضافة نوع العميل: ${
          error instanceof Error ? error.message : "خطأ غير معروف"
        }`,
      );
      return null;
    }
  }

  // إضافة مصدر مخلفات جديد
  async addWasteSource(
    source: { id: string; name: string; description?: string },
  ): Promise<{ id: string; name: string; description?: string } | null> {
    try {
      console.log("محاولة إضافة مصدر مخلفات:", source);

      const { data, error } = await supabase!
        .from("waste_sources")
        .insert([source])
        .select()
        .single();

      if (error) {
        console.error("خطأ Supabase في إضافة مصدر المخلفات:", error);
        toast.error(
          `حدث خطأ أثناء إضافة مصدر المخلفات: ${
            error.message || "خطأ غير معروف"
          }`,
        );
        return null;
      }

      console.log("تم إضافة مصدر المخلفات بنجاح:", data);
      toast.success("تم إضافة مصدر المخلفات بنجاح");
      return data;
    } catch (error) {
      console.error("خطأ في إضافة مصدر المخلفات:", error);
      const errorMessage = error instanceof Error
        ? error.message
        : "خطأ غير معروف";
      toast.error(`حدث خطأ أثناء إضافة مصدر المخلفات: ${errorMessage}`);
      return null;
    }
  }

  // إضافة سبب مصدر جديد
  async addSourceReason(
    reason: { name: string; description?: string },
  ): Promise<SourceReason | null> {
    try {
      console.log("محاولة إضافة سبب مصدر:", reason);

      const { data, error } = await supabase!
        .from("source_reasons")
        .insert([reason])
        .select()
        .single();

      if (error) {
        console.error("خطأ Supabase في إضافة سبب المصدر:", error);
        toast.error(
          `حدث خطأ أثناء إضافة سبب المصدر: ${error.message || "خطأ غير معروف"}`,
        );
        return null;
      }

      console.log("تم إضافة سبب المصدر بنجاح:", data);
      toast.success("تم إضافة سبب المصدر بنجاح");
      return data;
    } catch (error) {
      console.error("خطأ في إضافة سبب المصدر:", error);
      const errorMessage = error instanceof Error
        ? error.message
        : "خطأ غير معروف";
      toast.error(`حدث خطأ أثناء إضافة سبب المصدر: ${errorMessage}`);
      return null;
    }
  }

  // إضافة ربط بين القطاع ونوع العميل والمصدر والسبب
  async addSectorClientSourceReasonLink(link: {
    sector_id: number;
    client_type_id: number;
    source_id: string;
    reason_id: number;
    priority_order?: number;
  }): Promise<boolean> {
    try {
      const { error } = await supabase!
        .from("sector_client_source_reason")
        .insert([{
          ...link,
          priority_order: link.priority_order || 0,
          is_active: true,
        }]);

      if (error) {
        console.error("خطأ في إضافة الربط:", error);
        toast.error(`حدث خطأ أثناء إضافة الربط: ${error.message}`);
        return false;
      }

      toast.success("تم إضافة الربط بنجاح");
      return true;
    } catch (error) {
      console.error("خطأ في إضافة الربط:", error);
      toast.error(
        `حدث خطأ أثناء إضافة الربط: ${
          error instanceof Error ? error.message : "خطأ غير معروف"
        }`,
      );
      return false;
    }
  }

  // جلب أنواع البلاستيك (المستوى الثالث)
  async getPlasticTypes(subCategoryId?: number): Promise<PlasticType[]> {
    try {
      let query = supabase!.from("plastic_types").select("*");
      
      if (subCategoryId) {
        query = query.eq("sub_id", subCategoryId);
      }
      
      const { data, error } = await query.order("name");

      if (error) {
        console.warn("خطأ في جلب أنواع البلاستيك:", error.message);
        return this.getDefaultPlasticTypes();
      }

      return (data && data.length > 0) ? data : this.getDefaultPlasticTypes();
    } catch (error) {
      return this.getDefaultPlasticTypes();
    }
  }

  private getDefaultPlasticTypes(): PlasticType[] {
    return [
      { id: 1, code: 'PET', name: 'PET (1)', description: 'بولي إيثيلين تيريفثاليت - زجاجات المياه والمشروبات' },
      { id: 2, code: 'HDPE', name: 'HDPE (2)', description: 'بولي إيثيلين عالي الكثافة - عبوات المنظفات والشامبو' },
      { id: 3, code: 'PVC', name: 'PVC (3)', description: 'بولي فينيل كلوريد - أنابيب ومواد بناء' },
      { id: 4, code: 'LDPE', name: 'LDPE (4)', description: 'بولي إيثيلين منخفض الكثافة - أكياس التسوق' },
      { id: 5, code: 'PP', name: 'PP (5)', description: 'بولي بروبيلين - أغطية الزجاجات وعلب الزبادي' },
      { id: 6, code: 'PS', name: 'PS (6)', description: 'بوليسترين - أكواب القهوة وعلب الطعام' },
      { id: 7, code: 'OTHER', name: 'OTHER (7)', description: 'أنواع أخرى من البلاستيك' }
    ];
  }

  // جلب أنواع المعادن (المستوى الثالث)
  async getMetalTypes(subCategoryId?: number): Promise<MetalType[]> {
    try {
      let query = supabase!.from("metal_types").select("*");
      
      if (subCategoryId) {
        query = query.eq("sub_id", subCategoryId);
      }

      const { data, error } = await query.order("name");

      if (error) {
        console.warn("خطأ في جلب أنواع المعادن:", error.message);
        return this.getDefaultMetalTypes();
      }

      return (data && data.length > 0) ? data : this.getDefaultMetalTypes();
    } catch (error) {
      return this.getDefaultMetalTypes();
    }
  }

  private getDefaultMetalTypes(): MetalType[] {
    return [
      { id: 1, name: 'ألمنيوم (Aluminum)' },
      { id: 2, name: 'حديد (Iron/Steel)' },
      { id: 3, name: 'نحاس (Copper)' },
      { id: 4, name: 'نحاس أصفر (Brass)' },
      { id: 5, name: 'رصاص (Lead)' },
      { id: 6, name: 'ستانلس ستيل (Stainless Steel)' },
      { id: 7, name: 'خردة مختلطة (Mixed Scrap)' }
    ];
  }

  // إضافة نوع بلاستيك جديد
  async addPlasticType(plasticType: { code: string; name: string; description?: string }): Promise<PlasticType | null> {
    try {
      const { data, error } = await supabase!
        .from("plastic_types")
        .insert([plasticType])
        .select()
        .single();

      if (error) {
        console.error("خطأ في إضافة نوع البلاستيك:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("خطأ في إضافة نوع البلاستيك:", error);
      return null;
    }
  }

  // إضافة نوع معدن جديد
  async addMetalType(metalType: { name: string }): Promise<MetalType | null> {
    try {
      const { data, error } = await supabase!
        .from("metal_types")
        .insert([metalType])
        .select()
        .single();

      if (error) {
        console.error("خطأ في إضافة نوع المعدن:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("خطأ في إضافة نوع المعدن:", error);
      return null;
    }
  }
}

export const wasteCatalogService = new WasteCatalogService();
