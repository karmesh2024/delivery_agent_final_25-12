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
  created_at?: string;
}

// واجهات جديدة للنظام المحسن
export interface WasteSector {
  id: number;
  name: string;
  description?: string;
}

export interface ClientType {
  id: number;
  sector_id: number;
  name: string;
  description?: string;
}

export interface SourceReason {
  id: number;
  name: string;
  description?: string;
}

export interface WasteMainCategory {
  id: number;
  code: string;
  name: string;
}

export interface WasteSubCategory {
  id: number;
  code: string;
  name: string;
  main_id: number;
}

export interface PlasticType {
  id: number;
  code: string;
  name: string;
  description?: string;
}

export interface MetalType {
  id: number;
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
      // تحضير البيانات للحفظ
      const wasteData = {
        ...waste,
        // حفظ الحقول الجديدة
        sector_id: waste.sector_id || null,
        client_type_id: waste.client_type_id || null,
        source_code: waste.source_code || null,
        reason_id: waste.reason_id || null,
        // الحفاظ على التوافق الخلفي
        source: waste.source_code || waste.source || null,
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
  async updateWaste(
    id: number,
    waste: Partial<WasteCatalogItem>,
  ): Promise<WasteCatalogItem | null> {
    try {
      const { data, error } = await supabase!
        .from("catalog_waste_materials")
        .update(waste)
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
      const { data, error } = await supabase!
        .from("catalog_waste_materials")
        .select(`
          *,
          warehouse:warehouses(name),
          main_category:waste_main_categories(name),
          sub_category:waste_sub_categories(name),
          unit:units(name),
          related_product:catalog_products(name, sku)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("خطأ في جلب المخلفات:", error);
        toast.error("حدث خطأ أثناء جلب المخلفات");
        return [];
      }

      return data || [];
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
          main_category:waste_main_categories(name),
          sub_category:waste_sub_categories(name),
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

  // جلب الفئات الأساسية للمخلفات
  async getWasteMainCategories(): Promise<WasteMainCategory[]> {
    try {
      const { data, error } = await supabase!
        .from("waste_main_categories")
        .select("*")
        .order("name");

      if (error) {
        console.error("خطأ في جلب فئات المخلفات الأساسية:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("خطأ في جلب فئات المخلفات الأساسية:", error);
      return [];
    }
  }

  // جلب الفئات الفرعية للمخلفات
  async getWasteSubCategories(
    mainCategoryId?: number,
  ): Promise<WasteSubCategory[]> {
    try {
      let query = supabase!
        .from("waste_sub_categories")
        .select("*")
        .order("name");

      if (mainCategoryId) {
        query = query.eq("main_id", mainCategoryId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("خطأ في جلب فئات المخلفات الفرعية:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("خطأ في جلب فئات المخلفات الفرعية:", error);
      return [];
    }
  }

  // إضافة فئة أساسية جديدة للمخلفات
  async addWasteMainCategory(
    code: string,
    name: string,
  ): Promise<WasteMainCategory | null> {
    try {
      const { data, error } = await supabase!
        .from("waste_main_categories")
        .insert([{ code, name }])
        .select()
        .single();

      if (error) {
        console.error("خطأ في إضافة فئة المخلفات الأساسية:", error);
        toast.error(`حدث خطأ أثناء إضافة الفئة: ${error.message}`);
        return null;
      }

      toast.success("تم إضافة فئة المخلفات الأساسية بنجاح");
      return data;
    } catch (error) {
      console.error("خطأ في إضافة فئة المخلفات الأساسية:", error);
      toast.error(
        `حدث خطأ أثناء إضافة الفئة: ${
          error instanceof Error ? error.message : "خطأ غير معروف"
        }`,
      );
      return null;
    }
  }

  // إضافة فئة فرعية جديدة للمخلفات
  async addWasteSubCategory(
    code: string,
    name: string,
    mainId: number,
  ): Promise<WasteSubCategory | null> {
    try {
      const { data, error } = await supabase!
        .from("waste_sub_categories")
        .insert([{ code, name, main_id: mainId }])
        .select()
        .single();

      if (error) {
        console.error("خطأ في إضافة فئة المخلفات الفرعية:", error);
        toast.error(`حدث خطأ أثناء إضافة الفئة الفرعية: ${error.message}`);
        return null;
      }

      toast.success("تم إضافة فئة المخلفات الفرعية بنجاح");
      return data;
    } catch (error) {
      console.error("خطأ في إضافة فئة المخلفات الفرعية:", error);
      toast.error(
        `حدث خطأ أثناء إضافة الفئة الفرعية: ${
          error instanceof Error ? error.message : "خطأ غير معروف"
        }`,
      );
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
        .select("id, name, symbol")
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
      const { data, error } = await supabase!
        .from("warehouse_sectors")
        .select("sector_code")
        .order("sector_code");

      if (error) {
        console.error("خطأ في جلب القطاعات:", error);
        return [];
      }

      // تحويل البيانات إلى تنسيق WasteSector مع إزالة التكرار
      const uniqueSectors =
        data?.reduce((acc: WasteSector[], item: { sector_code: string }) => {
          const existingSector = acc.find((s) => s.name === item.sector_code);
          if (!existingSector) {
            acc.push({
              id: acc.length + 1, // ID مؤقت
              name: this.getSectorDisplayName(item.sector_code),
              description: this.getSectorDescription(item.sector_code),
            });
          }
          return acc;
        }, []) || [];

      return uniqueSectors;
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
        console.error("خطأ في جلب أنواع العملاء:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("خطأ في جلب أنواع العملاء:", error);
      return [];
    }
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
        console.error("خطأ في جلب المصادر المتاحة:", error);
        return [];
      }

      return data?.map((item: AvailableSourceData) => {
        // Handle case where waste_sources might be an array
        const source = Array.isArray(item.waste_sources)
          ? item.waste_sources[0]
          : item.waste_sources;
        return {
          id: parseInt(source.id) || 0, // Convert string ID to number
          code: source.id.toString(),
          name: source.name,
        };
      }) || [];
    } catch (error) {
      console.error("خطأ في جلب المصادر المتاحة:", error);
      return [];
    }
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
        console.error("خطأ في جلب الأسباب المتاحة:", error);
        return [];
      }

      return data?.map((item: AvailableReasonData) => {
        // Handle case where source_reasons might be an array
        const reason = Array.isArray(item.source_reasons)
          ? item.source_reasons[0]
          : item.source_reasons;
        return {
          id: reason.id,
          name: reason.name,
          description: reason.description,
        };
      }) || [];
    } catch (error) {
      console.error("خطأ في جلب الأسباب المتاحة:", error);
      return [];
    }
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
}

export const wasteCatalogService = new WasteCatalogService();
